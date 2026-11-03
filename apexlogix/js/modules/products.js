// js/modules/products.js

let currentAdjustProductId = null;
let currentProductStock = 0;
let currentDisposeProductId = null;
let currentRtvProductId = null;

export async function loadCategoryDropdown() {
    try {
        const res = await fetch('api/categories.php?action=get_categories');
        const data = await res.json();
        const select = document.getElementById('category-select');
        if (data.success && select) {
            select.innerHTML = '<option value="0">Category...</option>';
            data.categories.forEach(c => {
                select.innerHTML += `<option value="${c.category_id}">${c.category_name}</option>`;
            });
        }
    } catch (e) {
        console.error("Failed to load categories.");
    }
}

// Populate Pack UOM Dropdowns dynamically from database
export async function loadUomDropdowns() {
    try {
        const res = await fetch('api/products.php?action=get_uoms');
        const data = await res.json();
        
        const dropdowns = [
            document.getElementById('pack-uom-select'),
            document.getElementById('edit-prod-pack-uom')
        ];

        if (data.success && Array.isArray(data.uoms)) {
            dropdowns.forEach(select => {
                if (select) {
                    const currentVal = select.value;
                    select.innerHTML = '<option value="0">Select Pack UOM (e.g. Case/Box)...</option>';
                    
                    data.uoms.forEach(uom => {
                        select.innerHTML += `<option value="${uom.uom_id}">${uom.uom_name} (${uom.uom_code})</option>`;
                    });

                    if (currentVal && currentVal !== '0') {
                        select.value = currentVal;
                    }
                }
            });
        }
    } catch (e) {
        console.error("Failed to fetch UOMs from database:", e);
    }
}

export async function displayProducts() {
    try {
        // Automatically ensure UOM dropdowns are loaded when rendering product list
        await loadUomDropdowns();

        const res = await fetch('api/products.php?action=get_products');
        const data = await res.json();
        const container = document.getElementById('products-table-div');
        
        if (!data.success) return container.innerHTML = `<div class="p-3 text-danger">Error loading products.</div>`;

        let html = `
            <div class="table-responsive">
            <table class="table table-sm table-bordered table-hover mb-0">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th class="text-end">Cost</th>
                        <th class="text-end">Price</th>
                        <th class="text-center">Reorder Lvl</th>
                        <th class="text-center">Pack UOM</th>
                        <th class="text-center">Sellable</th>
                        <th class="text-center">Non-Sellable</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.products.forEach(p => {
            const sellableQty = parseFloat(p.sellable_qty || 0);
            const reorderLvl = parseFloat(p.reorder_level || 10);
            const isLow = sellableQty <= reorderLvl;

            const stockClass = isLow ? 'text-danger fw-bold' : 'fw-bold';
            // Replace line 76 in js/modules/products.js:
const packInfo = (p.pack_uom_id > 0 && p.pack_uom_name) 
    ? `${p.pack_uom_name} (${p.pieces_per_pack || 1} pcs)` 
    : '-';
            const escapedName = p.product_name.replace(/'/g, "\\'");

            html += `
                <tr>
                    <td>${p.sku}</td>
                    <td><b>${p.product_name}</b></td>
                    <td>${p.category_name || 'N/A'}</td>
                    <td class="text-end">₱${parseFloat(p.unit_cost || 0).toFixed(2)}</td>
                    <td class="text-end">₱${parseFloat(p.retail_price).toFixed(2)}</td>
                    <td class="text-center">${reorderLvl}</td>
                    <td class="text-center"><span class="badge bg-secondary">${packInfo}</span></td>
                    <td class="text-center ${stockClass}">
                        ${sellableQty} ${isLow ? '<span class="text-danger fw-bold">🔴</span>' : ''}
                    </td>
                    <td class="text-center text-danger">${p.non_sellable_qty}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger" onclick="openRtvSupplierModal(${p.product_id}, '${escapedName}', ${p.sellable_qty}, ${p.non_sellable_qty})">RTV / Transfer</button>
                        <button class="btn btn-sm btn-outline-dark" onclick="openUnifiedAdjustmentModal(${p.product_id}, '${escapedName}', ${p.sellable_qty})">Adjust</button>
                        <button class="btn btn-sm btn-warning" onclick="openDisposeModal(${p.product_id}, '${escapedName}', ${p.non_sellable_qty})" ${p.non_sellable_qty <= 0 ? 'disabled' : ''}>Dispose</button>
                        <button class="btn btn-sm btn-danger ms-1" onclick="window.archiveProduct(${p.product_id})">Archive</button>
                        <button class="btn btn-sm btn-dark ms-1" onclick="window.openEditProductModal(${p.product_id}, '${p.sku}', '${escapedName}', ${p.category_id || 0}, ${p.retail_price}, ${p.unit_cost || 0}, ${p.reorder_level || 10}, ${p.suggested_reorder_qty || 50}, '${p.barcode || ''}', '${p.unit_of_measure || ''}', ${p.tax_rate || 0}, ${p.track_expiry || 0}, ${p.pack_uom_id || 0}, ${p.pieces_per_pack || 1})">Edit</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    } catch (e) {
        console.error("Failed to display products.", e);
    }
}

