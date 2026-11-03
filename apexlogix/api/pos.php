<?php
require_once 'connection-pdo.php';
require_once 'StockManager.php';

header('Content-Type: application/json');
$action = $_POST['operation'] ?? $_GET['operation'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'saveTransaction') {
    $data = json_decode($_POST['json'], true);
    $header = $data['header'] ?? [];
    $details = $data['details'] ?? [];
    $userId = 1; // Assuming default user for now

    if (empty($details)) {
        echo json_encode(['status' => 0, 'message' => 'Cart is empty.']);
        exit;
    }

    $stockManager = new StockManager($pdo);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO tbl_pos_transactions (invoice_number, branch_id, customer_id, is_ar, total_pax, discount_pax, discount_amount, subtotal_amount, tax_amount, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $header['invoiceNumber'],
            $header['branchId'],
            $header['customerId'] > 0 ? $header['customerId'] : null,
            $header['isAr'],
            $header['totalPax'],
            $header['discountPax'],
            $header['discountAmount'],
            $header['subtotal'],
            $header['tax'],
            $header['total']
        ]);
        
        $transactionId = $pdo->lastInsertId();

        $itemStmt = $pdo->prepare("INSERT INTO tbl_pos_transaction_items (transaction_id, product_id, quantity_sold, unit_price, line_subtotal) VALUES (?, ?, ?, ?, ?)");

        foreach ($details as $item) {
            $itemStmt->execute([
                $transactionId,
                $item['productId'],
                $item['qty'],
                $item['price'],
                $item['amount']
            ]);

            // Deduct stock safely with locking[cite: 41]
            $stockManager->adjustStock(
                $item['productId'], 
                $header['branchId'], 
                -abs($item['qty']), 
                'POS_SALE', 
                $userId, 
                null, 
                'POS', 
                $transactionId, 
                "POS Sale Invoice: " . $header['invoiceNumber']
            );

            // FEFO BATCH DEDUCTION LOGIC
            $qtyToDeduct = abs((float)$item['qty']);
            
            // Get all batches with available stock for this product, ordered by earliest expiry
            $batchStmt = $pdo->prepare("SELECT batch_id, quantity FROM tbl_batches WHERE product_id = ? AND branch_id = ? AND quantity > 0 ORDER BY expiry_date ASC FOR UPDATE");
            $batchStmt->execute([$item['productId'], $header['branchId']]);
            $batches = $batchStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($batches as $batch) {
                if ($qtyToDeduct <= 0) break;

                $batchQty = (float)$batch['quantity'];
                $deductFromThisBatch = min($batchQty, $qtyToDeduct);
                
                // Update batch quantity
                $updBatchStmt = $pdo->prepare("UPDATE tbl_batches SET quantity = quantity - ? WHERE batch_id = ?");
                $updBatchStmt->execute([$deductFromThisBatch, $batch['batch_id']]);
                
                $qtyToDeduct -= $deductFromThisBatch;
            }
        }

        if ($header['isAr'] == 1 && $header['customerId'] > 0) {
            $arStmt = $pdo->prepare("INSERT INTO tbl_accounts_receivable (transaction_id, customer_id, amount_due, status) VALUES (?, ?, ?, 'UNPAID')");
            $arStmt->execute([$transactionId, $header['customerId'], $header['total']]);
        }

        $pdo->commit();
        echo json_encode(['status' => 1, 'message' => 'Transaction saved.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 0, 'message' => $e->getMessage()]);
    }
    exit;
}