// js/modules/pos.js
const baseApiUrl = "./api";
let cart = [];
let productList = [];
let currentBranchId = 2; // Default to Kulas Store (Branch 2)

export const initPOS = async () => {
  try {
    document.getElementById("pos-invoice-num").value = "INV-" + Date.now();
    await loadBranchesDropdown();
    await loadPOSProducts();
    await loadCustomers();

    document.getElementById("btn-add-item").onclick = addToCart;
    document.getElementById("btn-save-pos").onclick = saveTransaction;
    document.getElementById("btn-save-customer").onclick = saveCustomerAccount;

    document.getElementById("pos-total-pax").oninput = calculateTotals;
    document.getElementById("pos-discount-pax").oninput = calculateTotals;

    const branchSelect = document.getElementById("pos-branch-select");
    if (branchSelect) {
      branchSelect.onchange = async function() {
        currentBranchId = this.value;
        cart = [];
        renderCart();
        await loadPOSProducts();
      };
    }

  } catch (error) { console.error(error); }
};

const loadBranchesDropdown = async () => {
  try {
    const res = await axios.get(`${baseApiUrl}/transfers.php?action=get_branches`);
    const select = document.getElementById("pos-branch-select");
    if (select && res.data.success) {
      select.innerHTML = res.data.branches.map(b => `<option value="${b.branch_id}" ${b.branch_id == 2 ? 'selected' : ''}>${b.branch_name}</option>`).join('');
      currentBranchId = select.value;
    }
  } catch (e) {
    console.error("Failed to load POS branches", e);
  }
};

const loadPOSProducts = async () => {
  const response = await axios.get(`${baseApiUrl}/products.php`, { 
    params: { operation: "getAllProducts", branch_id: currentBranchId, for_pos: 1 } 
  });
  if (response.status === 200) {
    productList = response.data;
    const select = document.getElementById("pos-product-select");
    if (select) {
      if (!productList || productList.length === 0) {
        select.innerHTML = '<option value="0">⚠️ No stock available in this store (Waiting for Stock Release from Warehouse)</option>';
      } else {
        select.innerHTML = '<option value="0">Select product / Scan barcode...</option>';
        productList.forEach((p) => {
          const stock = parseFloat(p.sellable_qty || p.qty_on_hand || 0);
          select.innerHTML += `<option value="${p.product_id}">${p.product_name} — ₱ ${parseFloat(p.retail_price).toFixed(2)} (Store Stock: ${stock})</option>`;
        });
      }
    }
  }
};

const loadCustomers = async () => {
  try {
    const response = await axios.get(`${baseApiUrl}/customers.php?operation=getCustomers`);
    const select = document.getElementById("pos-customer-select");
    select.innerHTML = '<option value="0">Walk-in (No Account)</option>';
    response.data.forEach(c => {
      select.innerHTML += `<option value="${c.customer_id}">${c.customer_name} (TIN: ${c.tin})</option>`;
    });
  } catch (error) {
    console.error("Failed to load customers", error);
  }
};

const saveCustomerAccount = async () => {
  const name = document.getElementById("cust-name").value.trim();
  const tin = document.getElementById("cust-tin").value.trim();
  const contact = document.getElementById("cust-contact").value.trim();
  const email = document.getElementById("cust-email").value.trim();

  if (!name || !tin) {
    return alert("Customer/Company Name and TIN are required!");
  }

  const formData = new FormData();
  formData.append("operation", "insertCustomer");
  formData.append("json", JSON.stringify({ name, tin, contact, email }));

  const res = await axios.post(`${baseApiUrl}/customers.php`, formData);
  if (res.data === 1) {
    alert("AR Customer Account Registered!");
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-tin").value = "";
    document.getElementById("cust-contact").value = "";
    document.getElementById("cust-email").value = "";
    
    const modalEl = document.getElementById("customerModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    await loadCustomers();
  } else {
    alert("Failed to save customer account.");
  }
};

const addToCart = () => {
  const productId = document.getElementById("pos-product-select").value;
  const qty = parseInt(document.getElementById("pos-qty").value);
  const product = productList.find((p) => p.product_id == productId);

  if (!product || qty <= 0) return alert("Select valid product/qty!");
  
  const currentStock = parseFloat(product.sellable_qty || product.qty_on_hand || 0);
  if (qty > currentStock) return alert(`Stock limited: ${currentStock} available in this store.`);

  const existingIndex = cart.findIndex(c => c.productId == productId);
  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
    cart[existingIndex].amount = cart[existingIndex].qty * cart[existingIndex].price;
  } else {
    cart.push({
      productId: product.product_id,
      productName: product.product_name,
      barcode: product.barcode,
      price: parseFloat(product.retail_price),
      qty: qty,
      amount: parseFloat(product.retail_price) * qty
    });
  }
  renderCart();
};

