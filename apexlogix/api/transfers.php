<?php
// api/transfers.php
require_once 'connection-pdo.php';
require_once 'StockManager.php';

$pdo = $conn;
header('Content-Type: application/json');
$action = $_REQUEST['action'] ?? $_REQUEST['operation'] ?? '';

// 1. Get Branches List
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_branches') {
    try {
        $stmt = $pdo->query("SELECT branch_id, branch_code, branch_name FROM tbl_branches WHERE is_active = 1 ORDER BY branch_id ASC");
        echo json_encode(['success' => true, 'branches' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 2. Get Transfer Records
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_transfers') {
    try {
        $stmt = $pdo->prepare("
            SELECT t.*, 
                   b1.branch_name as from_branch_name, 
                   b2.branch_name as to_branch_name,
                   (SELECT COUNT(*) FROM tbl_transfer_items ti WHERE ti.transfer_id = t.transfer_id) as line_count,
                   (SELECT SUM(quantity) FROM tbl_transfer_items ti WHERE ti.transfer_id = t.transfer_id) as total_units,
                   (SELECT GROUP_CONCAT(CONCAT(p.product_name, ' (', ti.quantity, ')') SEPARATOR ', ')
                    FROM tbl_transfer_items ti 
                    JOIN tbl_products p ON ti.product_id = p.product_id 
                    WHERE ti.transfer_id = t.transfer_id) as item_summary
            FROM tbl_transfers t
            JOIN tbl_branches b1 ON t.from_branch_id = b1.branch_id
            JOIN tbl_branches b2 ON t.to_branch_id = b2.branch_id
            ORDER BY t.transfer_id DESC
        ");
        $stmt->execute();
        echo json_encode(['success' => true, 'transfers' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 3. Draft Stock Release Voucher (Status: Pending)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_transfer') {
    $data = json_decode(file_get_contents('php://input'), true);
    $fromBranchId = (int)($data['from_branch_id'] ?? 1);
    $toBranchId = (int)($data['to_branch_id'] ?? 0);
    $note = trim($data['note'] ?? '');
    $items = $data['items'] ?? [];

    if ($toBranchId <= 0 || $fromBranchId === $toBranchId || empty($items)) {
        echo json_encode(['success' => false, 'error' => 'Please select a valid Store destination and at least one item.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $transferNo = 'TR-' . date('Ymd') . '-' . rand(100, 999);
        
        $stmt = $pdo->prepare("INSERT INTO tbl_transfers (transfer_no, from_branch_id, to_branch_id, status, note, created_by) VALUES (?, ?, ?, 'Pending', ?, 1)");
        $stmt->execute([$transferNo, $fromBranchId, $toBranchId, $note]);
        $transferId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("INSERT INTO tbl_transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)");
        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 0);
            if ($qty > 0) {
                $itemStmt->execute([$transferId, $it['product_id'], $qty]);
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'transfer_no' => $transferNo, 'transfer_id' => $transferId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 4. Release Stock Voucher (Pending -> Released)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'release_transfer') {
    $data = json_decode(file_get_contents('php://input'), true);
    $transferId = (int)($data['transfer_id'] ?? 0);

    if ($transferId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid Transfer ID']);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT * FROM tbl_transfers WHERE transfer_id = ? FOR UPDATE");
        $stmt->execute([$transferId]);
        $transfer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$transfer) throw new Exception("Transfer record not found.");
        if ($transfer['status'] !== 'Pending') throw new Exception("Transfer is already " . $transfer['status']);

        $itemsStmt = $pdo->prepare("SELECT * FROM tbl_transfer_items WHERE transfer_id = ?");
        $itemsStmt->execute([$transferId]);
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($items as $item) {
            $prodId = $item['product_id'];
            $qty = (float)$item['quantity'];

            // Ensure destination store inventory row exists
            $ensStmt = $pdo->prepare("INSERT IGNORE INTO tbl_inventory (branch_id, product_id, quantity, non_sellable_qty) VALUES (?, ?, 0, 0)");
            $ensStmt->execute([$transfer['to_branch_id'], $prodId]);

            // Deduct from Warehouse sellable stock
            $stockManager->adjustStock($prodId, $transfer['from_branch_id'], -$qty, 'STOCK_RETURN', 1, null, 'TRANSFER_OUT', $transferId, "Stock Release to Store (TR #{$transfer['transfer_no']})", false);

            // Add to Store sellable stock
            $stockManager->adjustStock($prodId, $transfer['to_branch_id'], $qty, 'PO_RECEIPT', 1, null, 'TRANSFER_IN', $transferId, "Stock Received from Warehouse (TR #{$transfer['transfer_no']})", false);
        }

        $updStmt = $pdo->prepare("UPDATE tbl_transfers SET status = 'Released', released_at = NOW() WHERE transfer_id = ?");
        $updStmt->execute([$transferId]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 5. Cancel Transfer Voucher
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'cancel_transfer') {
    $data = json_decode(file_get_contents('php://input'), true);
    $transferId = (int)($data['transfer_id'] ?? 0);

    try {
        $stmt = $pdo->prepare("UPDATE tbl_transfers SET status = 'Cancelled' WHERE transfer_id = ? AND status = 'Pending'");
        $stmt->execute([$transferId]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 6. Step 1: Store -> Warehouse Damaged Stock Return
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_store_return') {
    $data = json_decode(file_get_contents('php://input'), true);
    $fromBranchId = (int)($data['from_branch_id'] ?? 2); // Store
    $toBranchId = 1; // Central Warehouse
    $reasonId = (int)($data['reason_id'] ?? 1);
    $note = trim($data['note'] ?? '');
    $items = $data['items'] ?? [];

    if (empty($items)) {
        echo json_encode(['success' => false, 'error' => 'Please select at least one item line to return.']);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();
        $returnNo = 'SR-' . date('YmdHis') . '-' . rand(100, 999);

        $stmt = $pdo->prepare("INSERT INTO tbl_store_returns (return_no, from_branch_id, to_branch_id, reason_id, note, created_by) VALUES (?, ?, ?, ?, ?, 1)");
        $stmt->execute([$returnNo, $fromBranchId, $toBranchId, $reasonId, $note]);
        $returnId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("INSERT INTO tbl_store_return_items (return_id, product_id, quantity) VALUES (?, ?, ?)");
        
        foreach ($items as $it) {
            $prodId = (int)$it['product_id'];
            $qty = (float)$it['quantity'];
            if ($qty <= 0) continue;

            $itemStmt->execute([$returnId, $prodId, $qty]);

            // Ensure Central Warehouse inventory row exists
            $ensStmt = $pdo->prepare("INSERT IGNORE INTO tbl_inventory (branch_id, product_id, quantity, non_sellable_qty) VALUES (1, ?, 0, 0)");
            $ensStmt->execute([$prodId]);

            // Step 1a: Deduct sellable stock from Store
            $stockManager->adjustStock($prodId, $fromBranchId, -$qty, 'STOCK_RETURN', 1, $reasonId, 'STORE_RETURN', $returnId, "Damaged stock returned to Warehouse (SR #{$returnNo})", false);

            // Step 1b: Add stock directly to Central Warehouse NON-SELLABLE bucket
            $stockManager->adjustStock($prodId, $toBranchId, $qty, 'STOCK_RETURN', 1, $reasonId, 'STORE_RETURN', $returnId, "Damaged stock received from Store #{$fromBranchId} (SR #{$returnNo})", true);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'return_no' => $returnNo]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 1. Get Branches List
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_branches') {
    try {
        $stmt = $pdo->query("SELECT branch_id, branch_code, branch_name, is_active FROM tbl_branches ORDER BY branch_id ASC");
        echo json_encode(['success' => true, 'branches' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 1b. Create Branch Outlet
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_branch') {
    $data = json_decode(file_get_contents('php://input'), true);
    $code = strtoupper(trim($data['branch_code'] ?? ''));
    $name = trim($data['branch_name'] ?? '');

    if (empty($code) || empty($name)) {
        echo json_encode(['success' => false, 'error' => 'Branch Code and Name are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO tbl_branches (branch_code, branch_name, is_active) VALUES (?, ?, 1)");
        $stmt->execute([$code, $name]);
        echo json_encode(['success' => true, 'branch_id' => $pdo->lastInsertId()]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 1c. Update Branch Outlet
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_branch') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = (int)($data['branch_id'] ?? 0);
    $code = strtoupper(trim($data['branch_code'] ?? ''));
    $name = trim($data['branch_name'] ?? '');

    if ($id <= 0 || empty($code) || empty($name)) {
        echo json_encode(['success' => false, 'error' => 'Branch ID, Code, and Name are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE tbl_branches SET branch_code = ?, branch_name = ? WHERE branch_id = ?");
        $stmt->execute([$code, $name, $id]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 1d. Toggle Branch Status
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'toggle_branch_status') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = (int)($data['branch_id'] ?? 0);
    $isActive = (int)($data['is_active'] ?? 1);

    if ($id <= 1) {
        echo json_encode(['success' => false, 'error' => 'Central Warehouse status cannot be modified.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE tbl_branches SET is_active = ? WHERE branch_id = ?");
        $stmt->execute([$isActive, $id]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
?>