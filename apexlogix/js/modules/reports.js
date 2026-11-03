// js/modules/reports.js

export async function initReports() {
    setupReportTabs();

    // Initialize month picker with current year/month
    const monthPicker = document.getElementById('report-shrinkage-month');
    if (monthPicker) {
        if (!monthPicker.value) {
            monthPicker.value = new Date().toISOString().slice(0, 7);
        }
        monthPicker.onchange = () => loadMonthlyShrinkageReport(monthPicker.value);
    }

    // Smart load: Check if Shrinkage sub-tab is currently active, otherwise load On-Hand
    const divShrinkage = document.getElementById('div-shrinkage-report');
    if (divShrinkage && divShrinkage.style.display === 'block') {
        const selectedMonth = monthPicker ? monthPicker.value : new Date().toISOString().slice(0, 7);
        await loadMonthlyShrinkageReport(selectedMonth);
    } else {
        await loadOnHandInventory();
    }
}

function setupReportTabs() {
    const btnOnHand = document.getElementById('tab-btn-onhand');
    const btnShrinkage = document.getElementById('tab-btn-shrinkage');
    const divOnHand = document.getElementById('div-onhand-report');
    const divShrinkage = document.getElementById('div-shrinkage-report');

    if (!btnOnHand || !btnShrinkage) return;

    btnOnHand.onclick = () => {
        btnOnHand.className = 'btn btn-dark fw-bold active';
        btnShrinkage.className = 'btn btn-outline-dark fw-bold';

        if (divOnHand) divOnHand.style.display = 'block';
        if (divShrinkage) divShrinkage.style.display = 'none';

        loadOnHandInventory();
    };

    btnShrinkage.onclick = () => {
        btnShrinkage.className = 'btn btn-dark fw-bold active';
        btnOnHand.className = 'btn btn-outline-dark fw-bold';

        if (divOnHand) divOnHand.style.display = 'none';
        if (divShrinkage) divShrinkage.style.display = 'block';

        const monthPicker = document.getElementById('report-shrinkage-month');
        const selectedMonth = monthPicker ? monthPicker.value : new Date().toISOString().slice(0, 7);
        loadMonthlyShrinkageReport(selectedMonth);
    };
}

export async function loadOnHandInventory() {
    try {
        const res = await fetch('api/products.php?action=get_products');
        const data = await res.json();
        const container = document.getElementById('reports-table-div');
        
        if (!data.success) {
            container.innerHTML = `<div class="p-3 text-danger">Error loading report.</div>`;
            return;
        }

        let html = `
            <div class="table-responsive">
            <table class="table table-sm table-bordered table-hover mb-0" id="inventory-report-table">
                <thead class="table-light">
                    <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Barcode</th>
                        <th>Category</th>
                        <th class="text-end">Cost</th>
                        <th class="text-end">Price</th>
                        <th class="text-center">On-Hand Quantity</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.products.forEach(p => {
            const qty = parseFloat(p.sellable_qty || 0);
            const reorderLvl = parseFloat(p.reorder_level || 10);
            const stockClass = qty <= reorderLvl ? 'text-danger fw-bold' : 'fw-bold';

            html += `
                <tr>
                    <td>${p.product_name}</td>
                    <td>${p.sku}</td>
                    <td>${p.barcode || 'N/A'}</td>
                    <td>${p.category_name || 'Uncategorized'}</td>
                    <td class="text-end">₱${parseFloat(p.unit_cost || 0).toFixed(2)}</td>
                    <td class="text-end">₱${parseFloat(p.retail_price || 0).toFixed(2)}</td>
                    <td class="text-center ${stockClass}">${qty}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;

        const btnExport = document.getElementById('btn-export-csv');
        if (btnExport) {
            btnExport.onclick = () => exportTableToCSV('on_hand_inventory.csv', 'inventory-report-table');
        }

    } catch (e) {
        console.error("Failed to load inventory report:", e);
    }
}

