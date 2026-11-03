let currentReceivePoId = null;
let currentPrPoId = null;

export async function loadPoDropdowns() {
    try {
        const supRes = await fetch('api/suppliers.php?operation=getSuppliers');
        const supData = await supRes.json();
        const supSelect = document.getElementById('po-supplier-select');
        
        if (supSelect && supData) {
            supSelect.innerHTML = '<option value="">-- Select Supplier --</option>';
            supData.forEach(s => {
                supSelect.innerHTML += `<option value="${s.supplier_id}">${s.company_name}</option>`;
            });
        }

        const prodRes = await fetch('api/products.php?action=get_products');
        const prodData = await prodRes.json();
        const prodSelect = document.getElementById('po-product-select');
        
        if (prodSelect && prodData.success) {
            prodSelect.innerHTML = '<option value="">-- Select Product --</option>';

            prodData.products.forEach(p => {
                const isLowStock = p.sellable_qty < 5;
                const colorStyle = isLowStock ? 'style="color: red; font-weight: bold;"' : '';

                prodSelect.innerHTML += `<option value="${p.product_id}" ${colorStyle}>
                    ${p.product_name} (SKU: ${p.sku}) - Qty: ${p.sellable_qty}
                </option>`;
            });
        }
    } catch (e) {
        console.error("Failed to load dropdowns for PO creation", e);
    }
}

