// js/modules/counts.js

let activeSessionId = null;

export function initCountsModule() {
    document.getElementById('btn-start-count')?.addEventListener('click', startNewCountSession);
    
    document.getElementById('nav-counts')?.addEventListener('click', () => {
        const container = document.getElementById('counts-table-div');
        if (container && !activeSessionId) {
            container.innerHTML = '<div class="p-3 text-muted">No active count session. Click "Start New Blind Count Session" to generate a physical count sheet.</div>';
        }
    });
}

async function startNewCountSession() {
    try {
        const res = await axios.post('api/inventory_counts.php?action=create_session');
        if (res.data.success) {
            activeSessionId = res.data.session_id;
            alert(`New Count Session Started: ${res.data.session_no}`);
            loadBlindCountSheet(activeSessionId);
        } else {
            alert("Error: " + res.data.error);
        }
    } catch (e) { 
        alert("Error starting count session."); 
    }
}

async function loadBlindCountSheet(sessionId) {
    const container = document.getElementById('counts-table-div');
    if (!container) return;

    try {
        const res = await axios.get(`api/inventory_counts.php?action=get_blind_sheet&session_id=${sessionId}`);
        if (!res.data.success) return;

        let html = `
            <div class="alert alert-info py-2 fw-bold">BLIND COUNT SHEET IN PROGRESS - System Quantities Hidden</div>
            <table class="table table-sm table-bordered">
                <thead>
                    <tr><th>SKU</th><th>Product Name</th><th>Barcode</th><th width="180">Physical Counted Qty</th></tr>
                </thead>
                <tbody>`;
                
        res.data.items.forEach(i => {
            html += `
                <tr data-item-id="${i.item_id}">
                    <td><code>${i.sku}</code></td>
                    <td class="fw-bold">${i.product_name}</td>
                    <td>${i.barcode || '-'}</td>
                    <td><input type="number" class="form-control count-qty-input" value="${i.counted_qty || 0}" min="0" step="1"></td>
                </tr>`;
        });

        html += `</tbody></table>
        <button class="btn btn-dark w-100 fw-bold mt-2" onclick="window.submitBlindCounts(${sessionId})">Submit Physical Counts for Manager Review</button>`;
        container.innerHTML = html;

        // Auto-focus first physical count input (#7 Barcode Focus)
        setTimeout(() => {
            const firstInput = container.querySelector('.count-qty-input');
            if (firstInput) firstInput.focus();
        }, 100);

    } catch (e) {
        container.innerHTML = '<div class="p-3 text-danger">Failed to load count sheet.</div>';
    }
}

window.submitBlindCounts = async function(sessionId) {
    const rows = document.querySelectorAll('#counts-table-div tr[data-item-id]');
    let counts = [];

    rows.forEach(r => {
        counts.push({
            item_id: r.getAttribute('data-item-id'),
            counted_qty: parseFloat(r.querySelector('.count-qty-input').value) || 0
        });
    });

    try {
        const res = await axios.post('api/inventory_counts.php?action=submit_counts', { session_id: sessionId, counts: counts });
        if (res.data.success) {
            alert("Counts submitted successfully! Transferred to Manager for Approval.");
            loadApprovalSheet(sessionId);
        } else {
            alert(res.data.error);
        }
    } catch (e) {
        alert("Failed to submit counts.");
    }
};

async function loadApprovalSheet(sessionId) {
    const container = document.getElementById('counts-table-div');
    try {
        const res = await axios.get(`api/inventory_counts.php?action=get_approval_sheet&session_id=${sessionId}`);
        
        let html = `
            <div class="alert alert-warning py-2 fw-bold text-dark">MANAGER RECONCILIATION SHEET - System Snapshot vs Physical Count</div>
            <table class="table table-sm table-bordered">
                <thead>
                    <tr><th>SKU</th><th>Product Name</th><th>System Qty</th><th>Counted Qty</th><th>Variance</th></tr>
                </thead>
                <tbody>`;

        res.data.items.forEach(i => {
            const v = parseFloat(i.variance);
            const vClass = v !== 0 ? (v < 0 ? 'text-danger fw-bold' : 'text-success fw-bold') : 'text-muted';
            html += `
                <tr>
                    <td><code>${i.sku}</code></td>
                    <td class="fw-bold">${i.product_name}</td>
                    <td>${i.system_qty_snapshot}</td>
                    <td>${i.counted_qty}</td>
                    <td class="${vClass}">${v > 0 ? '+' : ''}${v}</td>
                </tr>`;
        });

        html += `</tbody></table>
        <div class="box bg-light border p-3 mt-3">
            <div class="row align-items-center">
                <div class="col-md-7">
                    <label class="fw-bold text-danger mb-1"><i class="fas fa-lock me-1"></i> Admin / Manager Passcode Required *</label>
                    <input type="password" id="countApprovalPasscode" class="form-control border-danger" placeholder="Enter Admin or Manager Passcode (e.g. ADMIN2026 or MGR2026)" autocomplete="new-password">
                </div>
                <div class="col-md-5 mt-3 mt-md-0">
                    <button class="btn btn-success w-100 fw-bold py-2" onclick="window.approveCountSession(${sessionId})">
                        <i class="fas fa-check-circle me-1"></i> Approve Cycle Count & Post Ledger
                    </button>
                </div>
            </div>
        </div>`;
        
        container.innerHTML = html;

        // Auto-focus passcode field (#7 Barcode Focus)
        setTimeout(() => {
            const passcodeField = document.getElementById('countApprovalPasscode');
            if (passcodeField) passcodeField.focus();
        }, 100);

    } catch (e) {
        container.innerHTML = '<div class="p-3 text-danger">Failed to load approval sheet.</div>';
    }
}

window.approveCountSession = async function(sessionId) {
    const passcode = document.getElementById('countApprovalPasscode')?.value.trim();

    if (!passcode) {
        return alert("Authorization Required: Please enter an Admin or Manager passcode to approve stock adjustments.");
    }

    if (!confirm("Are you sure you want to approve this cycle count session? Stock ledger will be adjusted automatically.")) return;

    try {
        const res = await axios.post('api/inventory_counts.php?action=approve_session', { 
            session_id: sessionId,
            passcode: passcode 
        });

        if (res.data.success) {
            alert(`Cycle Count Approved by ${res.data.approver} (${res.data.role})!\nStock balances updated successfully.`);
            activeSessionId = null;
            document.getElementById('counts-table-div').innerHTML = '<div class="p-3 text-muted">No active count session.</div>';
        } else {
            alert("Error: " + res.data.error);
        }
    } catch (e) {
        alert("Failed to approve count session.");
    }
};