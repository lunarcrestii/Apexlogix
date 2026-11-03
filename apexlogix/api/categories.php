<?php
  header('Content-Type: application/json');
  header("Access-Control-Allow-Origin: *");

  require_once 'connection-pdo.php';

  class Category {
    private $db;

    public function __construct($conn) {
      $this->db = $conn;
    }

    function updateCategory($json){
      $data = json_decode($json, true);
      $sql = "UPDATE tbl_categories SET category_name = :name, description = :desc WHERE category_id = :id";
      $stmt = $this->db->prepare($sql);
      try {
          $stmt->execute([
              ':name' => $data['categoryName'] ?? $data['category_name'] ?? '',
              ':desc' => $data['description'] ?? '',
              ':id' => $data['category_id'] ?? $data['id'] ?? 0
          ]);
          return json_encode(1);
      } catch (Exception $e) {
          return json_encode(0);
      }
    }

    function archiveCategory($json){
      $data = json_decode($json, true);
      $id = $data['category_id'] ?? $data['id'] ?? 0;
      $sql = "UPDATE tbl_categories SET is_active = 0 WHERE category_id = :id";
      $stmt = $this->db->prepare($sql);
      $stmt->execute([':id' => $id]);
      return json_encode($stmt->rowCount() > 0 ? 1 : 0);
    }

    function getCategories(){
      $sql = "SELECT category_id, category_name, description FROM tbl_categories WHERE is_active = TRUE ORDER BY category_name";
      $stmt = $this->db->prepare($sql);
      $stmt->execute();
      $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

      if (isset($_REQUEST['action']) && $_REQUEST['action'] === 'get_categories') {
          return json_encode([
              'success' => true,
              'categories' => $categories,
              'data' => $categories
          ]);
      }
      
      return json_encode($categories);
    }

    function insertCategory($json){
      $data = json_decode($json, true);
      $sql = "INSERT INTO tbl_categories(category_name, description) VALUES(:name, :desc)";
      $stmt = $this->db->prepare($sql);
      try {
        $stmt->execute([
          ':name' => $data['categoryName'] ?? $data['category_name'] ?? '',
          ':desc' => $data['description'] ?? ''
        ]);
        return json_encode($stmt->rowCount() > 0 ? 1 : 0);
      } catch (Exception $e) {
        return json_encode(0);
      }
    }
  }

  $operation = $_REQUEST['operation'] ?? $_REQUEST['action'] ?? '';
  $json = $_REQUEST['json'] ?? file_get_contents('php://input');

  $category = new Category($conn);

  if ($operation == "getCategories" || $operation == "get_categories") echo $category->getCategories();
  if ($operation == "insertCategory" || $operation == "save_category") echo $category->insertCategory($json);
  if ($operation == "archiveCategory" || $operation == "deleteCategory") echo $category->archiveCategory($json);
  if ($operation == "updateCategory" || $operation == "update_category") echo $category->updateCategory($json);
?>