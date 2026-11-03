import { displayCategories, insertCategory } from "./modules/categories.js";
import { displayProducts, loadCategoryDropdown, insertProduct } from "./modules/products.js";
import { initSuppliersModule } from "./modules/suppliers.js";
import { initPOS } from "./modules/pos.js";
import { initAR } from "./modules/ar.js";
import { displaySalesHistory, displaySystemLogs } from "./modules/logs.js";
import { initArchive } from "./modules/archive.js";
import { initReports } from "./modules/reports.js";
import { initReceiving, loadPOs } from "./modules/receiving.js";
import { initCountsModule } from "./modules/counts.js";
import { initTransfers, loadTransfers } from './modules/transfers.js';
import { initStoresModule } from './modules/stores.js';

let salesChartInstance = null;

const loadHomeDashboard = async () => {
  try {
    const filterValue = document.getElementById('dashboard-date-filter')?.value || 'today';
    const response = await axios.get(`api/dashboard.php?filter=${filterValue}`);
    const data = response.data;

    if (data && !data.error) {
      document.getElementById('kpi-revenue').innerText = `₱ ${parseFloat(data.revenue || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}`;
      document.getElementById('kpi-invoices').innerText = data.invoices || 0;
      document.getElementById('kpi-pending-pos').innerText = data.pending_pos || 0;
      document.getElementById('kpi-low-stock').innerText = data.low_stock_count || 0;
      
      const lowStockBody = document.getElementById('home-low-stock-body');
      const lowStockItems = Array.isArray(data.low_stock_items) ? data.low_stock_items : [];
      if (lowStockBody) {
        if (lowStockItems.length > 0) {
          lowStockBody.innerHTML = lowStockItems.map(item => {
            const reorderLvl = item.reorder_level || 10;
            const suggestedQty = item.suggested_reorder_qty || 50;

            return `
            <tr>
              <td><strong>${item.product_name}</strong></td>
              <td class="text-center text-danger fw-bold">${item.quantity}</td>
              <td class="text-center">${reorderLvl}</td>
              <td class="text-center fw-bold text-primary">${suggestedQty}</td>
              <td class="text-center">
                <button class="btn btn-sm btn-dark fw-bold" onclick="window.quickDraftPo(${item.product_id}, ${suggestedQty})">Create PO</button>
              </td>
            </tr>
            `;
          }).join('');
        } else {
          lowStockBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Stock levels are healthy</td></tr>`;
        }
      }

      const activityList = document.getElementById('home-recent-activity');
      const recentActivity = Array.isArray(data.recent_activity) ? data.recent_activity : [];
      if (activityList) {
        if (recentActivity.length > 0) {
          activityList.innerHTML = recentActivity.map(log => {
            const badgeClass = log.action_type === 'PO_RECEIPT' ? 'bg-success' : 
                               (log.action_type && log.action_type.includes('RETURN') ? 'bg-warning text-dark' : 'bg-dark');
            const actionLabel = log.action_type ? log.action_type.replace(/_/g, ' ') : 'N/A';

            return `
            <li class="list-group-item" style="font-size: 0.85rem;">
              <span class="text-muted d-block mb-1" style="font-size: 0.75rem;">${log.created_at || 'N/A'}</span>
              <span class="badge ${badgeClass} mb-1">${actionLabel}</span><br>
              <span>${log.description || 'N/A'}</span>
            </li>
            `;
          }).join('');
        } else {
          activityList.innerHTML = `<li class="list-group-item text-muted py-3 text-center">No recent activity found</li>`;
        }
      }

      const expiryBody = document.getElementById('home-expiry-alerts-body');
      const expiryAlerts = Array.isArray(data.expiry_alerts) ? data.expiry_alerts : [];
      if (expiryBody) {
        if (expiryAlerts.length > 0) {
          expiryBody.innerHTML = expiryAlerts.map(item => {
            const days = parseInt(item.days_left);
            let badgeClass = 'bg-info text-dark';
            let statusLabel = `${days} days left`;

            if (days <= 0) {
              badgeClass = 'bg-danger text-white fw-bold';
              statusLabel = 'EXPIRED';
            } else if (days <= 30) {
              badgeClass = 'bg-warning text-dark fw-bold';
            }

            return `
            <tr>
              <td><strong>${item.product_name}</strong></td>
              <td>${item.lot_number || 'N/A'}</td>
              <td class="text-center">${item.expiry_date}</td>
              <td class="text-center fw-bold">${item.quantity}</td>
              <td class="text-center"><span class="badge ${badgeClass}">${statusLabel}</span></td>
              <td class="text-center">
                <button class="btn btn-sm btn-outline-danger py-0 px-2" style="font-size: 0.75rem;" onclick="window.transferBatchToNonSellable(${item.batch_id}, ${item.product_id}, '${item.product_name.replace(/'/g, "\\'")}', '${item.lot_number}', ${item.quantity})">
                  To Non-Sellable
                </button>
              </td>
            </tr>
            `;
          }).join('');
        } else {
          expiryBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No near-expiry items</td></tr>`;
        }
      }

      const chartCtx = document.getElementById('salesTrendChart');
      if (chartCtx && data.chart_labels && data.chart_values) {
        const ctx = chartCtx.getContext('2d');
        if (salesChartInstance) {
            salesChartInstance.destroy();
        }
        salesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.chart_labels.length > 0 ? data.chart_labels : ['No Data'],
                datasets: [{
                    label: 'Revenue (₱)',
                    data: data.chart_values.length > 0 ? data.chart_values : [0],
                    backgroundColor: '#0d6efd',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
      }
    }
  } catch (error) {
    console.error("Dashboard Load Error:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initReceiving();
  initCountsModule();
  initTransfers();

  const dateFilter = document.getElementById('dashboard-date-filter');
  if (dateFilter) {
      dateFilter.addEventListener('change', loadHomeDashboard);
  }

  const navButtons = document.querySelectorAll(".nav-tab-btn");
  const sections = document.querySelectorAll(".tab-section");

  const switchTab = async (targetBtnId, targetSectionId, callback) => {
    sections.forEach(sec => sec.style.display = "none");
    navButtons.forEach(btn => btn.classList.remove("active"));

    const activeBtn = document.getElementById(targetBtnId);
    if (activeBtn) activeBtn.classList.add("active");

    const activeSection = document.getElementById(targetSectionId);
    if (activeSection) activeSection.style.display = "block";

    const searchBar = document.getElementById("global-search-bar");
    if (searchBar) {
        searchBar.value = ""; 
        searchBar.dispatchEvent(new Event('input'));
    }

    localStorage.setItem("activeTabId", targetBtnId);

    if (typeof callback === 'function') {
      try {
        await callback();
      } catch (error) {
        console.error(`Module Loading Error for ${targetSectionId}:`, error);
        alert(`An error occurred while loading the module data.`);
      }
    }
  };

  const searchBar = document.getElementById("global-search-bar");
  if (searchBar) {
      searchBar.addEventListener("input", function() {
          const searchTerm = this.value.toLowerCase();
          const activeSection = document.querySelector(".tab-section[style*='display: block']");
          
          if (activeSection) {
              const rows = activeSection.querySelectorAll("table tbody tr");
              rows.forEach(row => {
                  const rowData = row.textContent.toLowerCase();
                  if (rowData.includes(searchTerm)) {
                      row.style.display = "";
                  } else {
                      row.style.display = "none";
                  }
              });
          }
      });
  }
const navStores = document.getElementById("nav-stores");
  if (navStores) navStores.onclick = () => switchTab("nav-stores", "section-stores", initStoresModule);
  
  const salesFilter = document.getElementById("sales-filter");
  if (salesFilter) {
    salesFilter.addEventListener("change", displaySalesHistory);
  }
  
  const navHome = document.getElementById("nav-home");
  if (navHome) navHome.onclick = () => switchTab("nav-home", "section-home", loadHomeDashboard);

  const navReports = document.getElementById("nav-reports");
  if (navReports) navReports.onclick = () => switchTab("nav-reports", "section-reports", initReports);
  
  const navProducts = document.getElementById("nav-products");
  if (navProducts) navProducts.onclick = () => switchTab("nav-products", "section-products", async () => {
    await loadCategoryDropdown();
    await displayProducts();
  });

  const navPo = document.getElementById("nav-po");
  if (navPo) navPo.onclick = () => switchTab("nav-po", "section-po", loadPOs);

  const navTransfers = document.getElementById("nav-transfers");
  if (navTransfers) navTransfers.onclick = () => switchTab("nav-transfers", "section-transfers", loadTransfers);

  const navCounts = document.getElementById("nav-counts");
  if (navCounts) navCounts.onclick = () => switchTab("nav-counts", "section-counts", null);

  const navCategories = document.getElementById("nav-categories");
  if (navCategories) navCategories.onclick = () => switchTab("nav-categories", "section-categories", displayCategories);

  const navSuppliers = document.getElementById("nav-suppliers");
  if (navSuppliers) navSuppliers.onclick = () => switchTab("nav-suppliers", "section-suppliers", initSuppliersModule);

  const navLogs = document.getElementById("nav-logs");
  if (navLogs) navLogs.onclick = () => switchTab("nav-logs", "section-logs", displaySystemLogs);

  const navPos = document.getElementById("nav-pos");
  if (navPos) navPos.onclick = () => switchTab("nav-pos", "section-pos", initPOS);

  const navAr = document.getElementById("nav-ar");
  if (navAr) navAr.onclick = () => switchTab("nav-ar", "section-ar", initAR);

  const navHistory = document.getElementById("nav-history");
  if (navHistory) navHistory.onclick = () => switchTab("nav-history", "section-history", displaySalesHistory);

  const navArchive = document.getElementById("nav-archive");
  if (navArchive) navArchive.onclick = () => switchTab("nav-archive", "section-archive", initArchive);

  const saveCategoryBtn = document.getElementById("btn-save-category");
  if (saveCategoryBtn) saveCategoryBtn.onclick = insertCategory;

  const saveProductBtn = document.getElementById("btn-save-product");
  if (saveProductBtn) saveProductBtn.onclick = insertProduct;

  const savedTabId = localStorage.getItem("activeTabId");
  if (savedTabId && document.getElementById(savedTabId)) {
    document.getElementById(savedTabId).click();
  } else if (navHome) {
    switchTab("nav-home", "section-home", loadHomeDashboard);
  }
});

window.transferBatchToNonSellable = async function(batchId, productId, productName, lotNumber, quantity) {
  if (!confirm(`Transfer Lot "${lotNumber}" of "${productName}" (${quantity} pcs) to NON-SELLABLE inventory?\n\nThis will remove the item from sellable stock and move it to Product Master Non-Sellable.`)) {
    return;
  }

  try {
    const res = await axios.post('api/products.php?action=transfer_batch_to_nonsellable', {
      batch_id: batchId,
      product_id: productId,
      quantity: quantity,
      note: `Near-expiry lot #${lotNumber} transferred to non-sellable from Dashboard`
    });

    if (res.data.success) {
      alert(`Lot #${lotNumber} transferred to Non-Sellable stock successfully.`);
      loadHomeDashboard();
    } else {
      alert("Error: " + (res.data.error || "Failed to transfer batch."));
    }
  } catch (e) {
    console.error("Transfer Error:", e);
    alert("Server error occurred while transferring batch.");
  }
};

window.quickDraftPo = function(productId, suggestedQty) {
  const navPoBtn = document.getElementById('nav-po');
  if (navPoBtn) navPoBtn.click();

  setTimeout(() => {
    const prodSelect = document.getElementById('po-product-select');
    const qtyInput = document.getElementById('po-qty');

    if (prodSelect && productId) {
      prodSelect.value = productId;
      prodSelect.dispatchEvent(new Event('change'));
    }
    if (qtyInput) {
      qtyInput.value = suggestedQty || 50;
    }
  }, 150);
};

// Global return document modal helper
window.openStandardizedReturnDoc = function(data) {
  document.getElementById('docTypeBadge').textContent = data.type || "RETURN SLIP";
  document.getElementById('docTrackingNo').textContent = "REF: " + (data.trackingNo || "#N/A");
  document.getElementById('docEntityName').textContent = data.entityName || "N/A";
  document.getElementById('docEntityCode').textContent = (data.entityLabel || "Entity") + " Code: " + (data.entityCode || "N/A");
  document.getElementById('docDate').textContent = data.date || new Date().toISOString().split('T')[0];
  document.getElementById('docReason').textContent = data.reason || "N/A";
  document.getElementById('docRemarks').textContent = data.remarks || "None";

  const tbody = document.getElementById('docItemsTableBody');
  let totalQty = 0;
  let totalVal = 0;

  if (tbody && data.items) {
    tbody.innerHTML = data.items.map((it, idx) => {
      const q = parseFloat(it.qty || 0);
      const c = parseFloat(it.unitCost || 0);
      const tot = q * c;
      totalQty += q;
      totalVal += tot;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td class="fw-bold">${it.sku || 'N/A'}</td>
          <td>${it.name || 'N/A'}</td>
          <td class="text-center fw-bold">${q}</td>
          <td class="text-end">₱ ${c.toLocaleString('en-PH', {minimumFractionDigits:2})}</td>
          <td class="text-end fw-bold">₱ ${tot.toLocaleString('en-PH', {minimumFractionDigits:2})}</td>
        </tr>
      `;
    }).join('');
  }

  document.getElementById('docTotalQty').textContent = totalQty;
  document.getElementById('docTotalValue').textContent = `₱ ${totalVal.toLocaleString('en-PH', {minimumFractionDigits:2})}`;

  const modalEl = document.getElementById('returnDocumentModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

window.printReturnDocument = function() {
  const content = document.getElementById('returnDocumentPrintArea').innerHTML;
  const printWindow = window.open('', '', 'height=750,width=950');
  printWindow.document.write('<html><head><title>ApexLogix - Official Return Document</title>');
  printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />');
  printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:30px;color:#000;}</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write(content);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};