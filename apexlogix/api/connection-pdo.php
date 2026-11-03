<?php
    $servername = "localhost";
    $dbusername = "root";
    $dbpassword = "";
    $dbname = "db_apexlogix";

    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $dbusername, $dbpassword);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Define $pdo as an alias to $conn for StockManager, PO, Products, POS
        $pdo = $conn; 
    } catch(PDOException $e) {
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "error" => "Database Connection failed: " . $e->getMessage()]);
        exit;
    }
?>