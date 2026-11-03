// js/modules/transfers.js

let draftReleaseItems = [];
let allBranchesCache = [];
let warehouseProductsCache = [];

export function initTransfers() {
    document.getElementById('btn-add-release-item')?.addEventListener('click', addReleaseDraftItem);
    document.getElementById('btn-create-release')?.addEventListener('click', createReleaseVoucher);
    document.getElementById('btn-submit-store-return')?.addEventListener('click', submitStoreReturn);

    document.getElementById('nav-transfers')?.addEventListener('click', () => {
        loadBranches();
        loadTransfers();
        loadWarehouseProducts();
    });

    loadBranches();
    loadTransfers();
    loadWarehouseProducts();
}

async function loadBranches() {
    try {
        const res = await axios.get('api/transfers.php?action=get_branches');
        if (res.data.success) {
            allBranchesCache = res.data.branches || [];
            const destSelect = document.getElementById('tr-destination-store');
            const returnStoreSelect = document.getElementById('sr-store-select');

            if (destSelect) {
                destSelect.innerHTML = '<option value="">-- Select Destination Store --</option>' +
                    allBranchesCache.filter(b => b.branch_id != 1).map(b => `<option value="${b.branch_id}">${b.branch_name} (${b.branch_code})</option>`).join('');
            }
            if (returnStoreSelect) {
                returnStoreSelect.innerHTML = allBranchesCache.filter(b => b.branch_id != 1).map(b => `<option value="${b.branch_id}">${b.branch_name}</option>`).join('');
            }
        }
    } catch (e) {
        console.error("Failed to load branches", e);
    }
}

async function loadWarehouseProducts() {
    try {
        const res = await axios.get('api/products.php?action=get_products');
        if (res.data.success) {
            warehouseProductsCache = res.data.products || [];
            const pSelect = document.getElementById('tr-product-select');
            const srProductSelect = document.getElementById('sr-product-select');

            if (pSelect) {
                pSelect.innerHTML = '<option value="">-- Select Product --</option>' +
                    warehouseProductsCache.map(p => `<option value="${p.product_id}" data-stock="${p.sellable_qty}">${p.product_name} (SKU: ${p.sku}) - Warehouse Stock: ${p.sellable_qty}</option>`).join('');
            }
            if (srProductSelect) {
                srProductSelect.innerHTML = '<option value="">-- Select Product --</option>' +
                    warehouseProductsCache.map(p => `<option value="${p.product_id}">${p.product_name} (${p.sku})</option>`).join('');
            }
        }
    } catch (e) {
        console.error("Failed to load products for release", e);
    }
}

function addReleaseDraftItem() {
    const pSelect = document.getElementById('tr-product-select');
    const qtyInput = document.getElementById('tr-qty');
    const productId = pSelect.value;
    const qty = parseFloat(qtyInput.value) || 0;

    if (!productId || qty <= 0) return alert("Select a valid product and quantity.");

    const prod = warehouseProductsCache.find(p => p.product_id == productId);
    if (!prod) return;

    if (qty > parseFloat(prod.sellable_qty)) {
        return alert(`Cannot release ${qty} units. Warehouse only has ${prod.sellable_qty} available.`);
    }

    const existingIndex = draftReleaseItems.findIndex(i => i.product_id == productId);
    if (existingIndex >= 0) {
        draftReleaseItems[existingIndex].quantity += qty;
    } else {
        draftReleaseItems.push({
            product_id: productId,
            sku: prod.sku,
            product_name: prod.product_name,
            quantity: qty
        });
    }

    renderReleaseDraftTable();
    pSelect.value = '';
    qtyInput.value = '10';
}

