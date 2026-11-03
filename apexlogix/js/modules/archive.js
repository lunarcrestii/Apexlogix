// js/modules/archive.js

const baseApiUrl = './api';
let currentArchiveTab = 'products';

export async function initArchive() {
    setupTabButtons();
    await loadArchivedData(currentArchiveTab);
}

function setupTabButtons() {
    const btnProducts = document.getElementById('archive-tab-products');
    const btnCategories = document.getElementById('archive-tab-categories');
    const btnSuppliers = document.getElementById('archive-tab-suppliers');

    if (btnProducts) btnProducts.onclick = () => switchArchiveTab('products');
    if (btnCategories) btnCategories.onclick = () => switchArchiveTab('categories');
    if (btnSuppliers) btnSuppliers.onclick = () => switchArchiveTab('suppliers');
}

async function switchArchiveTab(type) {
    currentArchiveTab = type;
    document.querySelectorAll('.archive-nav-btn').forEach(b => b.classList.remove('btn-dark'));
    document.querySelectorAll('.archive-nav-btn').forEach(b => b.classList.add('btn-outline-dark'));
    
    const activeBtn = document.getElementById(`archive-tab-${type}`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline-dark');
        activeBtn.classList.add('btn-dark');
    }

    await loadArchivedData(type);
}

export async function loadArchivedData(type) {
    const container = document.getElementById('archive-table-div');
    if (!container) return;

    container.innerHTML = `<div class="p-3 text-muted">Loading archived ${type}...</div>`;

    try {
        const response = await axios.get(`${baseApiUrl}/archive.php`, {
            params: { operation: "getArchived", type: type }
        });

        const result = response.data;

        if (!result.success) {
            container.innerHTML = `<div class="p-3 text-danger">${result.error}</div>`;
            return;
        }

        if (result.data.length === 0) {
            container.innerHTML = `<div class="p-3 text-muted">No archived ${type} found.</div>`;
            return;
        }

        let html = `<div class="table-responsive"><table class="table table-sm table-bordered table-hover mb-0"><thead><tr>`;

        if (type === 'products') {
            html += `
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th class="text-end">Price</th>
                <th class="text-center">Actions</th>
            </tr></thead><tbody>`;
            result.data.forEach(p => {
                html += `
                    <tr>
                        <td>${p.sku}</td>
                        <td>${p.product_name}</td>
                        <td>${p.category_name || 'N/A'}</td>
                        <td class="text-end">₱${parseFloat(p.retail_price).toFixed(2)}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-success py-0 px-2" onclick="restoreArchiveItem('products', ${p.product_id})">Restore</button>
                            <button class="btn btn-sm btn-danger py-0 px-2" onclick="hardDeleteArchiveItem('products', ${p.product_id}, '${p.product_name}')">Hard Delete</button>
                        </td>
                    </tr>`;
            });
        } else if (type === 'categories') {
            html += `
                <th>Category ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th class="text-center">Actions</th>
            </tr></thead><tbody>`;
            result.data.forEach(c => {
                html += `
                    <tr>
                        <td>${c.category_id}</td>
                        <td>${c.category_name}</td>
                        <td>${c.description || 'N/A'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-success py-0 px-2" onclick="restoreArchiveItem('categories', ${c.category_id})">Restore</button>
                            <button class="btn btn-sm btn-danger py-0 px-2" onclick="hardDeleteArchiveItem('categories', ${c.category_id}, '${c.category_name}')">Hard Delete</button>
                        </td>
                    </tr>`;
            });
        } else if (type === 'suppliers') {
            html += `
                <th>Supplier Code</th>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th class="text-center">Actions</th>
            </tr></thead><tbody>`;
            result.data.forEach(s => {
                // Check both contact_name (DB column) and contact_person for backwards safety
                const contactPerson = s.contact_name || s.contact_person || 'N/A';
                html += `
                    <tr>
                        <td>${s.supplier_code || 'N/A'}</td>
                        <td>${s.company_name}</td>
                        <td>${contactPerson}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-success py-0 px-2" onclick="restoreArchiveItem('suppliers', ${s.supplier_id})">Restore</button>
                            <button class="btn btn-sm btn-danger py-0 px-2" onclick="hardDeleteArchiveItem('suppliers', ${s.supplier_id}, '${s.company_name}')">Hard Delete</button>
                        </td>
                    </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    } catch (e) {
        console.error("Failed to load archive data:", e);
        container.innerHTML = `<div class="p-3 text-danger">Server error fetching archive data.</div>`;
    }
}

window.restoreArchiveItem = async function(type, id) {
    if (!confirm(`Are you sure you want to restore this ${type.slice(0, -1)}?`)) return;

    try {
        const jsonData = { type: type, id: id };
        const formData = new FormData();
        formData.append("operation", "restoreItem");
        formData.append("json", JSON.stringify(jsonData));

        const response = await axios({
            url: `${baseApiUrl}/archive.php`,
            method: "POST",
            data: formData
        });

        if (response.data.success) {
            alert("Item restored successfully!");
            loadArchivedData(type);
        } else {
            alert("Error: " + response.data.error);
        }
    } catch (e) {
        alert("Server error restoring item.");
    }
};

window.hardDeleteArchiveItem = async function(type, id, name) {
    const modalEl = document.getElementById('managerAuthModal');
    const inputEl = document.getElementById('auth-password-input');
    const msgEl = document.getElementById('authModalMessage');
    const confirmBtn = document.getElementById('btn-submit-auth');

    if (!modalEl || !inputEl || !confirmBtn) {
        alert("Authorization modal missing.");
        return;
    }

    if (msgEl) {
        msgEl.textContent = `PERMANENT DELETE: Enter Manager or Admin password to erase "${name}":`;
    }
    inputEl.value = '';

    const bsModal = new bootstrap.Modal(modalEl);

    const password = await new Promise((resolve) => {
        const handleConfirm = () => {
            const pass = inputEl.value.trim();
            if (!pass) {
                alert("Password is required.");
                return;
            }
            cleanup();
            bsModal.hide();
            resolve(pass);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') handleConfirm();
        };

        const handleHidden = () => {
            cleanup();
            resolve(null);
        };

        function cleanup() {
            confirmBtn.removeEventListener('click', handleConfirm);
            inputEl.removeEventListener('keydown', handleKeyDown);
            modalEl.removeEventListener('hidden.bs.modal', handleHidden);
        }

        confirmBtn.addEventListener('click', handleConfirm);
        inputEl.addEventListener('keydown', handleKeyDown);
        modalEl.addEventListener('hidden.bs.modal', handleHidden);

        bsModal.show();
        setTimeout(() => inputEl.focus(), 300);
    });

    if (!password) return; // Cancelled or closed

    try {
        const jsonData = { type: type, id: id, passcode: password };
        const formData = new FormData();
        formData.append("operation", "hardDelete");
        formData.append("json", JSON.stringify(jsonData));

        const response = await axios({
            url: `${baseApiUrl}/archive.php`,
            method: "POST",
            data: formData
        });

        if (response.data.success) {
            alert("Record permanently erased from database.");
            loadArchivedData(type);
        } else {
            alert("Authorization Failed: " + (response.data.error || "Invalid Password"));
        }
    } catch (e) {
        alert("Server error processing hard deletion.");
    }
};