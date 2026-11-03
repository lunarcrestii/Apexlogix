const baseApiUrl = "./api";

export const displayCategories = async () => {
  try {
    const tableDiv = document.getElementById("categories-table-div");
    const response = await axios.get(`${baseApiUrl}/categories.php`, {
      params: { operation: "getCategories" },
    });

    if (response.status === 200) {
      // Safely extract the array whether response.data is a direct array or an object
      const catList = Array.isArray(response.data)
        ? response.data
        : (response.data?.categories || response.data?.data || []);

      tableDiv.innerHTML = `
  <div class="table-responsive">
    <table class="table table-sm table-bordered table-hover mb-0">
      <thead>
        <tr>
          <th style="width: 80px;">ID</th>
          <th>Category Name</th>
          <th>Description</th>
          <th class="text-center">Action</th>
        </tr>
      </thead>
      <tbody>
        ${catList.length === 0 ? `
          <tr><td colspan="4" class="text-center text-muted py-3">No active categories found.</td></tr>
        ` : catList.map(c => `
          <tr>
            <td>${c.category_id}</td>
            <td class="fw-bold">${c.category_name}</td>
            <td>${c.description || '-'}</td>
            <td class="text-center">
              <button class="btn btn-sm btn-dark py-0 px-2" onclick="window.openEditCategoryModal(${c.category_id}, '${(c.category_name ||'').replace(/'/g, "\\'")}', '${(c.description || '').replace(/'/g, "\\'")}')">Edit</button>
              <button class="btn btn-sm btn-danger py-0 px-2" onclick="window.archiveCategory(${c.category_id})">Archive</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;
    }
  } catch (error) {
    console.error("Fetch Categories Error", error);
  }
};

export const insertCategory = async () => {
  try {
    const name = document.getElementById("cat-name").value.trim();
    const desc = document.getElementById("cat-desc").value.trim();

    if (!name) return alert("Please enter a category name.");

    const formData = new FormData();
    formData.append("operation", "insertCategory");
    formData.append("json", JSON.stringify({ categoryName: name, description: desc }));

    const response = await axios.post(`${baseApiUrl}/categories.php`, formData);
    if (response.data == 1) {
      document.getElementById("cat-name").value = "";
      document.getElementById("cat-desc").value = "";
      displayCategories();
    } else {
      alert("Failed to insert category.");
    }
  } catch (error) {
    console.error("Insert Error", error);
  }
};

window.archiveCategory = async function(id) {
  if (!confirm("Are you sure you want to archive this category?")) return;
  
  const formData = new FormData();
  formData.append("operation", "archiveCategory");
  formData.append("json", JSON.stringify({ category_id: id }));

  try {
    const response = await axios.post(`${baseApiUrl}/categories.php`, formData);
    if (response.data == 1) {
      displayCategories();
    } else {
      alert("Failed to archive category.");
    }
  } catch (error) {
    console.error("Archive Error", error);
  }
};

window.openEditCategoryModal = function(id, name, desc) {
  document.getElementById('edit-cat-id').value = id;
  document.getElementById('edit-cat-name').value = name;
  document.getElementById('edit-cat-desc').value = desc;
  new bootstrap.Modal(document.getElementById('editCategoryModal')).show();
};

document.getElementById('btn-update-category').onclick = async function() {
  const id = document.getElementById('edit-cat-id').value;
  const name = document.getElementById('edit-cat-name').value.trim();
  const desc = document.getElementById('edit-cat-desc').value.trim();

  if (!name) return alert("Category name is required.");

  const formData = new FormData();
  formData.append("operation", "updateCategory");
  formData.append("json", JSON.stringify({ category_id: id, categoryName: name, description: desc }));

  try {
    const response = await axios.post(`${baseApiUrl}/categories.php`, formData);
    if (response.data == 1) {
      bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
      displayCategories();
    } else {
      alert("Failed to update category.");
    }
  } catch (error) {
    console.error("Update Error", error);
  }
};