const btnCreatePo = document.getElementById('btn-create-po');
if (btnCreatePo) {
    btnCreatePo.addEventListener('click', async function() {
        const btn = this;
        const supplierId = document.getElementById('po-supplier-select').value;
        const productId = document.getElementById('po-product-select').value;
        const qty = document.getElementById('po-qty').value;

        if (!supplierId || !productId || qty <= 0) {
            return alert("Please select a supplier, a product, and enter a valid quantity.");
        }

        const payload = {
            supplier_id: supplierId,
            items: [{ product_id: productId, quantity: qty }]
        };

        btn.disabled = true;
        btn.innerText = "Drafting...";

        try {
            const res = await fetch('api/po.php?action=create_po', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.success) {
                alert(`Purchase Order ${data.po_number} drafted successfully!`);
                document.getElementById('po-product-select').value = '';
                document.getElementById('po-qty').value = '10';
                initPO(); 
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            console.error("PO Creation Error:", e);
            alert("Failed to reach the server to create Purchase Order.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Draft Purchase Order";
        }
    });
}

export const initPO = async () => {
  try {
    await loadPoDropdowns();
    const tableDiv = document.getElementById("po-table-div");
    const response = await fetch("api/po.php?action=get_pos");
    
    if (!response.ok) {
        const errText = await response.text();
        console.error("Server Error Response:", errText);
        if (tableDiv) tableDiv.innerHTML = `<div class="p-3 text-danger">Server returned an error. Check console.</div>`;
        return;
    }

    const data = await response.json();
    
    if (data.success) {
      tableDiv.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-bordered table-hover mb-0">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Product(s)</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.purchase_orders.map(po => `
                <tr>
                  <td class="fw-bold">${po.po_number}</td>
                  <td>${po.company_name || 'N/A'}</td>
                  <td>${po.product_names || 'N/A'}</td>
                  <td><span class="badge bg-secondary">${po.status}</span></td>
                  <td>${po.created_at}</td>
                  <td>
                    <button class="btn btn-sm btn-dark" onclick="openReceiveModal(${po.po_id})" ${po.status === 'Closed' || po.status === 'Received' ? 'disabled' : ''}>Receive</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="openPurchaseReturnModal(${po.po_id})">Return</button>
                    <button class="btn btn-sm btn-danger" onclick="openCancelPoModal(${po.po_id}, '${po.po_number}')" ${po.status === 'Closed' || po.status === 'Received' ? 'disabled' : ''}>Cancel PO</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (error) {
    console.error("PO Load Error", error);
    if (document.getElementById("po-table-div")) {
      document.getElementById("po-table-div").innerHTML = `<div class="p-3 text-danger">Failed to load POs.</div>`;
    }
  }
};

export async function openReceiveModal(poId) {
    currentReceivePoId = poId;
    const res = await fetch(`api/po.php?action=get_po_details&po_id=${poId}`);
    const data = await res.json();

    if (!data.success) return alert(data.error);

    document.getElementById('receivePoNumber').innerText = `#${data.po.po_number}`;
    document.getElementById('receiveDrNumber').value = '';
    document.getElementById('receiveNote').value = '';

    const tbody = document.getElementById('receivePoItemsBody');
    tbody.innerHTML = '';

    data.items.forEach(item => {
        const ordered = parseFloat(item.qty_ordered) || 0;
        const received = parseFloat(item.received_qty) || 0;
        const balance = Math.max(0, ordered - received);

        if (balance > 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.product_name}<br><small class="text-muted">SKU: ${item.sku}</small></td>
                <td>${ordered}</td>
                <td>${received}</td>
                <td class="text-primary"><strong>${balance}</strong></td>
                <td>
                    <input type="number" class="form-control receive-input mb-1" 
                           data-item-id="${item.po_item_id}" 
                           data-product-id="${item.product_id}" 
                           data-balance="${balance}" min="0" max="${balance}" value="0" placeholder="Qty">
                    <input type="text" class="form-control lot-input mb-1" placeholder="Lot #">
                    <input type="date" class="form-control expiry-input">
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-secondary btn-receive-all">All</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    });

    tbody.querySelectorAll('.btn-receive-all').forEach(btn => {
        btn.onclick = (e) => {
            const input = e.target.closest('tr').querySelector('.receive-input');
            input.value = input.getAttribute('data-balance');
        };
    });

    new bootstrap.Modal(document.getElementById('receiveStockModal')).show();
}

export async function openPurchaseReturnModal(poId) {
    currentPrPoId = poId;
    const res = await fetch(`api/po.php?action=get_po_details&po_id=${poId}`);
    const data = await res.json();
    if (!data.success) return alert(data.error);

    document.getElementById('prPoNumber').innerText = `#${data.po.po_number}`;
    document.getElementById('prNote').value = '';

    const reasonRes = await fetch('api/po.php?action=get_reasons&applies_to=purchase_return');
    const reasonData = await reasonRes.json();
    const select = document.getElementById('prReasonSelect');
    select.innerHTML = '<option value="">-- Select Reason --</option>';
    if (reasonData.success) {
        reasonData.reasons.forEach(r => select.innerHTML += `<option value="${r.id}">${r.name}</option>`);
    }

    const tbody = document.getElementById('prPoItemsBody');
    tbody.innerHTML = '';

    data.items.forEach(item => {
        const received = parseFloat(item.received_qty) || 0;
        const returned = parseFloat(item.returned_qty) || 0;
        const returnable = Math.max(0, received - returned);

        if (returnable > 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.product_name}<br><small class="text-muted">SKU: ${item.sku}</small></td>
                <td>${received}</td>
                <td>${returned}</td>
                <td><strong>${returnable}</strong></td>
                <td>
                    <input type="number" class="form-control pr-input" 
                           data-item-id="${item.po_item_id}" 
                           data-product-id="${item.product_id}" 
                           data-returnable="${returnable}" min="0" max="${returnable}" value="0">
                </td>
                <td class="text-center">
                    <input type="checkbox" class="form-check-input pr-replacement-check">
                </td>
            `;
            tbody.appendChild(tr);
        }
    });

    new bootstrap.Modal(document.getElementById('purchaseReturnModal')).show();
}

const btnConfirmReceive = document.getElementById('btnConfirmReceive');
if (btnConfirmReceive) {
    btnConfirmReceive.onclick = async function() {
        const btn = this;
        const inputs = document.querySelectorAll('.receive-input');
        const items = [];
        let totalQty = 0;

        inputs.forEach(i => {
            const qty = parseFloat(i.value) || 0;
            const max = parseFloat(i.getAttribute('data-balance'));
            const row = i.closest('tr');
            const lot = row.querySelector('.lot-input').value;
            const expiry = row.querySelector('.expiry-input').value;

            if (qty > 0 && qty <= max) {
                totalQty += qty;
                items.push({ 
                    po_item_id: i.getAttribute('data-item-id'), 
                    product_id: i.getAttribute('data-product-id'), 
                    quantity: qty,
                    lot_number: lot,
                    expiry_date: expiry
                });
            }
        });

        if (totalQty <= 0) return alert("Enter a valid received quantity greater than 0.");

        btn.disabled = true;
        btn.innerText = "Receiving...";

        try {
            const res = await fetch('api/po.php?action=receive', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    po_id: currentReceivePoId,
                    dr_number: document.getElementById('receiveDrNumber').value,
                    note: document.getElementById('receiveNote').value,
                    items: items
                })
            });
            const data = await res.json();
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('receiveStockModal')).hide();
                alert(`Stock Received successfully (${data.receipt_no}).`);
                initPO();
            } else alert(data.error);
        } catch (e) {
            alert("Server error processing receipt.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Received";
        }
    };
}

const btnConfirmPurchaseReturn = document.getElementById('btnConfirmPurchaseReturn');
if (btnConfirmPurchaseReturn) {
    btnConfirmPurchaseReturn.onclick = async function() {
        const btn = this;
        const reasonId = document.getElementById('prReasonSelect').value;
        const note = document.getElementById('prNote').value;
        const inputs = document.querySelectorAll('.pr-input');
        const fromNonSellable = document.getElementById('prFromNonSellable')?.checked || false; 
        
        const items = [];
        let totalQty = 0;

        if (!reasonId) return alert("Select a return reason.");

        inputs.forEach(i => {
            const qty = parseFloat(i.value) || 0;
            const max = parseFloat(i.getAttribute('data-returnable'));
            const row = i.closest('tr');
            const replacement = row.querySelector('.pr-replacement-check').checked;

            if (qty > 0 && qty <= max) {
                totalQty += qty;
                items.push({
                    po_item_id: i.getAttribute('data-item-id'),
                    product_id: i.getAttribute('data-product-id'),
                    quantity: qty,
                    replacement_expected: replacement
                });
            }
        });

        if (totalQty <= 0) return alert("Enter at least one item to return.");

        btn.disabled = true;
        btn.innerText = "Processing...";

        try {
            const res = await fetch('api/po.php?action=purchase_return', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    po_id: currentPrPoId, 
                    reason_id: reasonId, 
                    note: note, 
                    items: items,
                    from_non_sellable: fromNonSellable
                })
            });
            const data = await res.json();
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('purchaseReturnModal')).hide();
                alert(`Stock Returned successfully (${data.pr_no}).`);
                initPO(); 
            } else alert(data.error);
        } catch (e) {
            console.error(e);
            alert("Server error processing purchase return.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Return";
        }
    };
}

let currentCancelPoId = null;

window.openCancelPoModal = function(poId, poNumber) {
    currentCancelPoId = poId;
    document.getElementById('cancelPoNumber').innerText = `#${poNumber}`;
    document.getElementById('cancelReasonSelect').value = '';
    document.getElementById('cancelNote').value = '';
    new bootstrap.Modal(document.getElementById('cancelPoModal')).show();
};

const btnConfirmCancelPo = document.getElementById('btnConfirmCancelPo');
if (btnConfirmCancelPo) {
    btnConfirmCancelPo.onclick = async function() {
        const btn = this;
        const reasonId = document.getElementById('cancelReasonSelect').value;
        const note = document.getElementById('cancelNote').value;

        if (!reasonId) return alert("You must select a cancellation reason.");

        btn.disabled = true;
        btn.innerText = "Cancelling...";

        try {
            const res = await fetch('api/po.php?action=close_po', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    po_id: currentCancelPoId,
                    reason_id: reasonId,
                    note: note
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                const modalEl = document.getElementById('cancelPoModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                
                alert("Purchase Order cancelled and closed successfully.");
                initPO();
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            console.error("Cancel PO Error:", e);
            alert("Server error processing cancellation.");
        } finally {
            btn.disabled = false;
            btn.innerText = "Confirm Cancellation";
        }
    };
}

window.openReceiveModal = openReceiveModal;
window.openPurchaseReturnModal = openPurchaseReturnModal;