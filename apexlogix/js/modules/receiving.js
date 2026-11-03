// js/modules/receiving.js

let currentPoId = null;
let draftPoItems = []; // Array of { product_id, product_name, sku, category_name, quantity }
let allSuppliersCache = [];
let allProductsCache = [];

export function initReceiving() {
    document.getElementById('btn-add-po-item')?.addEventListener('click', addPoDraftItem);
    document.getElementById('btn-create-po')?.addEventListener('click', createPO);
    document.getElementById('btnConfirmReceive')?.addEventListener('click', submitReceiveStock);
    document.getElementById('btnConfirmPurchaseReturn')?.addEventListener('click', submitPurchaseReturn);
    document.getElementById('btnConfirmCancelPo')?.addEventListener('click', submitCancelPO);
    document.getElementById('btnSaveReturnClaim')?.addEventListener('click', submitReturnClaim);
    document.getElementById('btn-receive-all-lines')?.addEventListener('click', fillAllReceiveMax);

    document.getElementById('nav-po')?.addEventListener('click', () => {
        loadPOs();
        loadPoDropdowns();
    });

    loadPOs();
    loadPoDropdowns();
}

export async function loadPOs() {
    const tableDiv = document.getElementById('po-table-div');
    if (!tableDiv) return;

    tableDiv.innerHTML = '<div class="p-3 text-muted">Loading purchase orders...</div>';

    try {
        const response = await axios.get('api/po.php?action=get_pos');
        const data = response.data;

        if (!data.success) {
            tableDiv.innerHTML = `<div class="p-3 text-danger">Error: ${data.error}</div>`;
            return;
        }

        if (!data.purchase_orders || data.purchase_orders.length === 0) {
            tableDiv.innerHTML = '<div class="p-3 text-muted">No purchase orders found.</div>';
            return;
        }

        let html = `
        <div class="table-responsive">
            <table class="table table-sm table-hover mb-0">
                <thead>
                    <tr>
                        <th>PO Number</th>
                        <th>Supplier</th>
                        <th>Expected Date</th>
                        <th>Status</th>
                        <th>Ordered Product Lines</th>
                        <th class="text-center">Total Qty Ordered</th>
                        <th class="text-center">Total Qty Received</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>`;

        data.purchase_orders.forEach(po => {
            const displayDate = (po.expected_date && po.expected_date !== '0000-00-00')
                ? po.expected_date
                : (po.created_at ? po.created_at.split(' ')[0] : 'N/A');

            let statusBadge = 'bg-secondary';
            if (po.status === 'Pending') statusBadge = 'bg-warning text-dark';
            if (po.status === 'Partially Received') statusBadge = 'bg-info text-dark';
            if (po.status === 'Received') statusBadge = 'bg-success';
            if (po.status === 'Closed') statusBadge = 'bg-danger';

            html += `
            <tr>
                <td class="fw-bold">${po.po_number}</td>
                <td>${po.company_name || 'N/A'}</td>
                <td><span>${displayDate}</span></td>
                <td><span class="badge ${statusBadge}">${po.status}</span></td>
                <td>${po.product_names || 'N/A'}</td>
                <td class="text-center fw-bold">${po.total_ordered || 0}</td>
                <td class="text-center fw-bold text-success">${po.total_received || 0}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-success py-0 px-2" onclick="window.receiving.openReceiveModal(${po.po_id})" ${po.status === 'Closed' || po.status === 'Received' ? 'disabled' : ''}>Receive Bulk</button>
                    <button class="btn btn-sm btn-outline-secondary py-0 px-2" onclick="window.receiving.printGoodsReceipt(null, ${po.po_id})" ${!po.total_received || po.total_received == 0 ? 'disabled' : ''} title="Print Goods Receipt Slip"><i class="fas fa-print"></i> Slip</button>
                    <button class="btn btn-sm btn-warning py-0 px-2" onclick="window.receiving.openReturnModal(${po.po_id})" ${!po.total_received || po.total_received == 0 ? 'disabled' : ''}>Return</button>
                    <button class="btn btn-sm btn-danger py-0 px-2" onclick="window.receiving.openCancelModal(${po.po_id}, '${po.po_number}')" ${po.status === 'Closed' || po.status === 'Received' ? 'disabled' : ''}>Cancel</button>
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
        tableDiv.innerHTML = html;
    } catch (error) {
        tableDiv.innerHTML = `<div class="p-3 text-danger">Failed to connect to server.</div>`;
    }
}

async function loadPoDropdowns() {
    try {
        const [supRes, prodRes] = await Promise.all([
            axios.get('api/suppliers.php?operation=getSuppliers'),
            axios.get('api/products.php?action=get_products')
        ]);

        allSuppliersCache = Array.isArray(supRes.data) ? supRes.data : [];
        allProductsCache = prodRes.data?.success ? prodRes.data.products : [];

        const supSelect = document.getElementById('po-supplier-select');
        const prodSelect = document.getElementById('po-product-select');

        if (!supSelect || !prodSelect) return;

        renderSupplierOptions(allSuppliersCache);
        renderProductOptions(allProductsCache);

        supSelect.onchange = function() {
            const selectedSupId = this.value;

            if (draftPoItems.length > 0) {
                if (!confirm("Changing supplier will clear the current draft item lines. Proceed?")) {
                    return;
                }
                draftPoItems = [];
                renderDraftItemsTable();
            }

            if (!selectedSupId) {
                renderProductOptions(allProductsCache);
                updateSupplierInfoText(null);
                return;
            }

            const sup = allSuppliersCache.find(s => s.supplier_id == selectedSupId);
            const allowedCatIds = sup ? (sup.category_ids_arr || []).map(id => String(id)) : [];

            const filteredProducts = allProductsCache.filter(p => allowedCatIds.includes(String(p.category_id)));
            renderProductOptions(filteredProducts);
            updateSupplierInfoText(sup);
        };

        prodSelect.onchange = function() {
            const opt = this.options[this.selectedIndex];
            const suggested = opt ? opt.getAttribute('data-suggested') : 50;
            if (suggested && document.getElementById('po-qty')) {
                document.getElementById('po-qty').value = suggested;
            }
        };

    } catch (error) {
        console.error("Failed to load cross-filtered PO dropdowns", error);
    }
}

function updateSupplierInfoText(supplier) {
    const infoEl = document.getElementById('po-supplier-category-info');
    if (!infoEl) return;
    if (!supplier) {
        infoEl.textContent = "Select a supplier to view eligible product categories.";
        infoEl.className = "text-muted small d-block mb-1";
    } else {
        infoEl.textContent = `Eligible Categories: ${supplier.specialized_product || 'All Categories'}`;
        infoEl.className = "text-primary fw-bold small d-block mb-1";
    }
}

function renderSupplierOptions(suppliersList, currentVal = '') {
    const supSelect = document.getElementById('po-supplier-select');
    if (!supSelect) return;
    supSelect.innerHTML = '<option value="">-- Select Supplier --</option>' + 
        suppliersList.map(s => `<option value="${s.supplier_id}">${s.company_name} (${s.specialized_product || 'Unassigned'})</option>`).join('');
    if (currentVal) supSelect.value = currentVal;
}

function renderProductOptions(productsList) {
    const prodSelect = document.getElementById('po-product-select');
    if (!prodSelect) return;
    prodSelect.innerHTML = '<option value="">-- Select Product --</option>';

    productsList.forEach(p => {
        const qty = parseFloat(p.sellable_qty || 0);
        const reorderLvl = parseFloat(p.reorder_level || 10);
        const isLow = qty <= reorderLvl;

        const option = document.createElement('option');
        option.value = p.product_id;
        option.setAttribute('data-suggested', p.suggested_reorder_qty || 50);
        option.setAttribute('data-sku', p.sku || '');
        option.setAttribute('data-name', p.product_name || '');
        option.setAttribute('data-category', p.category_name || 'N/A');

        if (isLow) {
            option.textContent = `${p.product_name} (SKU: ${p.sku}) - Stock: ${qty} 🔴 [LOW STOCK]`;
            option.style.color = '#dc3545';
            option.style.fontWeight = 'bold';
        } else {
            option.textContent = `${p.product_name} (SKU: ${p.sku}) - Stock: ${qty}`;
        }
        prodSelect.appendChild(option);
    });
}

function addPoDraftItem() {
    const supSelect = document.getElementById('po-supplier-select');
    const prodSelect = document.getElementById('po-product-select');
    const qtyInput = document.getElementById('po-qty');

    if (!supSelect.value) {
        alert("Please select a Supplier first!");
        return;
    }

    const productId = prodSelect.value;
    const qty = parseFloat(qtyInput.value) || 0;

    if (!productId || qty <= 0) {
        alert("Please select a valid Product and enter a Quantity greater than 0.");
        return;
    }

    const selectedOpt = prodSelect.options[prodSelect.selectedIndex];
    const sku = selectedOpt.getAttribute('data-sku') || '';
    const name = selectedOpt.getAttribute('data-name') || '';
    const category = selectedOpt.getAttribute('data-category') || 'N/A';

    const existingIndex = draftPoItems.findIndex(it => it.product_id == productId);
    if (existingIndex >= 0) {
        draftPoItems[existingIndex].quantity += qty;
    } else {
        draftPoItems.push({
            product_id: productId,
            sku: sku,
            product_name: name,
            category_name: category,
            quantity: qty
        });
    }

    renderDraftItemsTable();

    prodSelect.value = '';
    qtyInput.value = '10';
}

function removePoDraftItem(index) {
    draftPoItems.splice(index, 1);
    renderDraftItemsTable();
}

function renderDraftItemsTable() {
    const tbody = document.getElementById('po-draft-items-body');
    const summary = document.getElementById('po-draft-summary');

    if (!tbody) return;

    if (draftPoItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No product lines added yet. Select supplier & add products above.</td></tr>`;
        if (summary) summary.textContent = "Total Product Lines: 0";
        return;
    }

    let totalQty = 0;
    tbody.innerHTML = draftPoItems.map((item, index) => {
        totalQty += item.quantity;
        return `
            <tr>
                <td><strong>${item.product_name}</strong> <small class="text-muted">(${item.sku})</small></td>
                <td>${item.category_name}</td>
                <td class="text-center fw-bold">${item.quantity}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="window.removePoDraftItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (summary) {
        summary.textContent = `Total Product Lines: ${draftPoItems.length} | Total Units: ${totalQty}`;
    }
}

async function createPO() {
    const supplierId = document.getElementById('po-supplier-select').value;
    const expectedDate = document.getElementById('po-expected-date')?.value || '';

    if (!supplierId) {
        alert("Please select a Supplier.");
        return;
    }

    if (draftPoItems.length === 0) {
        alert("Please add at least ONE product line item before drafting the Purchase Order.");
        return;
    }

    const btn = document.getElementById('btn-create-po');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Drafting PO...';
    }

    try {
        const response = await axios.post('api/po.php?action=create_po', {
            supplier_id: supplierId,
            expected_date: expectedDate,
            items: draftPoItems.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
        });

        if (response.data.success) {
            alert(`Multi-Item Purchase Order ${response.data.po_number} drafted successfully!`);
            draftPoItems = [];
            renderDraftItemsTable();
            document.getElementById('po-supplier-select').value = '';
            document.getElementById('po-supplier-select').dispatchEvent(new Event('change'));
            loadPOs();
        } else {
            alert("Error: " + response.data.error);
        }
    } catch (error) {
        alert("Server error occurred while drafting Purchase Order.");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Draft Purchase Order';
        }
    }
}

export async function openReceiveModal(poId) {
    currentPoId = poId;
    document.getElementById('receiveDrNumber').value = '';
    document.getElementById('receiveNote').value = '';
    const body = document.getElementById('receivePoItemsBody');
    body.innerHTML = '<tr><td colspan="6" class="text-center py-3">Loading PO line items...</td></tr>';
    
    new bootstrap.Modal(document.getElementById('receiveStockModal')).show();

    try {
        const res = await axios.get(`api/po.php?action=get_po_details&po_id=${poId}`);
        if (!res.data.success) throw new Error(res.data.error);

        document.getElementById('receivePoNumber').textContent = res.data.po.po_number;
        let html = '';

        res.data.items.forEach(item => {
            const ordered = parseFloat(item.qty_ordered) || 0;
            const received = parseFloat(item.received_qty) || 0;
            const remaining = Math.max(0, ordered - received);
            const suggestedLot = item.next_lot_number || '1';

            html += `
            <tr data-po-item-id="${item.po_item_id}" data-product-id="${item.product_id}">
                <td>
                    <strong>${item.product_name}</strong><br>
                    <small class="text-muted">SKU: ${item.sku} | Cat: ${item.category_name || 'N/A'}</small>
                </td>
                <td class="text-center">${ordered}</td>
                <td class="text-center">${received}</td>
                <td class="text-center fw-bold text-primary">${remaining}</td>
                <td>
                    <div class="row g-1">
                        <div class="col-4">
                            <input type="number" class="form-control form-control-sm receive-qty-input fw-bold" max="${remaining}" min="0" value="${remaining > 0 ? remaining : 0}" placeholder="Qty">
                        </div>
                        <div class="col-4">
                            <input type="text" class="form-control form-control-sm receive-lot-input" value="${suggestedLot}" placeholder="Lot # *" required style="font-size:0.8rem;">
                        </div>
                        <div class="col-4">
                            <input type="date" class="form-control form-control-sm receive-expiry-input" required style="font-size:0.8rem;">
                        </div>
                    </div>
                </td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-primary py-0 px-2" onclick="this.closest('tr').querySelector('.receive-qty-input').value = ${remaining}">Max</button>
                </td>
            </tr>`;
        });

        body.innerHTML = html || '<tr><td colspan="6" class="text-center text-muted py-3">No line items to receive.</td></tr>';
    } catch (error) {
        body.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">Error loading PO details.</td></tr>`;
    }
}

function fillAllReceiveMax() {
    const rows = document.querySelectorAll('#receivePoItemsBody tr[data-po-item-id]');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.receive-qty-input');
        if (qtyInput) {
            const maxVal = qtyInput.getAttribute('max') || '0';
            qtyInput.value = maxVal;
        }
    });
}

async function submitReceiveStock() {
    const drNumber = document.getElementById('receiveDrNumber').value;
    const note = document.getElementById('receiveNote').value;
    const rows = document.querySelectorAll('#receivePoItemsBody tr[data-po-item-id]');
    
    let items = [];
    let validationFailed = false;

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.receive-qty-input').value) || 0;
        const lotNumber = row.querySelector('.receive-lot-input').value.trim();
        const expiryDate = row.querySelector('.receive-expiry-input').value;

        if (qty > 0) {
            if (!lotNumber || !expiryDate) {
                validationFailed = true;
            }
            items.push({
                po_item_id: row.getAttribute('data-po-item-id'),
                product_id: row.getAttribute('data-product-id'),
                quantity: qty,
                lot_number: lotNumber,
                expiry_date: expiryDate
            });
        }
    });

    if (items.length === 0) return alert("Please enter a valid receive quantity for at least one item line.");
    if (validationFailed) return alert("Lot Number and Expiry Date are MANDATORY for all received item lines!");

    const btn = document.getElementById('btnConfirmReceive');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Processing...';
    }

    try {
        const res = await axios.post('api/po.php?action=receive', {
            po_id: currentPoId, dr_number: drNumber, note: note, items: items
        });
        if (res.data.success) {
            alert(`Inbound Goods Received Successfully! Ref: ${res.data.receipt_no}`);
            bootstrap.Modal.getInstance(document.getElementById('receiveStockModal')).hide();
            loadPOs();

            // Automatically open printable Goods Receipt Voucher
            if (res.data.receipt_id) {
                printGoodsReceipt(res.data.receipt_id);
            }
        } else alert("Error: " + res.data.error);
    } catch (e) { 
        alert("Server Error processing stock receipt."); 
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-download me-1"></i> Process Bulk Receipt';
        }
    }
}