export async function insertProduct() {
    const btn = document.getElementById("btn-save-product");
    const data = {
        sku: document.getElementById("sku").value.trim(),
        product_name: document.getElementById("product-name").value.trim(),
        category_id: document.getElementById("category-select").value,
        retail_price: document.getElementById("price").value,
        unit_cost: document.getElementById("unit-cost").value,
        reorder_level: document.getElementById("reorder-level").value,
        suggested_reorder_qty: document.getElementById("suggested-qty").value,
        barcode: document.getElementById("barcode").value.trim(),
        unit_of_measure: document.getElementById("uom").value.trim(),
        tax_rate: document.getElementById("tax-rate").value,
        track_expiry: document.getElementById("track-expiry")?.checked ? 1 : 0,
        pack_uom_id: document.getElementById("pack-uom-select")?.value || 0,
        pieces_per_pack: document.getElementById("pieces-per-pack")?.value || 1
    };

    if (!data.sku || !data.product_name || data.category_id === "0") {
        return alert("SKU, Product Name, and Category are required.");
    }

    btn.disabled = true;
    try {
        const res = await fetch("api/products.php?action=save_product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
            alert("Product saved successfully!");
            document.querySelectorAll("#section-products input[type='text'], #section-products input[type='number']").forEach(i => i.value = "");
            document.getElementById("reorder-level").value = "10";
            document.getElementById("suggested-qty").value = "50";
            document.getElementById("uom").value = "Piece";
            document.getElementById("tax-rate").value = "12";
            document.getElementById("category-select").value = "0";
            if (document.getElementById("pack-uom-select")) document.getElementById("pack-uom-select").value = "0";
            if (document.getElementById("pieces-per-pack")) document.getElementById("pieces-per-pack").value = "1";
            if (document.getElementById("track-expiry")) document.getElementById("track-expiry").checked = false;
            displayProducts();
        } else {
            alert(result.error || "Failed to save product.");
        }
    } catch (e) {
        alert("Server error while saving product.");
    } finally {
        btn.disabled = false;
    }
}

// Unified Adjustment Modal
window.openUnifiedAdjustmentModal = async function(id, name, currentStock) {
    currentAdjustProductId = id;
    currentProductStock = parseFloat(currentStock);
    
    document.getElementById('adjProductInfo').innerText = name;
    document.getElementById('adjCurrentStock').value = currentStock;
    document.getElementById('adjValueInput').value = '';
    document.getElementById('adjCalculatedTotal').value = currentStock;
    document.getElementById('adjNote').value = '';
    document.getElementById('adjModeCount').checked = true;
    if (document.getElementById('adjApprovedBy')) document.getElementById('adjApprovedBy').value = '';

    const res = await fetch('api/products.php?action=get_reasons&applies_to=adjustment');
    const data = await res.json();
    const select = document.getElementById('adjReasonSelect');
    select.innerHTML = '<option value="">-- Select Reason --</option>';
    if (data.success) {
        data.reasons.forEach(r => select.innerHTML += `<option value="${r.id}">${r.name}</option>`);
    }

    new bootstrap.Modal(document.getElementById('unifiedAdjustmentModal')).show();
};