const calculateTotals = () => {
  const grossTotal = cart.reduce((sum, item) => sum + item.amount, 0);
  
  let totalPax = parseInt(document.getElementById("pos-total-pax").value) || 1;
  let discountPax = parseInt(document.getElementById("pos-discount-pax").value) || 0;

  if (totalPax < 1) totalPax = 1;
  if (discountPax < 0) discountPax = 0;
  if (discountPax > totalPax) {
    alert("Senior/PWD Pax cannot exceed Total Pax!");
    discountPax = totalPax;
    document.getElementById("pos-discount-pax").value = discountPax;
  }

  const perPersonShare = grossTotal / totalPax;
  const discountAmount = perPersonShare * discountPax * 0.20;

  const payableTotal = grossTotal - discountAmount;
  const subtotal = payableTotal / 1.12;
  const tax = payableTotal - subtotal;

  document.getElementById("pos-gross-total").innerText = `₱ ${grossTotal.toFixed(2)}`;
  document.getElementById("pos-discount-display").innerText = `- ₱ ${discountAmount.toFixed(2)}`;
  document.getElementById("pos-subtotal").innerText = `₱ ${subtotal.toFixed(2)}`;
  document.getElementById("pos-tax").innerText = `₱ ${tax.toFixed(2)}`;
  document.getElementById("pos-total-display").innerText = `₱ ${payableTotal.toFixed(2)}`;

  return { grossTotal, discountAmount, subtotal, tax, payableTotal, totalPax, discountPax };
};

const renderCart = () => {
  const tbody = document.getElementById("pos-cart-body");
  let html = "";

  cart.forEach((item, index) => {
    html += `
        <tr>
            <td>${item.productName}</td>
            <td>${item.barcode || 'N/A'}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-end">₱ ${item.price.toFixed(2)}</td>
            <td class="text-end">₱ ${item.amount.toFixed(2)}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-danger" onclick="removeCartItem(${index})">X</button>
            </td>
        </tr>
    `;
  });

  tbody.innerHTML = html;
  calculateTotals();
};

window.removeCartItem = (index) => {
  cart.splice(index, 1);
  renderCart();
};

const saveTransaction = async () => {
  try {
    if (cart.length === 0) return alert("Cart empty!");

    const customerId = document.getElementById("pos-customer-select").value;
    const isAr = document.getElementById("pos-charge-ar").checked ? 1 : 0;

    if (isAr && customerId === "0") {
      return alert("You must select a registered customer to post to Accounts Receivable.");
    }

    const totals = calculateTotals();

    const header = {
      invoiceNumber: document.getElementById("pos-invoice-num").value,
      branchId: currentBranchId,
      customerId: customerId,
      isAr: isAr,
      totalPax: totals.totalPax,
      discountPax: totals.discountPax,
      discountAmount: totals.discountAmount,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.payableTotal,
    };

    const formData = new FormData();
    formData.append("operation", "saveTransaction");
    formData.append("json", JSON.stringify({ header, details: cart }));

    const response = await axios.post(`${baseApiUrl}/pos.php`, formData);
    if (response.data.status === 1) {
      alert("Checkout successful!");
      cart = [];
      document.getElementById("pos-total-pax").value = 1;
      document.getElementById("pos-discount-pax").value = 0;
      document.getElementById("pos-charge-ar").checked = false;
      document.getElementById("pos-customer-select").value = "0";
      renderCart();
      initPOS();
    } else {
      alert("Checkout Failed: " + response.data.message);
    }
  } catch (error) { console.error(error); }
};