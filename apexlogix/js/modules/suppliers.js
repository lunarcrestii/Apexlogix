// js/modules/suppliers.js
const baseApiUrl = "./api";

export const initSuppliersModule = async () => {
  try {
    await loadCategoriesDropdown();
    await displaySuppliersTable();
    document.getElementById("btn-save-supplier").onclick = saveSupplierAccount;
  } catch (error) {
    console.error("Supplier Module Error:", error);
  }
};

const loadCategoriesDropdown = async () => {
  try {
    const res = await axios.get(`${baseApiUrl}/categories.php`, { params: { action: "get_categories" } });
    if (res.data?.success && Array.isArray(res.data.categories)) {
      const optionsHtml = res.data.categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
      document.getElementById("sup-categories").innerHTML = optionsHtml;
      document.getElementById("edit-sup-categories").innerHTML = optionsHtml;
    }
  } catch (e) {
    console.error("Failed to load category options", e);
  }
};

const displaySuppliersTable = async () => {
  const response = await axios.get(`${baseApiUrl}/suppliers.php`, { params: { operation: "getSuppliers" } });
  const tableDiv = document.getElementById("suppliers-table-div");

  if (response.status === 200) {
    tableDiv.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-bordered table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 120px;">Supplier Code</th>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Specialized Categories</th>
              <th style="width: 160px;">Registered Date</th>
              <th class="text-center" style="width: 130px;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${response.data.map(s => {
              const catIdsNumArr = (s.category_ids_arr || []).map(id => parseInt(id, 10)).filter(n => !isNaN(n));
              const catIdsStr = JSON.stringify(catIdsNumArr);
              
              const safeCompany = (s.company_name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              const safeContact = (s.contact_name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              const safeCode = (s.supplier_code || '').replace(/'/g, "\\'");

              const badges = (s.specialized_product || 'Unassigned')
                .split(', ')
                .map(c => `<span class="badge bg-light text-dark border border-secondary fw-semibold me-1 my-1">${c}</span>`)
                .join('');
              
              return `
                <tr>
                  <td><code>${s.supplier_code}</code></td>
                  <td class="fw-bold">${s.company_name}</td>
                  <td>${s.contact_name || '-'}</td>
                  <td>${badges}</td>
                  <td><small class="text-muted">${s.created_at}</small></td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-dark py-0 px-2" onclick="window.openEditSupplierModal(${s.supplier_id}, '${safeCode}', '${safeCompany}', '${safeContact}',${catIdsStr})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.archiveSupplier(${s.supplier_id})">Archive</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

const saveSupplierAccount = async () => {
  try {
    const supplierCode = document.getElementById("sup-code").value.trim();
    const companyName = document.getElementById("sup-company").value.trim();
    const contactName = document.getElementById("sup-contact").value.trim();
    const selectedOptions = Array.from(document.getElementById("sup-categories").selectedOptions);
    const categoryIds = selectedOptions.map(opt => opt.value);

    if (!supplierCode || !companyName || categoryIds.length === 0) {
      return alert("Please fill in Supplier Code, Company Name, and select at least one Category!");
    }

    const formData = new FormData();
    formData.append("operation", "insertSupplier");
    formData.append("json", JSON.stringify({ supplierCode, companyName, contactName, categoryIds }));

    const response = await axios.post(`${baseApiUrl}/suppliers.php`, formData);
    if (response.data == 1) {
      alert("Supplier Account Created Successfully!");
      document.getElementById("sup-code").value = "";
      document.getElementById("sup-company").value = "";
      document.getElementById("sup-contact").value = "";
      Array.from(document.getElementById("sup-categories").options).forEach(opt => opt.selected = false);
      displaySuppliersTable();
    } else {
      alert("Failed to save supplier account.");
    }
  } catch (error) {
    console.error("Save Supplier Error:", error);
  }
};

window.archiveSupplier = async function(id) {
  if (!confirm("Are you sure you want to archive this supplier?")) return;
  const formData = new FormData();
  formData.append("operation", "archiveSupplier");
  formData.append("json", JSON.stringify({ supplier_id: id }));

  try {
    const response = await axios.post(`${baseApiUrl}/suppliers.php`, formData);
    if (response.data == 1) initSuppliersModule();
  } catch (error) {
    console.error("Archive Error", error);
  }
};

window.openEditSupplierModal = function(id, code, company, contact, categoryIds) {
  document.getElementById('edit-sup-id').value = id;
  document.getElementById('edit-sup-code').value = code;
  document.getElementById('edit-sup-company').value = company;
  document.getElementById('edit-sup-contact').value = contact;

  const select = document.getElementById('edit-sup-categories');
  if (select && Array.isArray(categoryIds)) {
    Array.from(select.options).forEach(opt => {
      opt.selected = categoryIds.includes(parseInt(opt.value, 10));
    });
  }

  new bootstrap.Modal(document.getElementById('editSupplierModal')).show();
};

document.getElementById('btn-update-supplier').onclick = async function() {
  const id = document.getElementById('edit-sup-id').value;
  const code = document.getElementById('edit-sup-code').value.trim();
  const company = document.getElementById('edit-sup-company').value.trim();
  const contact = document.getElementById('edit-sup-contact').value.trim();
  const selectedOptions = Array.from(document.getElementById('edit-sup-categories').selectedOptions);
  const categoryIds = selectedOptions.map(opt => opt.value);

  if (!code || !company || categoryIds.length === 0) {
    return alert("Code, Company, and at least one Category are required.");
  }

  const formData = new FormData();
  formData.append("operation", "updateSupplier");
  formData.append("json", JSON.stringify({ supplier_id: id, supplierCode: code, companyName: company, contactName: contact, categoryIds }));

  try {
    const response = await axios.post(`${baseApiUrl}/suppliers.php`, formData);
    if (response.data == 1) {
      bootstrap.Modal.getInstance(document.getElementById('editSupplierModal')).hide();
      initSuppliersModule();
    } else {
      alert("Failed to update supplier.");
    }
  } catch (error) {
    console.error("Update Error", error);
  }
};