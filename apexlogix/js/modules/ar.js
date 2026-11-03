const baseApiUrl = "./api";

export const initAR = async () => {
  const res = await axios.get(`${baseApiUrl}/ar.php?operation=getAR`);
  document.getElementById("ar-table-div").innerHTML = `
    <table class="table table-bordered mb-0">
      <thead>
        <tr>
          <th>Date</th>
          <th>Invoice #</th>
          <th>Customer Company</th>
          <th>TIN</th>
          <th>Amount Due</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${res.data.map(ar => `
          <tr>
            <td>${ar.created_at}</td>
            <td class="fw-bold">${ar.invoice_number}</td>
            <td>${ar.customer_name}</td>
            <td><code>${ar.tin || 'N/A'}</code></td>
            <td class="text-danger fw-bold">₱ ${parseFloat(ar.amount_due).toFixed(2)}</td>
            <td><span class="badge bg-warning text-dark">${ar.status}</span></td>
            <td><button class="btn btn-sm btn-dark" onclick="window.payAR(${ar.ar_id})">Receive Payment</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

window.payAR = async (arId) => {
  if (!confirm("Confirm receipt of payment for this AR balance?")) return;
  const fd = new FormData();
  fd.append("operation", "payAR");
  fd.append("json", JSON.stringify({ arId }));
  await axios.post(`${baseApiUrl}/ar.php`, fd);
  alert("Payment Received and AR Account Settled!");
  initAR();
};