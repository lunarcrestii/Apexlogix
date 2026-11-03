<?php
// api/products.php
require_once 'connection-pdo.php';
require_once 'StockManager.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? $_GET['operation'] ?? $_POST['operation'] ?? '';

if ($action === 'getAllProducts') {
    $action = 'get_products';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_uoms') {
    try {
        $stmt = $pdo->query("SELECT uom_id, uom_code, uom_name FROM tbl_uoms ORDER BY uom_name ASC");
        $uoms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Auto-seed default UOMs into database if tbl_uoms is currently empty
        if (empty($uoms)) {
            $defaultUoms = ['Case', 'Box', 'Pack', 'Carton', 'Bundle', 'Dozen', 'Bag', 'Sack', 'Tray', 'Crate'];
            $insertStmt = $pdo->prepare("INSERT INTO tbl_uoms (uom_code, uom_name) VALUES (?, ?)");
            foreach ($defaultUoms as $uName) {
                $insertStmt->execute([strtoupper($uName), $uName]);
            }
            $stmt = $pdo->query("SELECT uom_id, uom_code, uom_name FROM tbl_uoms ORDER BY uom_name ASC");
            $uoms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(['success' => true, 'uoms' => $uoms]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_reasons') {
    $appliesTo = $_GET['applies_to'] ?? 'stock_return';
    if ($appliesTo === 'all') {
        $stmt = $pdo->prepare("SELECT id, name, requires_note FROM tbl_inventory_reasons WHERE is_active = 1 ORDER BY sort_order ASC");
        $stmt->execute();
    } else {
        $stmt = $pdo->prepare("SELECT id, name, requires_note FROM tbl_inventory_reasons WHERE (applies_to = ? OR applies_to = 'all') AND is_active = 1 ORDER BY sort_order ASC");
        $stmt->execute([$appliesTo]);
    }
    echo json_encode(['success' => true, 'reasons' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_products') {
    $branchId = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 1;
    $forPos = !empty($_GET['for_pos']);

    $whereClause = "WHERE p.is_active = 1";
    if ($forPos) {
        // POS ONLY retrieves products with sellable stock (> 0) in the specified store outlet
        $whereClause .= " AND COALESCE(i.quantity, 0) > 0";
    }

    $stmt = $pdo->prepare("
        SELECT p.*, c.category_name, 
               COALESCE(i.quantity, 0) as sellable_qty, 
               COALESCE(i.non_sellable_qty, 0) as non_sellable_qty,
               COALESCE(i.quantity, 0) as qty_on_hand,
               pc.pack_uom_id,
               pc.pieces_per_pack,
               u.uom_code AS pack_uom_code,
               u.uom_name AS pack_uom_name
        FROM tbl_products p 
        LEFT JOIN tbl_categories c ON p.category_id = c.category_id 
        LEFT JOIN tbl_inventory i ON p.product_id = i.product_id AND i.branch_id = ?
        LEFT JOIN tbl_pack_conversions pc ON p.product_id = pc.product_id
        LEFT JOIN tbl_uoms u ON pc.pack_uom_id = u.uom_id
        {$whereClause}
        ORDER BY p.product_name ASC
    ");
    $stmt->execute([$branchId]);
    
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (isset($_GET['operation']) && $_GET['operation'] === 'getAllProducts') {
        echo json_encode($products);
    } else {
        echo json_encode(['success' => true, 'products' => $products]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'save_product') {
    $data = json_decode(file_get_contents('php://input'), true);
    $sku = trim($data['sku'] ?? '');
    $productName = trim($data['product_name'] ?? '');
    $categoryId = (int)($data['category_id'] ?? 0);
    $price = (float)($data['retail_price'] ?? 0);
    $unitCost = (float)($data['unit_cost'] ?? 0);
    $reorderLevel = (float)($data['reorder_level'] ?? 10.00);
    $suggestedReorderQty = (float)($data['suggested_reorder_qty'] ?? 50.00);
    $barcode = trim($data['barcode'] ?? '');
    $uom = trim($data['unit_of_measure'] ?? 'Piece');
    $taxRate = (float)($data['tax_rate'] ?? 12.00);
    $trackExpiry = (int)($data['track_expiry'] ?? 0);
    $packUomId = (int)($data['pack_uom_id'] ?? 0);
    $piecesPerPack = (float)($data['pieces_per_pack'] ?? 1.00);

    if (empty($sku) || empty($productName) || $categoryId <= 0) {
        echo json_encode(['success' => false, 'error' => 'SKU, Title, and Category are required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO tbl_products (sku, barcode, product_name, category_id, unit_of_measure, retail_price, unit_cost, reorder_level, suggested_reorder_qty, tax_rate, track_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$sku, $barcode, $productName, $categoryId, $uom, $price, $unitCost, $reorderLevel, $suggestedReorderQty, $taxRate, $trackExpiry]);
        $productId = $pdo->lastInsertId();

        $inv = $pdo->prepare("INSERT INTO tbl_inventory (product_id, branch_id, quantity, non_sellable_qty) VALUES (?, 1, 0, 0)");
        $inv->execute([$productId]);

        if ($packUomId > 0) {
    $pcStmt = $pdo->prepare("INSERT INTO tbl_pack_conversions (product_id, pack_uom_id, pieces_per_pack) VALUES (?, ?, ?)");
    $pcStmt->execute([$productId, $packUomId, max(1.00, $piecesPerPack)]);
}

        $pdo->commit();
        echo json_encode(['success' => true, 'product_id' => $productId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Product Save Failed: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'stock_return') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['product_id'] ?? null;
    $returnQty = (float)($data['quantity'] ?? 0);
    $reasonId = $data['reason_id'] ?? null;
    $note = trim($data['note'] ?? '');
    $branchId = 1;
    $userId = 1;

    if (!$productId || $returnQty <= 0 || !$reasonId) {
        echo json_encode(['success' => false, 'error' => 'Invalid product or return quantity.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT requires_note, name FROM tbl_inventory_reasons WHERE id = ?");
    $stmt->execute([$reasonId]);
    $reason = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($reason && $reason['requires_note'] && empty($note)) {
        echo json_encode(['success' => false, 'error' => "Note is required for reason: '{$reason['name']}'."]);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stockManager->adjustStock($productId, $branchId, -$returnQty, 'STOCK_RETURN', $userId, $reasonId, 'STOCK_RETURN', $productId, $note, false);
        $stockManager->adjustStock($productId, $branchId, $returnQty, 'STOCK_RETURN', $userId, $reasonId, 'STOCK_RETURN', $productId, 'Transferred to non-sellable warehouse stock', true);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'adjust_quantity') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['product_id'] ?? null;
    $mode = $data['mode'] ?? 'count';
    $value = (float)($data['value'] ?? 0);
    $reasonId = $data['reason_id'] ?? null;
    $note = trim($data['note'] ?? '');
    $passcode = trim($data['approved_by'] ?? '');
    $branchId = 1;

    if (!$productId || !$reasonId) {
        echo json_encode(['success' => false, 'error' => 'Product and Reason are required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("SELECT quantity FROM tbl_inventory WHERE product_id = ? AND branch_id = ? FOR UPDATE");
        $stmt->execute([$productId, $branchId]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$inv) throw new Exception("Inventory record not found.");
        
        $currentStock = (float)$inv['quantity'];
        
        $qtyChange = 0;
        if ($mode === 'count') {
            if ($value < 0) throw new Exception("Physical count cannot be negative.");
            $qtyChange = $value - $currentStock;
            $movementType = 'ADJUSTMENT_COUNT';
        } else {
            $qtyChange = $value;
            if (($currentStock + $qtyChange) < 0) {
                throw new Exception("Adjustment results in negative stock.");
            }
            $movementType = 'ADJUSTMENT_MANUAL';
        }

        if ($qtyChange == 0) {
            throw new Exception("No change in quantity detected.");
        }

        $userId = 1;

        if (abs($qtyChange) > 0) {
            if (empty($passcode)) {
                throw new Exception("Admin or Manager passcode is required for all stock adjustments.");
            }

            $userStmt = $pdo->prepare("
                SELECT user_id, full_name, role 
                FROM tbl_users 
                WHERE (password_hash = ? OR username = ?) 
                  AND role IN ('Admin', 'Manager') 
                  AND is_active = 1
            ");
            $userStmt->execute([$passcode, $passcode]);
            $approver = $userStmt->fetch(PDO::FETCH_ASSOC);

            if (!$approver) {
                throw new Exception("Access Denied: Invalid Admin/Manager passcode.");
            }

            $userId = $approver['user_id'];
            $note .= " [Approved by: {$approver['full_name']} ({$approver['role']})]";
        }

        $stockManager = new StockManager($pdo);
        $stockManager->adjustStock($productId, $branchId, $qtyChange, $movementType, $userId, $reasonId, 'ADJUSTMENT', $productId, $note, false);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'return_to_supplier') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['product_id'] ?? null;
    $supplierId = $data['supplier_id'] ?? null;
    $returnQty = (float)($data['quantity'] ?? 0);
    $reasonId = $data['reason_id'] ?? null;
    $fromNonSellable = !empty($data['from_non_sellable']);
    $note = trim($data['note'] ?? '');
    $branchId = 1;
    $userId = 1;

    if (!$productId || !$supplierId || $returnQty <= 0 || !$reasonId) {
        echo json_encode(['success' => false, 'error' => 'Product, Supplier, Quantity, and Reason are required.']);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stockManager->adjustStock($productId, $branchId, -$returnQty, 'RTV_SUPPLIER', $userId, $reasonId, 'RTV', $productId, $note, $fromNonSellable);

        $poNumber = 'PO-' . date('Ymd') . '-' . rand(100, 999);
        $stmt = $pdo->prepare("INSERT INTO tbl_purchase_orders (po_number, supplier_id, status) VALUES (?, ?, 'Pending')");
        $stmt->execute([$poNumber, $supplierId]);
        $poId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("INSERT INTO tbl_po_items (po_id, product_id, qty_ordered, received_qty, returned_qty) VALUES (?, ?, ?, 0, 0)");
        $itemStmt->execute([$poId, $productId, $returnQty]);

        $pdo->commit();
        echo json_encode(['success' => true, 'po_number' => $poNumber]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_product') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['product_id'] ?? null;
    $sku = trim($data['sku'] ?? '');
    $productName = trim($data['product_name'] ?? '');
    $categoryId = (int)($data['category_id'] ?? 0);
    $price = (float)($data['retail_price'] ?? 0);
    $unitCost = (float)($data['unit_cost'] ?? 0);
    $reorderLevel = (float)($data['reorder_level'] ?? 10.00);
    $suggestedReorderQty = (float)($data['suggested_reorder_qty'] ?? 50.00);
    $barcode = trim($data['barcode'] ?? '');
    $uom = trim($data['unit_of_measure'] ?? 'Piece');
    $taxRate = (float)($data['tax_rate'] ?? 12.00);
    $trackExpiry = (int)($data['track_expiry'] ?? 0);
    $packUomId = (int)($data['pack_uom_id'] ?? 0);
    $piecesPerPack = (float)($data['pieces_per_pack'] ?? 1.00);

    if (!$productId || empty($sku) || empty($productName) || $categoryId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Product ID, SKU, Name, and Category are required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("UPDATE tbl_products SET sku = ?, barcode = ?, product_name = ?, category_id = ?, unit_of_measure = ?, retail_price = ?, unit_cost = ?, reorder_level = ?, suggested_reorder_qty = ?, tax_rate = ?, track_expiry = ? WHERE product_id = ?");
        $stmt->execute([$sku, $barcode, $productName, $categoryId, $uom, $price, $unitCost, $reorderLevel, $suggestedReorderQty, $taxRate, $trackExpiry, $productId]);
        
        $delStmt = $pdo->prepare("DELETE FROM tbl_pack_conversions WHERE product_id = ?");
$delStmt->execute([$productId]);

if ($packUomId > 0) {
    $pcStmt = $pdo->prepare("INSERT INTO tbl_pack_conversions (product_id, pack_uom_id, pieces_per_pack) VALUES (?, ?, ?)");
    $pcStmt->execute([$productId, $packUomId, max(1.00, $piecesPerPack)]);
}

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Product Update Failed: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'archive_product') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['product_id'] ?? null;

    if (!$productId) {
        echo json_encode(['success' => false, 'error' => 'Product ID is required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE tbl_products SET is_active = 0 WHERE product_id = ?");
        $stmt->execute([$productId]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'transfer_batch_to_nonsellable') {
    $data = json_decode(file_get_contents('php://input'), true);
    $batchId = (int)($data['batch_id'] ?? 0);
    $productId = (int)($data['product_id'] ?? 0);
    $qty = (float)($data['quantity'] ?? 0);
    $note = trim($data['note'] ?? 'Transferred expired batch to non-sellable');
    $branchId = 1;
    $userId = 1;

    if ($productId <= 0 || $qty <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid product or quantity.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Retrieve inventory reason ID for Expired items
        $rStmt = $pdo->prepare("SELECT id FROM tbl_inventory_reasons WHERE name LIKE '%Expired%' LIMIT 1");
        $rStmt->execute();
        $reasonRow = $rStmt->fetch(PDO::FETCH_ASSOC);
        $reasonId = $reasonRow ? (int)$reasonRow['id'] : 1;

        // 2. Deduct batch quantity from tbl_batches
        if ($batchId > 0) {
            $bStmt = $pdo->prepare("UPDATE tbl_batches SET quantity = GREATEST(0, quantity - ?) WHERE batch_id = ?");
            $bStmt->execute([$qty, $batchId]);
        }

        // 3. Move stock from Sellable to Non-Sellable
        $stockManager = new StockManager($pdo);
        
        // Deduct from sellable inventory
        $stockManager->adjustStock($productId, $branchId, -$qty, 'STOCK_RETURN', $userId, $reasonId, 'EXPIRED_BATCH', $batchId, $note, false);
        
        // Add to non-sellable inventory
        $stockManager->adjustStock($productId, $branchId, $qty, 'STOCK_RETURN', $userId, $reasonId, 'EXPIRED_BATCH', $batchId, 'Transferred expired batch to non-sellable warehouse stock', true);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
// ------------------------------------------------------------------------
// PERMANENT DISPOSAL OF NON-SELLABLE STOCK
// ------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'dispose_non_sellable') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = (int)($data['product_id'] ?? 0);
    $qty = (float)($data['quantity'] ?? 0);
    $reasonId = (int)($data['reason_id'] ?? 0);
    $note = trim($data['note'] ?? '');
    $branchId = 1;
    $userId = 1;

    if ($productId <= 0 || $qty <= 0 || $reasonId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Product, Quantity, and Reason are required.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stockManager = new StockManager($pdo);
        // Permanently deduct from non-sellable stock and log as DISPOSAL movement
        $stockManager->adjustStock($productId, $branchId, -$qty, 'DISPOSAL', $userId, $reasonId, 'DISPOSAL', $productId, $note, true);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
?>