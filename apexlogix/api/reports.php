<?php
// api/reports.php
header('Content-Type: application/json');
require_once 'connection-pdo.php';

$pdo = $conn ?? $pdo;

$action = $_GET['action'] ?? $_GET['operation'] ?? 'get_shrinkage';

// ------------------------------------------------------------------------
// 1. MONTHLY SHRINKAGE REPORT
// ------------------------------------------------------------------------
if ($action === 'get_shrinkage') {
    $month = $_GET['month'] ?? date('Y-m');
    $startDate = $month . '-01 00:00:00';
    $endDate = date('Y-m-t 23:59:59', strtotime($startDate));

    try {
        // 1. Shrinkage Loss Summary
        // Counts ONLY permanent disposals and physical inventory adjustments.
        // EXCLUDES internal staging transfers (STOCK_RETURN), vendor returns (RTV_SUPPLIER/PURCHASE_RETURN), and data corrections.
        $summaryStmt = $pdo->prepare("
            SELECT 
                COALESCE(r.name, m.movement_type, 'General Inventory Loss / Unspecified') AS reason_name,
                COUNT(m.id) AS incidents,
                SUM(ABS(m.qty_change)) AS total_qty_lost,
                SUM(ABS(m.qty_change) * COALESCE(NULLIF(p.unit_cost, 0), p.retail_price, 0)) AS total_financial_loss
            FROM tbl_stock_movements m
            JOIN tbl_products p ON m.product_id = p.product_id
            LEFT JOIN tbl_inventory_reasons r ON m.reason_id = r.id
            WHERE DATE_FORMAT(m.created_at, '%Y-%m') = :month
              AND m.qty_change < 0
              AND m.movement_type IN ('DISPOSAL', 'ADJUSTMENT_COUNT', 'ADJUSTMENT_MANUAL')
              AND m.movement_type NOT IN ('POS_SALE', 'PURCHASE_RETURN', 'RTV_SUPPLIER', 'PO_RECEIPT', 'OPENING_BALANCE', 'STOCK_RETURN')
              AND (r.name IS NULL OR r.name NOT IN ('System / Data Entry Error', 'Physical Count Correction (Decrease)', 'Physical Count Correction (Increase)'))
            GROUP BY COALESCE(r.name, m.movement_type)
            ORDER BY total_financial_loss DESC
        ");
        $summaryStmt->execute([':month' => $month]);
        $shrinkageSummary = $summaryStmt->fetchAll(PDO::FETCH_ASSOC);

        // 2. Line item details breakdown
        $detailStmt = $pdo->prepare("
            SELECT 
                m.id AS log_id,
                p.product_name,
                p.sku,
                COALESCE(NULLIF(p.unit_cost, 0), p.retail_price, 0) AS unit_cost,
                ABS(m.qty_change) AS qty_lost,
                (ABS(m.qty_change) * COALESCE(NULLIF(p.unit_cost, 0), p.retail_price, 0)) AS financial_loss,
                COALESCE(r.name, m.movement_type) AS reason_name,
                m.movement_type,
                m.note,
                m.created_at
            FROM tbl_stock_movements m
            JOIN tbl_products p ON m.product_id = p.product_id
            LEFT JOIN tbl_inventory_reasons r ON m.reason_id = r.id
            WHERE m.created_at BETWEEN :start_date AND :end_date
              AND m.qty_change < 0
              AND m.movement_type IN ('DISPOSAL', 'ADJUSTMENT_COUNT', 'ADJUSTMENT_MANUAL')
              AND m.movement_type NOT IN ('POS_SALE', 'PURCHASE_RETURN', 'RTV_SUPPLIER', 'PO_RECEIPT', 'OPENING_BALANCE', 'STOCK_RETURN')
              AND (r.name IS NULL OR r.name NOT IN ('System / Data Entry Error', 'Physical Count Correction (Decrease)', 'Physical Count Correction (Increase)'))
            ORDER BY m.created_at DESC
        ");
        $detailStmt->execute([
            ':start_date' => $startDate,
            ':end_date' => $endDate
        ]);
        $details = $detailStmt->fetchAll(PDO::FETCH_ASSOC);

        $grandTotalLoss = 0;
        foreach ($shrinkageSummary as $row) {
            $grandTotalLoss += (float)$row['total_financial_loss'];
        }

        echo json_encode([
            'success' => true,
            'month' => $month,
            'grand_total_loss' => $grandTotalLoss,
            'summary' => $shrinkageSummary,
            'details' => $details
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ------------------------------------------------------------------------
// 2. ON-HAND INVENTORY REPORT
// ------------------------------------------------------------------------
if ($action === 'get_onhand' || $action === 'get_on_hand_report') {
    try {
        $stmt = $pdo->query("
            SELECT p.product_id, p.sku, p.product_name, c.category_name, p.unit_of_measure,
                   p.unit_cost, p.retail_price, p.reorder_level,
                   COALESCE(i.quantity, 0) AS sellable_qty,
                   COALESCE(i.non_sellable_qty, 0) AS non_sellable_qty,
                   (COALESCE(i.quantity, 0) * COALESCE(NULLIF(p.unit_cost, 0), p.retail_price, 0)) AS total_value
            FROM tbl_products p
            LEFT JOIN tbl_categories c ON p.category_id = c.category_id
            LEFT JOIN tbl_inventory i ON p.product_id = i.product_id AND i.branch_id = 1
            WHERE p.is_active = 1
            ORDER BY p.product_name ASC
        ");
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'reports' => $data, 'products' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
?>