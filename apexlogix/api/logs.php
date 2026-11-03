<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Logs {
    function getSalesHistory(){
        include "connection-pdo.php";
        
        // GI-UPDATE NGA SQL QUERY
        // Rason: Aron i-filter o dili iapil ang mga Utang (is_ar = 1) nga UNPAID pa
        $sql = "SELECT 
                    t.*, 
                    c.customer_name,
                    COALESCE(b.branch_name, 'Main Branch') AS branch,
                    COALESCE(GROUP_CONCAT(CONCAT(p.product_name, ' (x', i.quantity_sold, ')') SEPARATOR ', '), 'N/A') AS items_sold,
                    COALESCE(GROUP_CONCAT(CONCAT(p.product_name, ' (x', i.quantity_sold, ')') SEPARATOR ', '), 'N/A') AS items_bought
                FROM tbl_pos_transactions t
                LEFT JOIN tbl_customers c ON t.customer_id = c.customer_id
                LEFT JOIN tbl_branches b ON t.branch_id = b.branch_id
                LEFT JOIN tbl_pos_transaction_items i ON t.transaction_id = i.transaction_id
                LEFT JOIN tbl_products p ON i.product_id = p.product_id
                LEFT JOIN tbl_accounts_receivable a ON t.transaction_id = a.transaction_id
                WHERE t.is_ar = 0 OR (t.is_ar = 1 AND a.status = 'PAID') 
                GROUP BY t.transaction_id
                ORDER BY t.created_at DESC";
                
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function getAuditLogs(){
        include "connection-pdo.php";
        // Query stock movements, join with products, and format as an audit log
        // Added CASE statement to fallback from empty/NULL/N/A movement_type to parsed note type
        $sql = "SELECT 
            m.id AS log_id,
            CASE 
                WHEN m.movement_type IS NOT NULL AND m.movement_type != '' AND m.movement_type != 'N/A' 
                    THEN m.movement_type
                WHEN m.note LIKE '%Cycle Count%' THEN 'CYCLE_COUNT'
                WHEN m.note LIKE '%POS Sale%' THEN 'POS_SALE'
                WHEN m.note LIKE '%PO%' THEN 'PO_RECEIPT'
                ELSE 'ADJUSTMENT'
            END AS action_type,
            CONCAT(
                'Product: ', p.product_name, 
                ' | Qty Changed: ', m.qty_change, 
                ' (From ', m.qty_before, ' to ', m.qty_after, ')',
                IF(m.note IS NOT NULL AND m.note != '', CONCAT(' | Note: ', m.note), '')
            ) AS description,
            m.created_at
        FROM tbl_stock_movements m
        LEFT JOIN tbl_products p ON m.product_id = p.product_id
        ORDER BY m.created_at DESC 
        LIMIT 200";
                
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

$operation = $_REQUEST['operation'] ?? '';
$logs = new Logs();

if ($operation == "getSalesHistory") echo $logs->getSalesHistory();
if ($operation == "getAuditLogs") echo $logs->getAuditLogs();
?>