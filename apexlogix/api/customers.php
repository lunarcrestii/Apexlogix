<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Customer {
    function getCustomers(){
        include "connection-pdo.php";
        $sql = "SELECT customer_id, customer_name, tin, contact_number, email FROM tbl_customers WHERE is_active = TRUE ORDER BY customer_name";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        return json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    function insertCustomer($json){
        include "connection-pdo.php";
        $data = json_decode($json, true);

        try {
            $sql = "INSERT INTO tbl_customers(customer_name, tin, contact_number, email) VALUES(:name, :tin, :contact, :email)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':name' => $data['name'],
                ':tin' => $data['tin'],
                ':contact' => $data['contact'],
                ':email' => $data['email']
            ]);

            // Audit Log
            $logSql = "INSERT INTO tbl_system_logs(action_type, description) VALUES('CUSTOMER_CREATE', :desc)";
            $logStmt = $conn->prepare($logSql);
            $desc = "Registered AR Customer [ " . $data['name'] . " ] TIN: " . $data['tin'] . " Contact: " . $data['contact'];
            $logStmt->execute([':desc' => $desc]);

            return json_encode(1);
        } catch (Exception $e) {
            return json_encode(0);
        }
    }
}

$operation = $_REQUEST['operation'] ?? '';
$json = $_REQUEST['json'] ?? '';
$customer = new Customer();

if ($operation == "getCustomers") echo $customer->getCustomers();
if ($operation == "insertCustomer") echo $customer->insertCustomer($json);
?>