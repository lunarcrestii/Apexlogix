<?php
header('Content-Type: application/json');
require_once 'connection-pdo.php'; 

try {
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'today';
    
    $startDate = date('Y-m-d');
    $endDate = date('Y-m-d');

    if ($filter === 'week') {
        $startDate = date('Y-m-d', strtotime('monday this week'));
    } else if ($filter === 'month') {
        $startDate = date('Y-m-01');
    } else if ($filter === 'all') {
        $startDate = '2000-01-01';
    }

    // 1 & 2: Revenue & Invoices
    $stmt = $conn->prepare("SELECT SUM(total_amount) as revenue, COUNT(transaction_id) as invoices FROM tbl_pos_transactions WHERE DATE(created_at) BETWEEN ? AND ?");
    $stmt->execute([$startDate, $endDate]);
    $salesData = $stmt->fetch(PDO::FETCH_ASSOC);
    $revenue = $salesData['revenue'] ?: 0.00;
    $invoices = $salesData['invoices'] ?: 0;

    // 3. Pending Purchase Orders
    $stmt = $conn->prepare("SELECT COUNT(po_id) FROM tbl_purchase_orders WHERE status = 'Pending'");
    $stmt->execute();
    $pending_pos = $stmt->fetchColumn() ?: 0;

    // 4. Low Stock Count based on Product Reorder Levels
    $stmt = $conn->prepare("
        SELECT COUNT(i.inventory_id) 
        FROM tbl_inventory i 
        JOIN tbl_products p ON i.product_id = p.product_id 
        WHERE i.quantity <= p.reorder_level AND p.is_active = 1
    ");
    $stmt->execute();
    $low_stock_count = $stmt->fetchColumn() ?: 0;

    // 5. Low Stock Items with Auto-Suggested Order Quantities
    $stmt = $conn->prepare("
        SELECT p.product_id, p.product_name, p.reorder_level, p.suggested_reorder_qty, p.unit_cost, i.quantity 
        FROM tbl_inventory i 
        JOIN tbl_products p ON i.product_id = p.product_id 
        WHERE i.quantity <= p.reorder_level AND p.is_active = 1 
        ORDER BY i.quantity ASC LIMIT 10
    ");
    $stmt->execute();
    $low_stock_items = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // 6. Recent Activity
    $stmt = $conn->prepare("
        SELECT 
            m.movement_type AS action_type,
            CONCAT(
                '<b>', p.product_name, '</b> changed by <b>', m.qty_change, '</b> ',
                '(From ', m.qty_before, ' to ', m.qty_after, ')',
                IF(m.note IS NOT NULL AND m.note != '', CONCAT('<br><i>Note: ', m.note, '</i>'), '')
            ) AS description,
            m.created_at
        FROM tbl_stock_movements m
        LEFT JOIN tbl_products p ON m.product_id = p.product_id
        ORDER BY m.created_at DESC 
        LIMIT 8
    ");
    $stmt->execute();
    $recent_activity = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // 7. Sales Trend
    $stmt = $conn->prepare("
        SELECT DATE(created_at) as sale_date, SUM(total_amount) as daily_total 
        FROM tbl_pos_transactions 
        WHERE DATE(created_at) BETWEEN ? AND ? 
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    ");
    $stmt->execute([$startDate, $endDate]);
    $chart_results = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    
    $chart_labels = [];
    $chart_values = [];
    foreach ($chart_results as $row) {
        $chart_labels[] = date('M d', strtotime($row['sale_date']));
        $chart_values[] = $row['daily_total'];
    }

    // 8. Near-Expiry Alerts (30/60 Days)
    $stmt = $conn->prepare("
        SELECT b.batch_id, b.product_id, p.product_name, b.lot_number, b.expiry_date, b.quantity,
               DATEDIFF(b.expiry_date, CURDATE()) as days_left
        FROM tbl_batches b
        JOIN tbl_products p ON b.product_id = p.product_id
        WHERE b.quantity > 0 AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
        ORDER BY b.expiry_date ASC
    ");
    $stmt->execute();
    $expiry_alerts = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    echo json_encode([
        'error' => false,
        'revenue' => $revenue,
        'invoices' => $invoices,
        'pending_pos' => $pending_pos,
        'low_stock_count' => $low_stock_count,
        'low_stock_items' => $low_stock_items,
        'recent_activity' => $recent_activity,
        'chart_labels' => $chart_labels,
        'chart_values' => $chart_values,
        'expiry_alerts' => $expiry_alerts
    ]);

} catch (PDOException $e) {
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}
?>