<?php
// api/po.php
require_once 'connection-pdo.php';
require_once 'StockManager.php';

$pdo = $conn;

header('Content-Type: application/json');
$action = $_REQUEST['action'] ?? $_REQUEST['operation'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_reasons') {
    $appliesTo = $_GET['applies_to'] ?? 'purchase_return';
    $stmt = $pdo->prepare("SELECT id, name, requires_note FROM tbl_inventory_reasons WHERE (applies_to = ? OR applies_to = 'all') AND is_active = 1 ORDER BY sort_order ASC");
    $stmt->execute([$appliesTo]);
    echo json_encode(['success' => true, 'reasons' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_pos') {
    $stmt = $pdo->prepare("
        SELECT po.*, s.company_name,
               (SELECT COUNT(*) FROM tbl_po_items poi WHERE poi.po_id = po.po_id) as item_count,
               (SELECT SUM(qty_ordered) FROM tbl_po_items poi WHERE poi.po_id = po.po_id) as total_ordered,
               (SELECT SUM(received_qty) FROM tbl_po_items poi WHERE poi.po_id = po.po_id) as total_received,
               (SELECT SUM(returned_qty) FROM tbl_po_items poi WHERE poi.po_id = po.po_id) as total_returned,
               (SELECT GROUP_CONCAT(CONCAT(p.product_name, ' (', poi.qty_ordered, ')') SEPARATOR ', ') 
                FROM tbl_po_items poi 
                JOIN tbl_products p ON poi.product_id = p.product_id 
                WHERE poi.po_id = po.po_id) as product_names
        FROM tbl_purchase_orders po
        JOIN tbl_suppliers s ON po.supplier_id = s.supplier_id
        ORDER BY po.po_id DESC
    ");
    $stmt->execute();
    echo json_encode(['success' => true, 'purchase_orders' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_po_details') {
    $poId = $_GET['po_id'] ?? null;
    if (!$poId) {
        echo json_encode(['success' => false, 'error' => 'Missing PO ID']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT po.*, s.company_name 
        FROM tbl_purchase_orders po 
        JOIN tbl_suppliers s ON po.supplier_id = s.supplier_id 
        WHERE po.po_id = ?
    ");
    $stmt->execute([$poId]);
    $po = $stmt->fetch(PDO::FETCH_ASSOC);

    $itemsStmt = $pdo->prepare("
        SELECT poi.*, p.product_name, p.sku, p.category_id, c.category_name 
        FROM tbl_po_items poi 
        JOIN tbl_products p ON poi.product_id = p.product_id 
        LEFT JOIN tbl_categories c ON p.category_id = c.category_id
        WHERE poi.po_id = ?
    ");
    $itemsStmt->execute([$poId]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        $batchCountStmt = $pdo->prepare("SELECT COUNT(*) FROM tbl_batches WHERE product_id = ?");
        $batchCountStmt->execute([$item['product_id']]);
        $count = (int)$batchCountStmt->fetchColumn();
        $item['next_lot_number'] = (string)($count + 1);
    }

    echo json_encode(['success' => true, 'po' => $po, 'items' => $items]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_po') {
    $data = json_decode(file_get_contents('php://input'), true);
    $supplierId = $data['supplier_id'] ?? null;
    $expectedDate = !empty($data['expected_date']) ? $data['expected_date'] : null;
    $items = $data['items'] ?? [];

    if (!$supplierId || empty($items)) {
        echo json_encode(['success' => false, 'error' => 'Supplier and at least one item line are required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $poNumber = 'PO-' . date('Ymd') . '-' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO tbl_purchase_orders (po_number, supplier_id, status, expected_date) VALUES (?, ?, 'Pending', ?)");
        $stmt->execute([$poNumber, $supplierId, $expectedDate]);
        $poId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("INSERT INTO tbl_po_items (po_id, product_id, qty_ordered, received_qty, returned_qty) VALUES (?, ?, ?, 0, 0)");
        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? $it['qty_ordered'] ?? 0);
            if ($qty > 0) {
                $itemStmt->execute([$poId, $it['product_id'], $qty]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'po_number' => $poNumber]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'receive') {
    $data = json_decode(file_get_contents('php://input'), true);
    $poId = $data['po_id'] ?? null;
    $drNumber = trim($data['dr_number'] ?? '');
    $note = trim($data['note'] ?? '');
    $items = $data['items'] ?? [];
    $branchId = 1;
    $userId = 1;

    if (!$poId || empty($items)) {
        echo json_encode(['success' => false, 'error' => 'No lines entered to receive.']);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT supplier_id, status FROM tbl_purchase_orders WHERE po_id = ? FOR UPDATE");
        $stmt->execute([$poId]);
        $po = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$po) throw new Exception("Purchase Order not found.");
        if ($po['status'] === 'Closed') throw new Exception("Cannot receive stock on a Closed PO.");

        $receiptNo = 'GR-' . date('YmdHis') . '-' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO tbl_goods_receipts (receipt_no, po_id, supplier_id, delivery_receipt_no, note, received_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$receiptNo, $poId, $po['supplier_id'], $drNumber, $note, $userId]);
        $receiptId = $pdo->lastInsertId();

        $receivedAnything = false;

        foreach ($items as $item) {
            $poItemId = $item['po_item_id'];
            $productId = $item['product_id'];
            $receiveQty = (float)$item['quantity'];
            $lotNumber = trim($item['lot_number'] ?? '');
            $expiryDate = $item['expiry_date'] ?? null;

            if ($receiveQty <= 0) continue;

            if (empty($lotNumber) || empty($expiryDate)) {
                throw new Exception("Lot Number and Expiry Date are MANDATORY for all received items.");
            }

            $receivedAnything = true;

            $stmt = $pdo->prepare("SELECT qty_ordered, received_qty FROM tbl_po_items WHERE po_item_id = ? FOR UPDATE");
            $stmt->execute([$poItemId]);
            $poLine = $stmt->fetch(PDO::FETCH_ASSOC);

            $remaining = (float)$poLine['qty_ordered'] - (float)$poLine['received_qty'];
            if ($receiveQty > $remaining) {
                throw new Exception("Received quantity ({$receiveQty}) exceeds line remaining balance ({$remaining}).");
            }

            $stmt = $pdo->prepare("UPDATE tbl_po_items SET received_qty = received_qty + ? WHERE po_item_id = ?");
            $stmt->execute([$receiveQty, $poItemId]);

            $stmt = $pdo->prepare("INSERT INTO tbl_goods_receipt_items (receipt_id, po_item_id, product_id, quantity, lot_number, expiry_date) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$receiptId, $poItemId, $productId, $receiveQty, $lotNumber, $expiryDate]);

            $stockManager->adjustStock($productId, $branchId, $receiveQty, 'PO_RECEIPT', $userId, null, 'GR', $receiptId, $note);

            $batchStmt = $pdo->prepare("
                SELECT batch_id 
                FROM tbl_batches 
                WHERE product_id = ? AND branch_id = ? AND lot_number = ? AND expiry_date = ?
            ");
            $batchStmt->execute([$productId, $branchId, $lotNumber, $expiryDate]);
            $existingBatch = $batchStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingBatch) {
                $updStmt = $pdo->prepare("UPDATE tbl_batches SET quantity = quantity + ? WHERE batch_id = ?");
                $updStmt->execute([$receiveQty, $existingBatch['batch_id']]);
            } else {
                $insStmt = $pdo->prepare("INSERT INTO tbl_batches (product_id, branch_id, lot_number, expiry_date, quantity) VALUES (?, ?, ?, ?, ?)");
                $insStmt->execute([$productId, $branchId, $lotNumber, $expiryDate, $receiveQty]);
            }
        }

        if (!$receivedAnything) {
            throw new Exception("At least one line item must have a quantity greater than zero.");
        }

        $stmt = $pdo->prepare("SELECT SUM(qty_ordered) as ordered, SUM(received_qty) as received FROM tbl_po_items WHERE po_id = ?");
        $stmt->execute([$poId]);
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);

        $newStatus = ($totals['received'] >= $totals['ordered']) ? 'Received' : 'Partially Received';
        $stmt = $pdo->prepare("UPDATE tbl_purchase_orders SET status = ? WHERE po_id = ?");
        $stmt->execute([$newStatus, $poId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'receipt_no' => $receiptNo, 'receipt_id' => $receiptId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'purchase_return') {
    $data = json_decode(file_get_contents('php://input'), true);
    $poId = $data['po_id'] ?? null;
    $reasonId = $data['reason_id'] ?? null;
    $note = trim($data['note'] ?? '');
    $items = $data['items'] ?? [];
    $fromNonSellable = !empty($data['from_non_sellable']); 
    $branchId = 1;
    $userId = 1;

    if (!$poId || !$reasonId || empty($items)) {
        echo json_encode(['success' => false, 'error' => 'Missing return parameters or reason selection.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT name, requires_note FROM tbl_inventory_reasons WHERE id = ?");
    $stmt->execute([$reasonId]);
    $reason = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($reason && $reason['requires_note'] && empty($note)) {
        echo json_encode(['success' => false, 'error' => "An explanatory note is required for reason: '{$reason['name']}'."]);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT supplier_id FROM tbl_purchase_orders WHERE po_id = ?");
        $stmt->execute([$poId]);
        $po = $stmt->fetch(PDO::FETCH_ASSOC);

        $prNo = 'PR-' . date('YmdHis') . '-' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO tbl_purchase_returns (pr_no, po_id, supplier_id, returned_by, reason_id, note, status) VALUES (?, ?, ?, ?, ?, ?, 'Created')");
        $stmt->execute([$prNo, $poId, $po['supplier_id'], $userId, $reasonId, $note]);
        $prId = $pdo->lastInsertId();

        $returnedAnything = false;

        foreach ($items as $item) {
            $poItemId = $item['po_item_id'];
            $productId = $item['product_id'];
            $returnQty = (float)$item['quantity'];
            $replacementExpected = !empty($item['replacement_expected']) ? 1 : 0;

            if ($returnQty <= 0) continue;
            $returnedAnything = true;

            $stmt = $pdo->prepare("SELECT received_qty, returned_qty FROM tbl_po_items WHERE po_item_id = ? FOR UPDATE");
            $stmt->execute([$poItemId]);
            $poLine = $stmt->fetch(PDO::FETCH_ASSOC);

            $returnable = (float)$poLine['received_qty'] - (float)$poLine['returned_qty'];
            if ($returnQty > $returnable) {
                throw new Exception("Return quantity ({$returnQty}) exceeds net received returnable balance ({$returnable}).");
            }

            $invStmt = $pdo->prepare("SELECT quantity, non_sellable_qty FROM tbl_inventory WHERE product_id = ? AND branch_id = ? FOR UPDATE");
            $invStmt->execute([$productId, $branchId]);
            $inv = $invStmt->fetch(PDO::FETCH_ASSOC);
            
            $currentStock = $inv ? (float)($fromNonSellable ? $inv['non_sellable_qty'] : $inv['quantity']) : 0;
            
            if ($returnQty > $currentStock) {
                $bucketName = $fromNonSellable ? 'non-sellable' : 'sellable';
                throw new Exception("Return quantity ({$returnQty}) exceeds current {$bucketName} stock on hand ({$currentStock}).");
            }

            if ($replacementExpected) {
                $stmt = $pdo->prepare("UPDATE tbl_po_items SET returned_qty = returned_qty + ?, received_qty = received_qty - ? WHERE po_item_id = ?");
                $stmt->execute([$returnQty, $returnQty, $poItemId]);
            } else {
                $stmt = $pdo->prepare("UPDATE tbl_po_items SET returned_qty = returned_qty + ?, received_qty = received_qty - ?, qty_ordered = qty_ordered - ? WHERE po_item_id = ?");
                $stmt->execute([$returnQty, $returnQty, $returnQty, $poItemId]);
            }

            $stmt = $pdo->prepare("INSERT INTO tbl_purchase_return_items (pr_id, po_item_id, product_id, quantity, replacement_expected) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$prId, $poItemId, $productId, $returnQty, $replacementExpected]);

            $stockManager->adjustStock($productId, $branchId, -$returnQty, 'PURCHASE_RETURN', $userId, $reasonId, 'PR', $prId, $note, $fromNonSellable);
        }

        if (!$returnedAnything) {
            throw new Exception("At least one line item must have a return quantity greater than zero.");
        }

        $stmt = $pdo->prepare("SELECT SUM(qty_ordered) as ordered, SUM(received_qty) as received FROM tbl_po_items WHERE po_id = ?");
        $stmt->execute([$poId]);
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($totals['received'] <= 0) {
            $newStatus = 'Pending';
        } elseif ($totals['received'] < $totals['ordered']) {
            $newStatus = 'Partially Received';
        } else {
            $newStatus = 'Received';
        }
        
        $stmt = $pdo->prepare("UPDATE tbl_purchase_orders SET status = ? WHERE po_id = ?");
        $stmt->execute([$newStatus, $poId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'pr_id' => $prId, 'pr_no' => $prNo]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_return_claim') {
    $prId = $_POST['pr_id'] ?? null;
    $status = $_POST['status'] ?? 'Created';
    $creditNoteNo = trim($_POST['credit_note_no'] ?? '');
    $photoUrl = null;

    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/returns/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $ext = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
        $fileName = 'PR_CLAIM_' . time() . '_' . rand(100,999) . '.' . $ext;
        move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $fileName);
        $photoUrl = 'uploads/returns/' . $fileName;
    }

    try {
        $sql = "UPDATE tbl_purchase_returns SET status = ?, credit_note_no = ?" . ($photoUrl ? ", return_photo_url = ?" : "") . " WHERE pr_id = ?";
        $params = $photoUrl ? [$status, $creditNoteNo, $photoUrl, $prId] : [$status, $creditNoteNo, $prId];
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_returns') {
    $stmt = $pdo->prepare("
        SELECT pr.*, po.po_number, s.company_name, r.name as reason_name
        FROM tbl_purchase_returns pr
        JOIN tbl_purchase_orders po ON pr.po_id = po.po_id
        JOIN tbl_suppliers s ON pr.supplier_id = s.supplier_id
        LEFT JOIN tbl_inventory_reasons r ON pr.reason_id = r.id
        ORDER BY pr.pr_id DESC
    ");
    $stmt->execute();
    echo json_encode(['success' => true, 'returns' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'close_po') {
    $data = json_decode(file_get_contents('php://input'), true);
    $poId = $data['po_id'] ?? null;
    $reason = $data['reason_id'] ?? null; 
    $note = trim($data['note'] ?? '');

    if (!$poId || !$reason) {
        echo json_encode(['success' => false, 'error' => 'Cancellation reason required to close PO.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("UPDATE tbl_purchase_orders SET status = 'Closed' WHERE po_id = ?");
        $stmt->execute([$poId]);
        
        $logDesc = "Cancelled Purchase Order ID: " . $poId . ($note ? " | Note: " . $note : "");
        $logStmt = $pdo->prepare("INSERT INTO tbl_system_logs (action_type, description) VALUES ('PO_CANCEL', ?)");
        $logStmt->execute([$logDesc]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_receipt_details') {
    $receiptId = $_GET['receipt_id'] ?? null;
    $receiptNo = $_GET['receipt_no'] ?? null;
    $poId = $_GET['po_id'] ?? null;

    if (!$receiptId && !$receiptNo && !$poId) {
        echo json_encode(['success' => false, 'error' => 'Missing Receipt ID, Receipt Number, or PO ID']);
        exit;
    }

    $whereClause = "";
    $param = null;

    if ($receiptId) {
        $whereClause = "gr.id = ?";
        $param = $receiptId;
    } elseif ($receiptNo) {
        $whereClause = "gr.receipt_no = ?";
        $param = $receiptNo;
    } else {
        $whereClause = "gr.po_id = ? ORDER BY gr.id DESC LIMIT 1";
        $param = $poId;
    }

    $sql = "
        SELECT gr.*, po.po_number, s.company_name, s.supplier_code, s.contact_name, s.contact_phone,
               COALESCE(u.full_name, 'Admin') as received_by_name
        FROM tbl_goods_receipts gr
        LEFT JOIN tbl_purchase_orders po ON gr.po_id = po.po_id
        LEFT JOIN tbl_suppliers s ON gr.supplier_id = s.supplier_id
        LEFT JOIN tbl_users u ON gr.received_by = u.user_id
        WHERE {$whereClause}
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$param]);
    $receipt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$receipt) {
        echo json_encode(['success' => false, 'error' => 'Goods Receipt record not found.']);
        exit;
    }

    $itemsStmt = $pdo->prepare("
        SELECT gri.*, p.sku, p.product_name, p.unit_of_measure, p.unit_cost,
               (gri.quantity * p.unit_cost) as line_total
        FROM tbl_goods_receipt_items gri
        JOIN tbl_products p ON gri.product_id = p.product_id
        WHERE gri.receipt_id = ?
    ");
    $itemsStmt->execute([$receipt['id']]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    $settStmt = $pdo->prepare("SELECT setting_value FROM tbl_system_settings WHERE setting_key = 'company_name'");
    $settStmt->execute();
    $companyName = $settStmt->fetchColumn() ?: 'ApexLogix Enterprise';

    echo json_encode([
        'success' => true,
        'company_name' => $companyName,
        'receipt' => $receipt,
        'items' => $items
    ]);
    exit;
}
?>