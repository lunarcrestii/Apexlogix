<?php
// api/StockManager.php

class StockManager {
    private $conn;

    public function __construct($dbConnection) {
        $this->conn = $dbConnection;
    }

    public function adjustStock($productId, $branchId, $qtyChange, $movementType, $userId, $reasonId = null, $refType = null, $refId = null, $note = null, $isNonSellable = false) {
        // 1. Lock the inventory row for atomic update
        $stmt = $this->conn->prepare("SELECT quantity, non_sellable_qty FROM tbl_inventory WHERE product_id = ? AND branch_id = ? FOR UPDATE");
        $stmt->execute([$productId, $branchId]);
        $currentStock = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$currentStock) {
            throw new Exception("Product inventory record not found for branch.");
        }

        $qtyBefore = $isNonSellable ? (float)$currentStock['non_sellable_qty'] : (float)$currentStock['quantity'];
        $qtyAfter = $qtyBefore + $qtyChange;

        // 2. Prevent negative stock
        if ($qtyAfter < 0) {
            throw new Exception("Transaction denied: Stock cannot fall below zero.");
        }

        // 3. Update the inventory
        $columnToUpdate = $isNonSellable ? 'non_sellable_qty' : 'quantity';
        $updateStmt = $this->conn->prepare("UPDATE tbl_inventory SET $columnToUpdate = ? WHERE product_id = ? AND branch_id = ?");
        $updateStmt->execute([$qtyAfter, $productId, $branchId]);

        // 4. Write immutable ledger entry (SINGLE Insert)
        $ledgerStmt = $this->conn->prepare("
            INSERT INTO tbl_stock_movements 
            (product_id, branch_id, movement_type, qty_change, qty_before, qty_after, reason_id, reference_type, reference_id, note, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $ledgerStmt->execute([
            $productId, $branchId, $movementType, $qtyChange, $qtyBefore, $qtyAfter, $reasonId, $refType, $refId, $note, $userId
        ]);

        return ["success" => true, "new_qty" => $qtyAfter];
    }
}
?>