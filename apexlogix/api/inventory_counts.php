<?php
// api/inventory_counts.php
require_once 'connection-pdo.php';
require_once 'StockManager.php';

header('Content-Type: application/json');
$pdo = $conn;
$action = $_REQUEST['action'] ?? $_REQUEST['operation'] ?? '';

// 1. Create Cycle Count Session and snapshot current system quantities
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create_session') {
    try {
        $pdo->beginTransaction();
        $sessionNo = 'COUNT-' . date('YmdHis');
        
        $stmt = $pdo->prepare("INSERT INTO tbl_count_sessions (session_no, branch_id, status, created_at) VALUES (?, 1, 'In Progress', NOW())");
        $stmt->execute([$sessionNo]);
        $sessionId = $pdo->lastInsertId();

        // Populate snapshot
        $stmt = $pdo->prepare("
            INSERT INTO tbl_count_session_items (session_id, product_id, system_qty_snapshot)
            SELECT ?, p.product_id, COALESCE(i.quantity, 0)
            FROM tbl_products p
            LEFT JOIN tbl_inventory i ON p.product_id = i.product_id AND i.branch_id = 1
            WHERE p.is_active = 1
        ");
        $stmt->execute([$sessionId]);

        $pdo->commit();
        echo json_encode(['success' => true, 'session_id' => $sessionId, 'session_no' => $sessionNo]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 2. Get Blind Count Sheet (HIDES system snapshot quantities for counters)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_blind_sheet') {
    $sessionId = $_GET['session_id'] ?? null;
    
    $stmt = $pdo->prepare("
        SELECT csi.item_id, csi.product_id, p.product_name, p.sku, p.barcode, csi.counted_qty
        FROM tbl_count_session_items csi
        JOIN tbl_products p ON csi.product_id = p.product_id
        WHERE csi.session_id = ?
        ORDER BY p.product_name ASC
    ");
    $stmt->execute([$sessionId]);
    echo json_encode(['success' => true, 'items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// 3. Counter submits physical quantities
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'submit_counts') {
    $data = json_decode(file_get_contents('php://input'), true);
    $sessionId = $data['session_id'] ?? null;
    $counts = $data['counts'] ?? [];

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE tbl_count_session_items SET counted_qty = ? WHERE item_id = ? AND session_id = ?");
        foreach ($counts as $c) {
            $stmt->execute([(float)$c['counted_qty'], $c['item_id'], $sessionId]);
        }

        $stmt = $pdo->prepare("UPDATE tbl_count_sessions SET status = 'Pending Approval' WHERE session_id = ?");
        $stmt->execute([$sessionId]);

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 4. Manager Approval View (Displays system quantity snapshot vs physical count & variance)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_approval_sheet') {
    $sessionId = $_GET['session_id'] ?? null;
    $stmt = $pdo->prepare("
        SELECT csi.*, p.product_name, p.sku, (csi.counted_qty - csi.system_qty_snapshot) as variance
        FROM tbl_count_session_items csi
        JOIN tbl_products p ON csi.product_id = p.product_id
        WHERE csi.session_id = ?
        ORDER BY p.product_name ASC
    ");
    $stmt->execute([$sessionId]);
    echo json_encode(['success' => true, 'items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// 5. Manager approves variances and updates stock ledger
// 5. Manager/Admin approves variances and updates stock ledger
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'approve_session') {
    $data = json_decode(file_get_contents('php://input'), true);
    $sessionId = $data['session_id'] ?? null;
    $passcode = trim($data['passcode'] ?? $data['approved_by'] ?? '');

    if (!$sessionId) {
        echo json_encode(['success' => false, 'error' => 'Missing session ID.']);
        exit;
    }

    if (empty($passcode)) {
        echo json_encode(['success' => false, 'error' => 'Admin or Manager passcode is required for authorization.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // 1. Verify passcode against tbl_users (Only Admin & Manager roles permitted)
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
            throw new Exception("Access Denied: Invalid Admin or Manager passcode.");
        }

        $approverId = $approver['user_id'];
        $stockManager = new StockManager($pdo);

        // 2. Fetch session items and calculate variances
        $stmt = $pdo->prepare("SELECT * FROM tbl_count_session_items WHERE session_id = ?");
        $stmt->execute([$sessionId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Inside api/inventory_counts.php (approve_session action)
foreach ($items as $item) {
    $variance = (float)$item['counted_qty'] - (float)$item['system_qty_snapshot'];
    if ($variance != 0) {
        $stockManager->adjustStock(
            $item['product_id'], 
            1, 
            $variance, 
            'CYCLE_COUNT', // Explicitly recorded in tbl_stock_movements
            $approverId, 
            null, 
            'COUNT_SESSION', 
            $sessionId, 
            "Cycle Count Approved by {$approver['full_name']} ({$approver['role']})"
        );
    }
}

        // 3. Mark cycle count session as completed
        $stmt = $pdo->prepare("UPDATE tbl_count_sessions SET status = 'Completed', approved_by = ?, completed_at = NOW() WHERE session_id = ?");
        $stmt->execute([$approverId, $sessionId]);

        $pdo->commit();
        echo json_encode([
            'success' => true, 
            'approver' => $approver['full_name'], 
            'role' => $approver['role']
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
?>