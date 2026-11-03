const baseApiUrl = "./api";

export const displaySalesHistory = async () => {
  try {
    const tableDiv = document.getElementById("sales-history-table-div");
    const response = await axios.get(`${baseApiUrl}/logs.php`, { params: { operation: "getSalesHistory" } });
    
    if (response.status === 200) {
      let data = response.data || []; 
      
      // I-CHECK ANG FILTER
      const filterDropdown = document.getElementById("sales-filter");
      if (filterDropdown) {
         const filterVal = filterDropdown.value;
         if (filterVal === "cash") data = data.filter(s => parseInt(s.is_ar) === 0);
         if (filterVal === "ar") data = data.filter(s => parseInt(s.is_ar) === 1);
      }

      let totalSalesSum = 0;

      tableDiv.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-bordered table-hover mb-0">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Branch</th>
                <th>Timestamp</th>
                <th>Items Sold</th>
                <th class="text-end">Subtotal</th>
                <th class="text-end">Tax</th>
                <th class="text-end">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${data.length > 0 ? data.map(s => {
                const total = parseFloat(s.total_amount) || 0;
                const tax = parseFloat(s.tax_amount) || 0;
                const subtotal = s.subtotal !== undefined && s.subtotal !== null 
                  ? parseFloat(s.subtotal) 
                  : (total - tax);

                totalSalesSum += total;
                
                const invoiceNo = s.invoice_number || 'N/A';
                const branchName = s.branch || 'Main Branch';
                const timestamp = s.created_at || 'N/A';
                const items = s.items_sold || s.items_bought || 'N/A';
                
                // MABUTANG OG BADGE KUNG CASH O UTANG
                const badge = parseInt(s.is_ar) === 1 
                    ? '<span class="badge bg-danger ms-2">Utang</span>' 
                    : '<span class="badge bg-success ms-2">Cash</span>';

                return `
                  <tr>
                    <td class="fw-bold">${invoiceNo}${badge}</td>
                    <td>${branchName}</td>
                    <td>${timestamp}</td>
                    <td><small class="fw-bold">${items}</small></td>
                    <td class="text-end">₱ ${subtotal.toFixed(2)}</td>
                    <td class="text-end">₱ ${tax.toFixed(2)}</td>
                    <td class="text-end fw-bold">₱ ${total.toFixed(2)}</td>
                  </tr>
                `;
              }).join('') : '<tr><td colspan="7" class="text-center py-3 text-muted">No sales found.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;

      const totalSalesEl = document.getElementById("metric-total-sales");
      const totalInvoicesEl = document.getElementById("metric-total-invoices");
      const avgSalesEl = document.getElementById("metric-avg-sales");

      if (totalSalesEl) totalSalesEl.innerText = `₱ ${totalSalesSum.toFixed(2)}`;
      if (totalInvoicesEl) totalInvoicesEl.innerText = data.length;
      if (avgSalesEl) avgSalesEl.innerText = `₱ ${(data.length ? totalSalesSum / data.length : 0).toFixed(2)}`;
    }
  } catch (error) { 
    console.error("Sales Analytics Error", error);
    const tableDiv = document.getElementById("sales-history-table-div");
    if (tableDiv) tableDiv.innerHTML = `<div class="alert alert-danger">Failed to load analytics: ${error.message}</div>`;
  }
};

export const displaySystemLogs = async () => {
  try {
    const tableDiv = document.getElementById("logs-table-div");
    const response = await axios.get(`${baseApiUrl}/logs.php`, { params: { operation: "getAuditLogs" } });
    
    if (response.status === 200) {
      const data = response.data || [];
      tableDiv.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-bordered table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 80px;">Log ID</th>
                <th style="width: 200px;">Action Type</th>
                <th>Detailed Description</th>
                <th style="width: 180px;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${data.length > 0 ? data.map(l => `
                <tr>
                  <td class="fw-bold">${l.log_id || 'N/A'}</td>
                  <td>
                    <span class="badge ${l.action_type === 'PO_RECEIPT' ? 'bg-success' : l.action_type.includes('RETURN') ? 'bg-warning text-dark' : 'bg-dark'}">
                      ${l.action_type ? l.action_type.replace(/_/g, ' ') : 'N/A'}
                    </span>
                  </td>
                  <td>${l.description || 'N/A'}</td>
                  <td>${l.created_at || 'N/A'}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center py-3 text-muted">No warehouse logs found.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }
  } catch (error) { 
    console.error("Audit Logs Error", error);
    const tableDiv = document.getElementById("logs-table-div");
    if (tableDiv) tableDiv.innerHTML = `<div class="alert alert-danger">Failed to load logs: ${error.message}</div>`;
  }
};