const adjValueInput = document.getElementById('adjValueInput');
if (adjValueInput) {
    adjValueInput.addEventListener('input', function() {
        const val = parseFloat(this.value) || 0;
        const isCount = document.getElementById('adjModeCount').checked;
        const calcField = document.getElementById('adjCalculatedTotal');
        const badge = document.getElementById('adjDeltaBadge');

        let diff = 0;
        if (isCount) {
            calcField.value = val;
            diff = val - currentProductStock;
            badge.innerText = `Variance: ${diff > 0 ? '+' : ''}${diff}`;
        } else {
            calcField.value = currentProductStock + val;
            diff = val;
            badge.innerText = `Delta: ${val > 0 ? '+' : ''}${val}`;
        }

        const managerDiv = document.getElementById('adjManagerApprovalDiv');
        if (managerDiv) {
            managerDiv.style.display = Math.abs(diff) > 0 ? 'block' : 'none';
        }
    });
}

const btnConfirmAdjustment = document.getElementById('btnConfirmAdjustment');
if (btnConfirmAdjustment) {
    btnConfirmAdjustment.onclick = async function() {
        const val = document.getElementById('adjValueInput').value;
        const reasonId = document.getElementById('adjReasonSelect').value;
        const note = document.getElementById('adjNote').value;
        const mode = document.getElementById('adjModeCount').checked ? 'count' : 'delta';
        const approvedBy = document.getElementById('adjApprovedBy')?.value.trim() || '';

        if (val === '' || !reasonId) return alert("Input value and Reason are required.");

        const numericVal = parseFloat(val);
        const qtyChange = mode === 'count' ? (numericVal - currentProductStock) : numericVal;
        if (Math.abs(qtyChange) > 0 && !approvedBy) {
            return alert("Admin or Manager Passcode is required for stock adjustments!");
        }

        this.disabled = true;
        try {
            const res = await fetch('api/products.php?action=adjust_quantity', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    product_id: currentAdjustProductId, 
                    mode: mode, 
                    value: val, 
                    reason_id: reasonId, 
                    note: note,
                    approved_by: approvedBy
                })
            });
            const data = await res.json();
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('unifiedAdjustmentModal')).hide();
                displayProducts();

                if (typeof window.loadMonthlyShrinkageReport === 'function') {
                const monthPicker = document.getElementById('report-shrinkage-month');
                const selectedMonth = monthPicker ? monthPicker.value : new Date().toISOString().slice(0, 7);
                window.loadMonthlyShrinkageReport(selectedMonth);
            }
            } else alert(data.error);
        } catch (e) {
            alert("Server error.");
        } finally {
            this.disabled = false;
        }
    };
}

// RTV / Internal Transfer Modal
// RTV / Internal Transfer Modal (Restricted Supplier Selection)
window.openRtvSupplierModal = async function(id, name, sellable, nonSellable) {
    currentRtvProductId = id;
    document.getElementById('rtvProductName').innerText = name;
    document.getElementById('rtvSellableQty').value = sellable;
    document.getElementById('rtvNonSellableQty').value = nonSellable;
    document.getElementById('rtvQty').value = '';
    document.getElementById('rtvNote').value = '';

    const checkbox = document.getElementById('rtvFromNonSellable');
    checkbox.checked = true;

    // Fetch products to find this product's category_id
    const prodRes = await fetch('api/products.php?action=get_products');
    const prodData = await prodRes.json();
    const currentProd = prodData.products?.find(p => p.product_id == id);
    const prodCatId = currentProd ? String(currentProd.category_id) : null;

    // Fetch suppliers and restrict to matching category specialization
    const res = await fetch('api/suppliers.php?operation=getSuppliers');
    const suppliers = await res.json();
    const select = document.getElementById('rtvSupplierSelect');

    select.innerHTML = '<option value="">-- Select Supplier --</option>';
    if (Array.isArray(suppliers)) {
        const filteredSuppliers = prodCatId 
            ? suppliers.filter(s => (s.category_ids_arr || []).includes(prodCatId)) 
            : suppliers;

        filteredSuppliers.forEach(s => {
            select.innerHTML += `<option value="${s.supplier_id}">${s.company_name}</option>`;
        });
    }

    const reasonRes = await fetch('api/products.php?action=get_reasons&applies_to=stock_return');
    const reasonData = await reasonRes.json();
    const reasonSelect = document.getElementById('rtvReasonSelect');
    reasonSelect.innerHTML = '<option value="">-- Select Reason --</option>';
    if (reasonData.success) {
        reasonData.reasons.forEach(r => reasonSelect.innerHTML += `<option value="${r.id}">${r.name}</option>`);
    }

    checkbox.onchange = function() {
        document.getElementById('rtvSupplierDiv').style.display = this.checked ? 'block' : 'none';
        document.getElementById('btnConfirmRtvSupplier').innerText = this.checked ? 'Process Return & Draft PO' : 'Transfer to Non-Sellable';
    };
    checkbox.onchange();

    new bootstrap.Modal(document.getElementById('rtvSupplierModal')).show();
};

