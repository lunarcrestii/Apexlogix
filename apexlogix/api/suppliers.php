<?php
// api/suppliers.php
require_once 'connection-pdo.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

$pdo = $conn;

$operation = $_REQUEST['operation'] ?? $_REQUEST['action'] ?? '';
$json = $_REQUEST['json'] ?? '';

if ($operation === 'getSuppliers') {
    $stmt = $pdo->prepare("
        SELECT s.*,
               COALESCE(GROUP_CONCAT(DISTINCT c.category_name ORDER BY c.category_name SEPARATOR ', '), 'Unassigned') as specialized_product,
               COALESCE(GROUP_CONCAT(DISTINCT sc.category_id), '') as category_ids,
               COALESCE(SUM(poi.qty_ordered), 0) as total_ordered,
               COALESCE(SUM(poi.received_qty), 0) as total_received,
               COALESCE(SUM(poi.returned_qty), 0) as total_returned
        FROM tbl_suppliers s
        LEFT JOIN tbl_supplier_categories sc ON s.supplier_id = sc.supplier_id
        LEFT JOIN tbl_categories c ON sc.category_id = c.category_id
        LEFT JOIN tbl_purchase_orders po ON s.supplier_id = po.supplier_id AND po.status != 'Closed'
        LEFT JOIN tbl_po_items poi ON po.po_id = poi.po_id
        WHERE s.is_active = 1
        GROUP BY s.supplier_id
        ORDER BY s.company_name ASC
    ");
    $stmt->execute();
    $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($suppliers as &$sup) {
        $ordered = (float)$sup['total_ordered'];
        $received = (float)$sup['total_received'];
        $returned = (float)$sup['total_returned'];

        $sup['fill_rate'] = $ordered > 0 ? round(($received / $ordered) * 100, 1) : 100.0;
        $sup['return_rate'] = $received > 0 ? round(($returned / $received) * 100, 1) : 0.0;
        $sup['category_ids_arr'] = !empty($sup['category_ids']) ? explode(',', $sup['category_ids']) : [];
    }

    echo json_encode($suppliers);
    exit;
}

if ($operation === 'insertSupplier') {
    $data = json_decode($json, true);
    $supplierCode = trim($data['supplierCode'] ?? '');
    $companyName = trim($data['companyName'] ?? '');
    $contactName = trim($data['contactName'] ?? '');
    $categoryIds = $data['categoryIds'] ?? [];

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("INSERT INTO tbl_suppliers (supplier_code, company_name, contact_name, is_active) VALUES (?, ?, ?, 1)");
        $stmt->execute([$supplierCode, $companyName, $contactName]);
        $supplierId = $pdo->lastInsertId();

        if (!empty($categoryIds) && is_array($categoryIds)) {
            $catStmt = $pdo->prepare("INSERT INTO tbl_supplier_categories (supplier_id, category_id) VALUES (?, ?)");
            foreach ($categoryIds as $catId) {
                if ((int)$catId > 0) {
                    $catStmt->execute([$supplierId, (int)$catId]);
                }
            }
        }
        $pdo->commit();
        echo json_encode(1);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(0);
    }
    exit;
}

if ($operation === 'updateSupplier') {
    $data = json_decode($json, true);
    $id = $data['supplier_id'] ?? null;
    $supplierCode = trim($data['supplierCode'] ?? '');
    $companyName = trim($data['companyName'] ?? '');
    $contactName = trim($data['contactName'] ?? '');
    $categoryIds = $data['categoryIds'] ?? [];

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("UPDATE tbl_suppliers SET supplier_code = ?, company_name = ?, contact_name = ? WHERE supplier_id = ?");
        $stmt->execute([$supplierCode, $companyName, $contactName, $id]);

        $delStmt = $pdo->prepare("DELETE FROM tbl_supplier_categories WHERE supplier_id = ?");
        $delStmt->execute([$id]);

        if (!empty($categoryIds) && is_array($categoryIds)) {
            $catStmt = $pdo->prepare("INSERT INTO tbl_supplier_categories (supplier_id, category_id) VALUES (?, ?)");
            foreach ($categoryIds as $catId) {
                if ((int)$catId > 0) {
                    $catStmt->execute([$id, (int)$catId]);
                }
            }
        }
        $pdo->commit();
        echo json_encode(1);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(0);
    }
    exit;
}

if ($operation === 'archiveSupplier') {
    $data = json_decode($json, true);
    $id = $data['supplier_id'] ?? null;

    try {
        $stmt = $pdo->prepare("UPDATE tbl_suppliers SET is_active = 0 WHERE supplier_id = ?");
        $stmt->execute([$id]);
        echo json_encode(1);
    } catch (Exception $e) {
        echo json_encode(0);
    }
    exit;
}
?>