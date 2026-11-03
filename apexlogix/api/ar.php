<?php
header('Content-Type: application/json');
include "connection-pdo.php";

$operation = $_REQUEST['operation'] ?? '';

if ($operation == "getAR") {
    $sql = "SELECT a.ar_id, t.invoice_number, c.customer_name, c.tin, a.amount_due, a.status, a.created_at
            FROM tbl_accounts_receivable a
            JOIN tbl_customers c ON a.customer_id = c.customer_id
            JOIN tbl_pos_transactions t ON a.transaction_id = t.transaction_id
            WHERE a.status = 'UNPAID'
            ORDER BY a.created_at DESC";
    echo json_encode($conn->query($sql)->fetchAll(PDO::FETCH_ASSOC));
}

if ($operation == "payAR") {
    $arId = json_decode($_REQUEST['json'])->arId;

    try {
        $conn->beginTransaction();

        $stmt = $conn->prepare("UPDATE tbl_accounts_receivable SET status = 'PAID' WHERE ar_id = ?");
        $stmt->execute([$arId]);

        // Audit Log
        $logSql = "INSERT INTO tbl_system_logs(action_type, description) VALUES('AR_PAYMENT', :desc)";
        $logStmt = $conn->prepare($logSql);
        $desc = "Settled AR Account Payment for AR Record ID: " . $arId;
        $logStmt->execute([':desc' => $desc]);

        $conn->commit();
        echo json_encode(1);
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(0);
    }
}
?>