const btnConfirmRtvSupplier = document.getElementById('btnConfirmRtvSupplier');
if (btnConfirmRtvSupplier) {
    btnConfirmRtvSupplier.onclick = async function() {
        const isRtv = document.getElementById('rtvFromNonSellable').checked;
        const supplierId = document.getElementById('rtvSupplierSelect').value;
        const qty = parseFloat(document.getElementById('rtvQty').value) || 0;
        const reasonId = document.getElementById('rtvReasonSelect').value;
        const note = document.getElementById('rtvNote').value;

        if (qty <= 0) return alert("Enter a valid quantity.");
        if (!reasonId) return alert("Please select a reason.");
        
        this.disabled = true;
        try {
            if (isRtv) {
                if (!supplierId) {
                    this.disabled = false;
                    return alert("Please select a supplier for Return to Vendor.");
                }
                
                const res = await fetch('api/products.php?action=return_to_supplier', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        product_id: currentRtvProductId,
                        supplier_id: supplierId,
                        quantity: qty,
                        reason_id: reasonId,
                        from_non_sellable: true,
                        note: note
                    })
                });
                const data = await res.json();
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('rtvSupplierModal')).hide();
                    alert(`Stock deducted from Non-Sellable and new Purchase Order #${data.po_number} drafted!`);
                    displayProducts();
                } else {
                    alert(data.error);
                }
            } else {
                const res = await fetch('api/products.php?action=stock_return', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        product_id: currentRtvProductId,
                        quantity: qty,
                        reason_id: reasonId,
                        note: note
                    })
                });
                const data = await res.json();
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('rtvSupplierModal')).hide();
                    alert("Stock successfully transferred from Sellable to Non-Sellable.");
                    displayProducts();
                } else {
                    alert(data.error);
                }
            }
        } catch (e) {
            alert("Server error processing request.");
        } finally {
            this.disabled = false;
        }
    };
}

// Dispose Modal
// Dispose Modal with Fallback Reason Loader
window.openDisposeModal = async function(id, name, nonSellableQty) {
    currentDisposeProductId = id;
    document.getElementById('disposeProductInfo').innerText = name;
    document.getElementById('disposeMaxQty').value = nonSellableQty;
    document.getElementById('disposeQty').value = '';
    document.getElementById('disposeNote').value = '';

    let res = await fetch('api/products.php?action=get_reasons&applies_to=all');
    let data = await res.json();
    let reasons = (data.success && Array.isArray(data.reasons) && data.reasons.length > 0) ? data.reasons : [];

    // Fallback query if 'all' returns empty
    if (reasons.length === 0) {
        res = await fetch('api/products.php?action=get_reasons&applies_to=stock_return');
        data = await res.json();
        if (data.success && Array.isArray(data.reasons)) reasons = data.reasons;
    }

    const select = document.getElementById('disposeReasonSelect');
    select.innerHTML = '<option value="">-- Select Reason --</option>';
    reasons.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });

    new bootstrap.Modal(document.getElementById('disposeModal')).show();
};

const btnConfirmDispose = document.getElementById('btnConfirmDispose');
if (btnConfirmDispose) {
    btnConfirmDispose.onclick = async function() {
        const qty = parseFloat(document.getElementById('disposeQty').value) || 0;
        const maxQty = parseFloat(document.getElementById('disposeMaxQty').value) || 0;
        const reasonId = document.getElementById('disposeReasonSelect').value;
        const note = document.getElementById('disposeNote').value;

        if (qty <= 0) return alert("Enter a valid quantity to dispose.");
        if (qty > maxQty) return alert("Cannot dispose more than available Non-Sellable stock.");
        if (!reasonId) return alert("Please select a reason for disposal.");

        this.disabled = true;
        try {
            const res = await fetch('api/products.php?action=dispose_non_sellable', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    product_id: currentDisposeProductId,
                    quantity: qty,
                    reason_id: reasonId,
                    note: note
                })
            });
            const data = await res.json();
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('disposeModal')).hide();
                alert("Stock permanently disposed and logged as loss.");
                displayProducts();
                if (typeof window.loadMonthlyShrinkageReport === 'function') {
                const monthPicker = document.getElementById('report-shrinkage-month');
                const selectedMonth = monthPicker ? monthPicker.value : new Date().toISOString().slice(0, 7);
                window.loadMonthlyShrinkageReport(selectedMonth);
            }
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert("Server error processing disposal.");
        } finally {
            this.disabled = false;
        }
    };
}

