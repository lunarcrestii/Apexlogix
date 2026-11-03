<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Archive {
    function getArchived($type) {
        include "connection-pdo.php";
        
        try {
            if ($type === 'products') {
                $sql = "SELECT p.*, c.category_name 
                        FROM tbl_products p 
                        LEFT JOIN tbl_categories c ON p.category_id = c.category_id 
                        WHERE p.is_active = 0 
                        ORDER BY p.product_name ASC";
            } elseif ($type === 'categories') {
                $sql = "SELECT * FROM tbl_categories WHERE is_active = 0 ORDER BY category_name ASC";
            } elseif ($type === 'suppliers') {
                $sql = "SELECT * FROM tbl_suppliers WHERE is_active = 0 ORDER BY company_name ASC";
            } else {
                return json_encode(['success' => false, 'error' => 'Invalid entity type.']);
            }

            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(['success' => true, 'data' => $rs]);
        } catch (Exception $e) {
            return json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    function restoreItem($json) {
        include "connection-pdo.php";
        $data = json_decode($json, true);
        $type = $data['type'] ?? '';
        $id = (int)($data['id'] ?? 0);

        $tableMap = [
            'products' => ['tbl' => 'tbl_products', 'pk' => 'product_id'],
            'categories' => ['tbl' => 'tbl_categories', 'pk' => 'category_id'],
            'suppliers' => ['tbl' => 'tbl_suppliers', 'pk' => 'supplier_id']
        ];

        try {
            if (!$type || !$id || !isset($tableMap[$type])) {
                return json_encode(['success' => false, 'error' => 'Invalid restore request.']);
            }

            $tbl = $tableMap[$type]['tbl'];
            $pk = $tableMap[$type]['pk'];
            
            $sql = "UPDATE {$tbl} SET is_active = 1 WHERE {$pk} = :id";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(":id", $id);
            $stmt->execute();

            return json_encode(['success' => true]);
        } catch (Exception $e) {
            return json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    function hardDelete($json) {
        include "connection-pdo.php";
        $data = json_decode($json, true);
        $type = $data['type'] ?? '';
        $id = (int)($data['id'] ?? 0);
        $passcode = trim($data['passcode'] ?? '');

        if (empty($passcode)) {
            return json_encode(['success' => false, 'error' => 'Manager or Admin password required.']);
        }

        // Verify passcode against active Admin/Manager accounts in tbl_users
        $stmtAuth = $conn->prepare("
            SELECT user_id 
            FROM tbl_users 
            WHERE (password_hash = :pass OR password_hash = MD5(:pass)) 
              AND role IN ('Admin', 'Manager') 
              AND is_active = 1 
            LIMIT 1
        ");
        $stmtAuth->execute([':pass' => $passcode]);

        if (!$stmtAuth->fetch()) {
            return json_encode(['success' => false, 'error' => 'Invalid Manager or Admin password!']);
        }

        $tableMap = [
            'products' => ['tbl' => 'tbl_products', 'pk' => 'product_id'],
            'categories' => ['tbl' => 'tbl_categories', 'pk' => 'category_id'],
            'suppliers' => ['tbl' => 'tbl_suppliers', 'pk' => 'supplier_id']
        ];

        if (!$type || !$id || !isset($tableMap[$type])) {
            return json_encode(['success' => false, 'error' => 'Invalid delete request.']);
        }

        try {
            $conn->beginTransaction();

            if ($type === 'products') {
                $stmtBatch = $conn->prepare("DELETE FROM tbl_batches WHERE product_id = :id");
                $stmtBatch->execute([':id' => $id]);

                $stmtPack = $conn->prepare("DELETE FROM tbl_pack_conversions WHERE product_id = :id");
                $stmtPack->execute([':id' => $id]);

                $stmtCounts = $conn->prepare("DELETE FROM tbl_count_session_items WHERE product_id = :id");
                $stmtCounts->execute([':id' => $id]);
            }

            $tbl = $tableMap[$type]['tbl'];
            $pk = $tableMap[$type]['pk'];

            $sql = "DELETE FROM {$tbl} WHERE {$pk} = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([':id' => $id]);

            $conn->commit();
            return json_encode(['success' => true]);
        } catch (Exception $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            return json_encode(['success' => false, 'error' => 'Hard delete failed: ' . $e->getMessage()]);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $operation = $_GET['operation'];
    $type = isset($_GET['type']) ? $_GET['type'] : "";
} else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $operation = $_POST['operation'];
    $json = isset($_POST['json']) ? $_POST['json'] : "";
}

$archive = new Archive();
switch ($operation) {
    case "getArchived":
        echo $archive->getArchived($type);
        break;
    case "restoreItem":
        echo $archive->restoreItem($json);
        break;
    case "hardDelete":
        echo $archive->hardDelete($json);
        break;
}
?>