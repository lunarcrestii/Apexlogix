<?php
// api/inventory.php
require_once 'connection-pdo.php';
require_once 'StockManager.php';

header('Content-Type: application/json');
$action = $_REQUEST['action'] ?? $_REQUEST['operation'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_reasons') {
    $appliesTo = $_GET['applies_to'] ?? 'adjustment';
    $stmt = $pdo->prepare("SELECT id, name, direction, requires_note FROM tbl_inventory_reasons WHERE (applies_to = ? OR applies_to = 'all') AND is_active = 1 ORDER BY sort_order ASC");
    $stmt->execute([$appliesTo]);
    echo json_encode(['success' => true, 'reasons' => $stmt->fetchAll()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'adjust_stock') {
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = $data['product_id'] ?? null;
    $mode = $data['mode'] ?? 'count';
    $inputValue = (float)($data['value'] ?? 0);
    $reasonId = $data['reason_id'] ?? null;
    $note = trim($data['note'] ?? '');
    $branchId = 1;
    $userId = 1;

    if (!$productId || !$reasonId) {
        echo json_encode(['success' => false, 'error' => 'Product ID and Reason Selection are required.']);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT quantity FROM tbl_inventory WHERE product_id = ? AND branch_id = ? FOR UPDATE");
        $stmt->execute([$productId, $branchId]);
        $inv = $stmt->fetch();
        $currentQty = $inv ? (float)$inv['quantity'] : 0.0;

        $qtyChange = ($mode === 'count') ? ($inputValue - $currentQty) : $inputValue;

        if ($qtyChange == 0) {
            throw new Exception("Calculated stock adjustment delta is 0. No stock change occurred.");
        }

        $stmt = $pdo->prepare("SELECT name, direction, requires_note FROM tbl_inventory_reasons WHERE id = ?");
        $stmt->execute([$reasonId]);
        $reason = $stmt->fetch();

        if ($reason['direction'] === 'increase' && $qtyChange < 0) {
            throw new Exception("Reason '{$reason['name']}' is allowed for stock increases only.");
        }
        if ($reason['direction'] === 'decrease' && $qtyChange > 0) {
            throw new Exception("Reason '{$reason['name']}' is allowed for stock decreases only.");
        }
        if ($reason['requires_note'] && empty($note)) {
            throw new Exception("Reason '{$reason['name']}' requires an explanatory note.");
        }

        $movementType = ($mode === 'count') ? 'ADJUSTMENT_COUNT' : 'ADJUSTMENT_MANUAL';

        $stockManager->adjustStock($productId, $branchId, $qtyChange, $movementType, $userId, $reasonId, 'ADJUSTMENT', $productId, $note);

        $pdo->commit();
        echo json_encode(['success' => true, 'qty_change' => $qtyChange]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}