window.archiveProduct = async function(id) {
    if (!confirm("Are you sure you want to archive this product? It will be removed from POS and active lists.")) return;
    
    try {
        const res = await fetch('api/products.php?action=archive_product', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ product_id: id })
        });
        const data = await res.json();
        
        if (data.success) {
            displayProducts();
        } else {
            alert(data.error || "Failed to archive product.");
        }
    } catch (e) {
        alert("Server error processing archive request.");
    }
};

window.openEditProductModal = async function(id, sku, name, catId, price, cost, reorderLvl, suggestedQty, barcode, uom, tax, trackExpiry, packUomId, piecesPerPack) {
  document.getElementById('edit-prod-id').value = id;
  document.getElementById('edit-prod-sku').value = sku;
  document.getElementById('edit-prod-name').value = name;
  document.getElementById('edit-prod-price').value = price;
  document.getElementById('edit-prod-cost').value = cost;
  document.getElementById('edit-prod-reorder').value = reorderLvl;
  document.getElementById('edit-prod-suggested').value = suggestedQty;
  document.getElementById('edit-prod-barcode').value = barcode;
  document.getElementById('edit-prod-uom').value = uom;
  document.getElementById('edit-prod-tax').value = tax;
  
  const editTrackExpiry = document.getElementById('edit-track-expiry');
  if (editTrackExpiry) {
      editTrackExpiry.checked = parseInt(trackExpiry) === 1;
  }
  
  const originalSelect = document.getElementById('category-select');
  const modalSelect = document.getElementById('edit-prod-category');
  if (originalSelect && modalSelect) {
      modalSelect.innerHTML = originalSelect.innerHTML;
      modalSelect.value = catId;
  }

  // Ensure dropdown options are loaded before setting selected value
  await loadUomDropdowns();

  const packUomSelect = document.getElementById('edit-prod-pack-uom');
  if (packUomSelect) packUomSelect.value = packUomId || 0;
  
  const editPiecesInput = document.getElementById('edit-prod-pieces-per-pack');
  if (editPiecesInput) editPiecesInput.value = piecesPerPack || 1;

  new bootstrap.Modal(document.getElementById('editProductModal')).show();
};

const btnUpdateProduct = document.getElementById('btn-update-product');
if (btnUpdateProduct) {
    btnUpdateProduct.onclick = async function() {
      const editTrackExpiry = document.getElementById('edit-track-expiry');
      const data = {
        product_id: document.getElementById('edit-prod-id').value,
        sku: document.getElementById('edit-prod-sku').value.trim(),
        product_name: document.getElementById('edit-prod-name').value.trim(),
        category_id: document.getElementById('edit-prod-category').value,
        retail_price: document.getElementById('edit-prod-price').value,
        unit_cost: document.getElementById('edit-prod-cost').value,
        reorder_level: document.getElementById('edit-prod-reorder').value,
        suggested_reorder_qty: document.getElementById('edit-prod-suggested').value,
        barcode: document.getElementById('edit-prod-barcode').value.trim(),
        unit_of_measure: document.getElementById('edit-prod-uom').value.trim(),
        tax_rate: document.getElementById('edit-prod-tax').value,
        track_expiry: editTrackExpiry && editTrackExpiry.checked ? 1 : 0,
        pack_uom_id: document.getElementById('edit-prod-pack-uom')?.value || 0,
        pieces_per_pack: document.getElementById('edit-prod-pieces-per-pack')?.value || 1
      };

      if (!data.sku || !data.product_name || data.category_id === "0") {
          return alert("SKU, Product Name, and Category are required.");
      }

      this.disabled = true;
      try {
        const res = await fetch("api/products.php?action=update_product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            displayProducts();
        } else {
            alert(result.error || "Failed to update product.");
        }
      } catch (e) {
          alert("Server error while updating product.");
      } finally {
          this.disabled = false;
      }
    };
}