function renderReleaseDraftTable() {
    const tbody = document.getElementById('tr-draft-items-body');
    const summary = document.getElementById('tr-draft-summary');

    if (!tbody) return;

    if (draftReleaseItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No product line items added. Select products above to draft dispatch.</td></tr>`;
        if (summary) summary.textContent = "Total Items: 0";
        return;
    }

    let totalUnits = 0;
    tbody.innerHTML = draftReleaseItems.map((item, idx) => {
        totalUnits += item.quantity;
        return `
            <tr>
                <td><strong>${item.product_name}</strong> <small class="text-muted">(${item.sku})</small></td>
                <td class="text-center fw-bold">${item.quantity}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.transfers.removeDraftItem(${idx})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    if (summary) summary.textContent = `Total Lines: ${draftReleaseItems.length} | Total Units: ${totalUnits}`;
}

async function createReleaseVoucher() {
    const destStore = document.getElementById('tr-destination-store').value;
    const note = document.getElementById('tr-note').value;

    if (!destStore) return alert("Select a Destination Store.");
    if (draftReleaseItems.length === 0) return alert("Add at least one product to dispatch.");

    try {
        const res = await axios.post('api/transfers.php?action=create_transfer', {
            from_branch_id: 1,
            to_branch_id: destStore,
            note: note,
            items: draftReleaseItems
        });

        if (res.data.success) {
            alert(`Stock Release Voucher ${res.data.transfer_no} drafted successfully!`);
            draftReleaseItems = [];
            renderReleaseDraftTable();
            document.getElementById('tr-note').value = '';
            loadTransfers();
            loadWarehouseProducts();
        } else alert("Error: " + res.data.error);
    } catch (e) {
        alert("Server error creating stock release.");
    }
}

export async function loadTransfers() {
    const div = document.getElementById('transfers-table-div');
    if (!div) return;

    div.innerHTML = '<div class="p-3 text-muted">Loading stock release vouchers...</div>';

    try {
        const res = await axios.get('api/transfers.php?action=get_transfers');
        if (!res.data.success) return div.innerHTML = `<div class="p-3 text-danger">${res.data.error}</div>`;

        const records = res.data.transfers || [];
        if (records.length === 0) {
            div.innerHTML = '<div class="p-3 text-muted">No stock release vouchers generated yet.</div>';
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Voucher #</th>
                            <th>Origin</th>
                            <th>Destination Store</th>
                            <th>Items Summary</th>
                            <th class="text-center">Total Units</th>
                            <th class="text-center">Status</th>
                            <th>Created At</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>`;

        records.forEach(t => {
            let badge = 'bg-warning text-dark';
            if (t.status === 'Released') badge = 'bg-success';
            if (t.status === 'Cancelled') badge = 'bg-danger';

            html += `
                <tr>
                    <td class="fw-bold">${t.transfer_no}</td>
                    <td>${t.from_branch_name}</td>
                    <td class="fw-bold text-primary">${t.to_branch_name}</td>
                    <td><small>${t.item_summary || 'N/A'}</small></td>
                    <td class="text-center fw-bold">${t.total_units || 0}</td>
                    <td class="text-center"><span class="badge ${badge}">${t.status}</span></td>
                    <td><small>${t.created_at}</small></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-success py-0 px-2" onclick="window.transfers.releaseStock(${t.transfer_id})" ${t.status !== 'Pending' ? 'disabled' : ''}>Release Stock</button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.transfers.cancelTransfer(${t.transfer_id})" ${t.status !== 'Pending' ? 'disabled' : ''}>Cancel</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        div.innerHTML = html;
    } catch (e) {
        div.innerHTML = '<div class="p-3 text-danger">Failed to load transfer vouchers.</div>';
    }
}

async function releaseStock(transferId) {
    if (!confirm("Confirm dispatching stock from Central Warehouse to Store? Stock will be updated immediately.")) return;

    try {
        const res = await axios.post('api/transfers.php?action=release_transfer', { transfer_id: transferId });
        if (res.data.success) {
            alert("Stock Released & Transferred to Store Inventory!");
            loadTransfers();
            loadWarehouseProducts();
        } else alert("Error: " + res.data.error);
    } catch (e) {
        alert("Server error releasing transfer.");
    }
}

async function cancelTransfer(transferId) {
    if (!confirm("Are you sure you want to cancel this transfer voucher?")) return;

    try {
        const res = await axios.post('api/transfers.php?action=cancel_transfer', { transfer_id: transferId });
        if (res.data.success) {
            loadTransfers();
        } else alert("Error: " + res.data.error);
    } catch (e) {
        alert("Server error cancelling transfer.");
    }
}

async function submitStoreReturn() {
    const storeId = document.getElementById('sr-store-select').value;
    const productId = document.getElementById('sr-product-select').value;
    const qty = parseFloat(document.getElementById('sr-qty').value) || 0;
    const reasonId = document.getElementById('sr-reason-select').value || 1;
    const note = document.getElementById('sr-note').value;

    if (!storeId || !productId || qty <= 0) {
        return alert("Select store, product, and valid return quantity.");
    }

    try {
        const res = await axios.post('api/transfers.php?action=create_store_return', {
            from_branch_id: storeId,
            reason_id: reasonId,
            note: note,
            items: [{ product_id: productId, quantity: qty }]
        });

        if (res.data.success) {
            alert(`Step 1 Store Return Complete (${res.data.return_no})! Damaged stock deposited into Central Warehouse Non-Sellable bucket.`);
            document.getElementById('sr-qty').value = '';
            document.getElementById('sr-note').value = '';
            loadWarehouseProducts();

            // Trigger Standardized Store Return Slip Document Modal
            const storeObj = allBranchesCache.find(b => b.branch_id == storeId);
            const prodObj = warehouseProductsCache.find(p => p.product_id == productId);
            const reasonText = document.getElementById('sr-reason-select')?.selectedOptions[0]?.text || "Damaged Goods";

            if (typeof window.openStandardizedReturnDoc === 'function') {
                window.openStandardizedReturnDoc({
                    type: "STORE RETURN SLIP",
                    trackingNo: res.data.return_no,
                    entityLabel: "Origin Store Outlet",
                    entityName: storeObj ? storeObj.branch_name : "Store Outlet",
                    entityCode: storeObj ? storeObj.branch_code : "N/A",
                    date: new Date().toLocaleDateString('en-CA'),
                    reason: reasonText,
                    remarks: note || "Returned directly to Warehouse Non-Sellable bucket",
                    items: [{
                        sku: prodObj ? prodObj.sku : "N/A",
                        name: prodObj ? prodObj.product_name : "Product",
                        qty: qty,
                        unitCost: prodObj ? parseFloat(prodObj.unit_cost || prodObj.retail_price || 0) : 0
                    }]
                });
            }
        } else alert("Error: " + res.data.error);
    } catch (e) {
        alert("Server error submitting store return.");
    }
}

window.transfers = {
    removeDraftItem: (idx) => { draftReleaseItems.splice(idx, 1); renderReleaseDraftTable(); },
    releaseStock,
    cancelTransfer
};