export async function printGoodsReceipt(receiptId = null, poId = null) {
    try {
        let url = 'api/po.php?action=get_receipt_details';
        if (receiptId) url += `&receipt_id=${receiptId}`;
        else if (poId) url += `&po_id=${poId}`;
        else return alert("Invalid print parameters.");

        const res = await axios.get(url);
        if (!res.data.success) {
            alert("Error loading receipt details for printing: " + res.data.error);
            return;
        }

        const data = res.data;
        const rec = data.receipt;
        const items = data.items || [];
        const companyName = data.company_name || 'ApexLogix Enterprise';

        let grandTotal = 0;
        let totalItems = 0;

        const itemsRows = items.map((item, idx) => {
            const qty = parseFloat(item.quantity) || 0;
            const cost = parseFloat(item.unit_cost) || 0;
            const total = qty * cost;
            grandTotal += total;
            totalItems += qty;

            return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td>${item.sku || 'N/A'}</td>
                    <td><strong>${item.product_name}</strong></td>
                    <td style="text-align:center;">${item.lot_number || 'N/A'} / ${item.expiry_date || 'N/A'}</td>
                    <td style="text-align:center; font-weight:bold;">${qty} ${item.unit_of_measure || ''}</td>
                    <td style="text-align:right;">₱ ${cost.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td style="text-align:right; font-weight:bold;">₱ ${total.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `;
        }).join('');

        const printWindow = window.open('', '_blank', 'width=900,height=750');
        if (!printWindow) {
            alert("Pop-up blocked! Please allow pop-ups for this site to view the Goods Receipt Slip.");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Goods Receipt Voucher - ${rec.receipt_no}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 13px; margin: 25px; color: #000; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .header h2 { margin: 0; text-transform: uppercase; font-size: 22px; letter-spacing: 1px; }
                    .header h4 { margin: 5px 0 0; color: #333; font-size: 14px; font-weight: bold; text-transform: uppercase; }
                    .meta-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
                    .meta-table td { padding: 4px 8px; vertical-align: top; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .items-table th, .items-table td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; }
                    .items-table th { background-color: #f0f0f0; text-transform: uppercase; }
                    .summary-box { width: 320px; float: right; margin-bottom: 30px; text-align: right; }
                    .summary-box table { width: 100%; border-collapse: collapse; }
                    .summary-box td { padding: 4px; font-size: 13px; }
                    .footer-signatures { clear: both; margin-top: 60px; width: 100%; }
                    .sig-table { width: 100%; border-collapse: collapse; margin-top: 40px; }
                    .sig-table td { width: 50%; text-align: center; vertical-align: bottom; }
                    .sig-line { border-top: 1px solid #000; margin: 0 30px; font-weight: bold; padding-top: 5px; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align: right; margin-bottom: 15px;">
                    <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; cursor: pointer; background: #000; color: #fff; border: none;">🖨️ Print / Save as PDF</button>
                    <button onclick="window.close()" style="padding: 8px 16px; margin-left: 8px; cursor: pointer;">Close</button>
                </div>

                <div class="header">
                    <h2>${companyName}</h2>
                    <h4>GOODS RECEIPT VOUCHER (SLIP)</h4>
                </div>

                <table class="meta-table">
                    <tr>
                        <td width="50%">
                            <strong>GR Receipt No:</strong> ${rec.receipt_no}<br>
                            <strong>PO Reference:</strong> ${rec.po_number || 'N/A'}<br>
                            <strong>Delivery Receipt (DR) #:</strong> ${rec.delivery_receipt_no || 'N/A'}<br>
                            <strong>Date Received:</strong> ${rec.created_at}
                        </td>
                        <td width="50%">
                            <strong>Supplier:</strong> ${rec.company_name || 'N/A'} (${rec.supplier_code || ''})<br>
                            <strong>Contact Person:</strong> ${rec.contact_name || 'N/A'} ${rec.contact_phone ? '/ ' + rec.contact_phone : ''}<br>
                            <strong>Received By:</strong> ${rec.received_by_name}<br>
                            <strong>Note / Remarks:</strong> ${rec.note || 'None'}
                        </td>
                    </tr>
                </table>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 30px;">#</th>
                            <th style="width: 100px;">SKU</th>
                            <th>Item Description</th>
                            <th style="width: 160px; text-align:center;">Lot # / Expiry</th>
                            <th style="width: 90px; text-align:center;">Qty Rec'd</th>
                            <th style="width: 100px; text-align:right;">Unit Cost</th>
                            <th style="width: 110px; text-align:right;">Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div class="summary-box">
                    <table>
                        <tr>
                            <td><strong>Total Units Received:</strong></td>
                            <td style="font-weight: bold;">${totalItems}</td>
                        </tr>
                        <tr>
                            <td><strong>Grand Total Cost:</strong></td>
                            <td style="font-size: 15px; font-weight: bold;">₱ ${grandTotal.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                    </table>
                </div>

                <div class="footer-signatures">
                    <table class="sig-table">
                        <tr>
                            <td>
                                <div class="sig-line">Received By: ${rec.received_by_name}</div>
                            </td>
                            <td>
                                <div class="sig-line">Checked / Verified By (Warehouse Staff)</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

    } catch (err) {
        console.error("Print Goods Receipt error:", err);
        alert("Failed to fetch receipt details for printing.");
    }
}

export async function openReturnModal(poId) {
    currentPoId = poId;
    document.getElementById('prNote').value = '';
    const body = document.getElementById('prPoItemsBody');
    body.innerHTML = '<tr><td colspan="6" class="text-center py-3">Loading...</td></tr>';
    
    new bootstrap.Modal(document.getElementById('purchaseReturnModal')).show();

    try {
        const reasonSelect = document.getElementById('prReasonSelect');
        let rRes = await axios.get('api/po.php?action=get_reasons&applies_to=purchase_return');
        
        let reasons = (rRes.data && rRes.data.success && rRes.data.reasons.length > 0) 
            ? rRes.data.reasons 
            : [];

        if (reasons.length === 0) {
            rRes = await axios.get('api/po.php?action=get_reasons&applies_to=all');
            if (rRes.data && rRes.data.success) reasons = rRes.data.reasons;
        }

        if (reasonSelect) {
            reasonSelect.innerHTML = '<option value="">-- Select Reason --</option>' + 
                reasons.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        }

        const res = await axios.get(`api/po.php?action=get_po_details&po_id=${poId}`);
        document.getElementById('prPoNumber').textContent = res.data.po.po_number;
        let html = '';

        res.data.items.forEach(item => {
            const returnable = parseFloat(item.received_qty) - parseFloat(item.returned_qty);
            if (returnable > 0) {
                html += `
                <tr data-po-item-id="${item.po_item_id}" data-product-id="${item.product_id}">
                    <td>${item.product_name} <br><small class="text-muted">SKU: ${item.sku}</small></td>
                    <td class="text-center">${item.received_qty}</td>
                    <td class="text-center">${item.returned_qty}</td>
                    <td class="text-center fw-bold text-danger">${returnable}</td>
                    <td><input type="number" class="form-control form-control-sm return-qty-input" max="${returnable}" min="0"></td>
                    <td class="text-center"><input type="checkbox" class="form-check-input return-replace-chk" checked></td>
                </tr>`;
            }
        });
        body.innerHTML = html || '<tr><td colspan="6" class="text-center py-3">No returnable items on this PO.</td></tr>';
    } catch (error) {
        body.innerHTML = `<tr><td colspan="6" class="text-danger text-center py-3">Error loading PO details.</td></tr>`;
    }
}

async function submitPurchaseReturn() {
    const reasonId = document.getElementById('prReasonSelect').value;
    const note = document.getElementById('prNote').value;
    const fromNonSellable = document.getElementById('prFromNonSellable')?.checked ? 1 : 0;
    const rows = document.querySelectorAll('#prPoItemsBody tr[data-po-item-id]');
    
    let items = [];
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.return-qty-input').value) || 0;
        if (qty > 0) {
            items.push({
                po_item_id: row.getAttribute('data-po-item-id'),
                product_id: row.getAttribute('data-product-id'),
                quantity: qty,
                replacement_expected: row.querySelector('.return-replace-chk').checked ? 1 : 0
            });
        }
    });

    if (items.length === 0) return alert("Enter quantity to return.");

    try {
        const res = await axios.post('api/po.php?action=purchase_return', {
            po_id: currentPoId, reason_id: reasonId, note: note, from_non_sellable: fromNonSellable, items: items
        });
        if (res.data.success) {
            alert(`Return Processed! Ref: ${res.data.pr_no}`);
            bootstrap.Modal.getInstance(document.getElementById('purchaseReturnModal')).hide();
            loadPOs();
        } else alert("Error: " + res.data.error);
    } catch (e) { alert("Server Error processing return."); }
}

export function openCancelModal(poId, poNumber) {
    currentPoId = poId;
    document.getElementById('cancelPoNumber').textContent = poNumber;
    document.getElementById('cancelReasonSelect').value = '';
    document.getElementById('cancelNote').value = '';
    new bootstrap.Modal(document.getElementById('cancelPoModal')).show();
}

async function submitCancelPO() {
    const reasonId = document.getElementById('cancelReasonSelect').value;
    const note = document.getElementById('cancelNote').value;
    if (!reasonId) return alert("Select a cancellation reason.");

    try {
        const res = await axios.post('api/po.php?action=close_po', {
            po_id: currentPoId, reason_id: reasonId, note: note
        });
        if (res.data.success) {
            bootstrap.Modal.getInstance(document.getElementById('cancelPoModal')).hide();
            loadPOs();
        } else alert("Error: " + res.data.error);
    } catch (e) { alert("Server Error"); }
}

export function openReturnClaimModal(prId) {
    document.getElementById('claimPrId').value = prId;
    new bootstrap.Modal(document.getElementById('claimStatusModal')).show();
}

async function submitReturnClaim() {
    const prId = document.getElementById('claimPrId').value;
    const status = document.getElementById('claimStatusSelect').value;
    const creditNote = document.getElementById('claimCreditNote').value;
    const photoFile = document.getElementById('claimPhotoInput').files[0];

    const formData = new FormData();
    formData.append('action', 'update_return_claim');
    formData.append('pr_id', prId);
    formData.append('status', status);
    formData.append('credit_note_no', creditNote);
    if (photoFile) formData.append('photo', photoFile);

    try {
        const res = await axios.post('api/po.php', formData);
        if (res.data.success) {
            alert("Return claim updated successfully!");
            bootstrap.Modal.getInstance(document.getElementById('claimStatusModal')).hide();
        } else {
            alert("Error: " + res.data.error);
        }
    } catch (e) {
        alert("Failed to update return claim.");
    }
}

// Global Quick Draft helper for low stock reorders (from Dashboard)
window.quickDraftPo = function(productId, suggestedQty) {
    const navPoBtn = document.getElementById('nav-po');
    if (navPoBtn) navPoBtn.click();

    setTimeout(() => {
        const prod = allProductsCache.find(p => p.product_id == productId);
        if (!prod) return;

        const matchingSup = allSuppliersCache.find(s => (s.category_ids_arr || []).map(id => String(id)).includes(String(prod.category_id)));
        const supSelect = document.getElementById('po-supplier-select');

        if (matchingSup && supSelect) {
            supSelect.value = matchingSup.supplier_id;
            supSelect.dispatchEvent(new Event('change'));
        }

        const existing = draftPoItems.find(i => i.product_id == productId);
        if (!existing) {
            draftPoItems.push({
                product_id: productId,
                sku: prod.sku,
                product_name: prod.product_name,
                category_name: prod.category_name || 'N/A',
                quantity: parseFloat(suggestedQty) || 50
            });
            renderDraftItemsTable();
        }
    }, 200);
};

window.removePoDraftItem = removePoDraftItem;
window.receiving = { openReceiveModal, openReturnModal, openCancelModal, openReturnClaimModal, printGoodsReceipt };