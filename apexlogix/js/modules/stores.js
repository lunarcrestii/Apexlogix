// js/modules/stores.js
const baseApiUrl = "./api";

export async function initStoresModule() {
    const btnSave = document.getElementById('btn-save-store');
    if (btnSave) {
        btnSave.onclick = saveStore;
    }

    const btnUpdate = document.getElementById('btn-update-store');
    if (btnUpdate) {
        btnUpdate.onclick = updateStore;
    }

    await loadStoresTable();
}

export async function loadStoresTable() {
    const div = document.getElementById('stores-table-div');
    if (!div) return;

    div.innerHTML = '<div class="p-3 text-muted">Loading store outlets...</div>';

    try {
        const res = await axios.get(`${baseApiUrl}/transfers.php?action=get_branches`);
        if (res.data.success) {
            const branches = res.data.branches || [];
            if (branches.length === 0) {
                div.innerHTML = '<div class="p-3 text-muted">No store outlets registered.</div>';
                return;
            }

            let html = `
                <div class="table-responsive">
                    <table class="table table-sm table-hover mb-0 align-middle">
                        <thead>
                            <tr>
                                <th>Branch ID</th>
                                <th>Store Code</th>
                                <th>Store Outlet Name</th>
                                <th>Type</th>
                                <th class="text-center">Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>`;

            branches.forEach(b => {
                const isCentral = (b.branch_id == 1);
                const statusBadge = (b.is_active == 1) ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>';
                const typeLabel = isCentral ? '<span class="badge bg-dark">Central Warehouse</span>' : '<span class="badge bg-info text-dark">Retail Store Outlet</span>';

                html += `
                    <tr>
                        <td class="fw-bold">#${b.branch_id}</td>
                        <td><span class="badge bg-light text-dark border">${b.branch_code}</span></td>
                        <td class="fw-bold">${b.branch_name}</td>
                        <td>${typeLabel}</td>
                        <td class="text-center">${statusBadge}</td>
                        <td class="text-center">
                            ${!isCentral ? `
                                <button class="btn btn-sm btn-outline-dark py-0 px-2" onclick="window.stores.openEditModal(${b.branch_id}, '${b.branch_code}', '${b.branch_name.replace(/'/g, "\\'")}')">Edit</button>
                                <button class="btn btn-sm ${b.is_active == 1 ? 'btn-outline-danger' : 'btn-outline-success'} py-0 px-2" onclick="window.stores.toggleStoreStatus(${b.branch_id}, ${b.is_active})">
                                    ${b.is_active == 1 ? 'Deactivate' : 'Activate'}
                                </button>
                            ` : '<small class="text-muted">Primary System Hub</small>'}
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;
            div.innerHTML = html;
        } else {
            div.innerHTML = `<div class="p-3 text-danger">Error: ${res.data.error || 'Failed to load store outlets'}</div>`;
        }
    } catch (e) {
        console.error("Failed to load stores table:", e);
        div.innerHTML = '<div class="p-3 text-danger">Server error loading store outlets.</div>';
    }
}

async function saveStore() {
    const code = document.getElementById('store-code')?.value.trim();
    const name = document.getElementById('store-name')?.value.trim();

    if (!code || !name) {
        return alert("Store Code and Store Name are required!");
    }

    try {
        const res = await axios.post(`${baseApiUrl}/transfers.php?action=create_branch`, {
            branch_code: code,
            branch_name: name
        });

        if (res.data.success) {
            alert(`Store Outlet "${name}" registered successfully!`);
            document.getElementById('store-code').value = '';
            document.getElementById('store-name').value = '';
            await loadStoresTable();
        } else {
            alert("Error: " + (res.data.error || "Failed to add store outlet"));
        }
    } catch (e) {
        console.error("Save Store Error:", e);
        alert("Server error creating store outlet.");
    }
}

function openEditModal(id, code, name) {
    document.getElementById('edit-store-id').value = id;
    document.getElementById('edit-store-code').value = code;
    document.getElementById('edit-store-name').value = name;

    const modalEl = document.getElementById('editStoreModal');
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

async function updateStore() {
    const id = document.getElementById('edit-store-id')?.value;
    const code = document.getElementById('edit-store-code')?.value.trim();
    const name = document.getElementById('edit-store-name')?.value.trim();

    if (!id || !code || !name) {
        return alert("All fields are required!");
    }

    try {
        const res = await axios.post(`${baseApiUrl}/transfers.php?action=update_branch`, {
            branch_id: id,
            branch_code: code,
            branch_name: name
        });

        if (res.data.success) {
            alert("Store outlet updated successfully!");
            const modalEl = document.getElementById('editStoreModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            await loadStoresTable();
        } else {
            alert("Error: " + (res.data.error || "Failed to update store"));
        }
    } catch (e) {
        console.error("Update Store Error:", e);
        alert("Server error updating store outlet.");
    }
}

async function toggleStoreStatus(id, currentActive) {
    const newStatus = currentActive == 1 ? 0 : 1;
    const actionName = newStatus == 1 ? "Activate" : "Deactivate";

    if (!confirm(`Are you sure you want to ${actionName} this store outlet?`)) return;

    try {
        const res = await axios.post(`${baseApiUrl}/transfers.php?action=toggle_branch_status`, {
            branch_id: id,
            is_active: newStatus
        });

        if (res.data.success) {
            await loadStoresTable();
        } else {
            alert("Error: " + (res.data.error || "Failed to change store status"));
        }
    } catch (e) {
        console.error("Toggle Store Error:", e);
        alert("Server error toggling store status.");
    }
}

window.stores = {
    openEditModal,
    toggleStoreStatus
};