export async function loadMonthlyShrinkageReport(selectedMonth) {
    const container = document.getElementById('shrinkage-report-div');
    if (!container) return;

    const monthPicker = document.getElementById('report-shrinkage-month');
    const month = selectedMonth || (monthPicker ? monthPicker.value : '') || new Date().toISOString().slice(0, 7);

    try {
        const res = await fetch(`api/reports.php?action=get_shrinkage&month=${month}`);
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = `<div class="p-3 text-danger">Error loading shrinkage report: ${data.error || 'Unknown error'}</div>`;
            return;
        }

        const totalLoss = parseFloat(data.grand_total_loss || 0);
        const grandTotalEl = document.getElementById('shrinkage-grand-total');
        if (grandTotalEl) {
            grandTotalEl.innerText = `₱ ${totalLoss.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }

        let html = `
            <h6 class="fw-bold text-uppercase border-bottom pb-2 text-danger">Shrinkage Loss Summary by Reason Code</h6>
            <div class="table-responsive mb-4">
                <table class="table table-sm table-bordered table-hover mb-0" id="shrinkage-summary-table">
                    <thead class="table-dark">
                        <tr>
                            <th>Reason Code</th>
                            <th class="text-center">Incidents</th>
                            <th class="text-center">Total Qty Lost</th>
                            <th class="text-end">Financial Loss (Qty × Unit Cost)</th>
                        </tr>
                    </thead>
                    <tbody>`;

        if (!data.summary || data.summary.length === 0) {
            html += `<tr><td colspan="4" class="text-center text-muted py-3">No shrinkage or stock losses recorded for ${month}.</td></tr>`;
        } else {
            data.summary.forEach(s => {
                const qtyLost = Math.abs(parseFloat(s.total_qty_lost || 0));
                const finLoss = parseFloat(s.total_financial_loss || 0);

                html += `
                    <tr>
                        <td class="fw-bold">${s.reason_name}</td>
                        <td class="text-center">${s.incidents}</td>
                        <td class="text-center text-danger fw-bold">-${qtyLost.toFixed(2)}</td>
                        <td class="text-end text-danger fw-bold">₱${finLoss.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>`;
            });
        }

        html += `</tbody></table></div>

        <h6 class="fw-bold text-uppercase border-bottom pb-2">Detailed Shrinkage Log Breakdown</h6>
        <div class="table-responsive">
            <table class="table table-sm table-bordered table-hover mb-0" id="shrinkage-detail-table">
                <thead class="table-light">
                    <tr>
                        <th>Date</th>
                        <th>Product</th>
                        <th>Reason</th>
                        <th class="text-end">Applied Cost</th>
                        <th class="text-center">Qty Lost</th>
                        <th class="text-end">Loss Amount</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>`;

        if (!data.details || data.details.length === 0) {
            html += `<tr><td colspan="7" class="text-center text-muted py-3">No log records found for this period.</td></tr>`;
        } else {
            data.details.forEach(d => {
                const effectiveCost = parseFloat(d.unit_cost || 0);
                const qtyLost = Math.abs(parseFloat(d.qty_lost || 0));
                const finLoss = parseFloat(d.financial_loss || 0);

                html += `
                    <tr>
                        <td>${d.created_at}</td>
                        <td><b>${d.product_name}</b> <small class="text-muted">(${d.sku})</small></td>
                        <td><span class="badge bg-secondary">${d.reason_name}</span></td>
                        <td class="text-end">₱${effectiveCost.toFixed(2)}</td>
                        <td class="text-center text-danger">-${qtyLost.toFixed(2)}</td>
                        <td class="text-end text-danger fw-bold">₱${finLoss.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td><small>${d.note || '-'}</small></td>
                    </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        container.innerHTML = html;

        const btnExportShrinkage = document.getElementById('btn-export-shrinkage-csv');
        if (btnExportShrinkage) {
            btnExportShrinkage.onclick = () => exportTableToCSV(`shrinkage_report_${month}.csv`, 'shrinkage-summary-table');
        }

    } catch (e) {
        console.error("Failed to load shrinkage report:", e);
        container.innerHTML = `<div class="p-3 text-danger">Failed to connect to report server.</div>`;
    }
}

function exportTableToCSV(filename, tableId) {
    const table = document.getElementById(tableId);
    if (!table) return alert("Table element not found.");
    
    // Log report export event to backend
    fetch('api/logs.php?action=log_activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action_type: 'REPORT_EXPORT',
            description: `Exported report file "${filename}" from table #${tableId}`
        })
    }).catch(e => console.error(e));

    let csv = [];
    for (let i = 0; i < table.rows.length; i++) {
        let row = [], cols = table.rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/,/g, "");
            row.push(data);
        }
        csv.push(row.join(","));
    }
    
    const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Global binding for auto-triggering across modules
window.loadMonthlyShrinkageReport = loadMonthlyShrinkageReport;