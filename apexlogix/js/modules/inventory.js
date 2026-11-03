// js/modules/inventory.js
let currentAdjProductId = null;
let currentAdjStock = 0;

export async function openUnifiedAdjustmentModal(productId, productName, sku, currentStock) {
    currentAdjProductId = productId;
    currentAdjStock = parseFloat(currentStock) || 0;

    document.getElementById('adjProductInfo').innerText = `${productName} (${sku})`;
    document.getElementById('adjCurrentStock').value = currentAdjStock;
    document.getElementById('adjCalculatedTotal').value = currentAdjStock;
    document.getElementById('adjValueInput').value = '';
    document.getElementById('adjNote').value = '';

    const res = await fetch('api/inventory.php?action=get_reasons&applies_to=adjustment');
    const data = await res.json();
    const select = document.getElementById('adjReasonSelect');
    select.innerHTML = '<option value="">-- Select Reason --</option>';
    if (data.success) {
        data.reasons.forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.name} (${r.direction.toUpperCase()})</option>`;
        });
    }

    new bootstrap.Modal(document.getElementById('unifiedAdjustmentModal')).show();
}

function calculateAdjustment() {
    const isCountMode = document.getElementById('adjModeCount').checked;
    const rawVal = parseFloat(document.getElementById('adjValueInput').value) || 0;
    const totalInput = document.getElementById('adjCalculatedTotal');
    const badge = document.getElementById('adjDeltaBadge');

    let netDelta = isCountMode ? (rawVal - currentAdjStock) : rawVal;
    let newTotal = isCountMode ? rawVal : (currentAdjStock + rawVal);

    totalInput.value = newTotal;
    badge.innerText = netDelta >= 0 ? `+${netDelta}` : `${netDelta}`;
    badge.className = netDelta >= 0 ? "badge bg-success" : "badge bg-danger";
}

document.querySelectorAll('input[name="adjMode"]').forEach(r => r.addEventListener('change', calculateAdjustment));
document.getElementById('adjValueInput').addEventListener('input', calculateAdjustment);

document.getElementById('btnConfirmAdjustment').onclick = async function() {
    const btn = this;
    const isCount = document.getElementById('adjModeCount').checked;
    const val = parseFloat(document.getElementById('adjValueInput').value);
    const reasonId = document.getElementById('adjReasonSelect').value;
    const note = document.getElementById('adjNote').value.trim();

    if (isNaN(val)) return alert("Enter a valid numerical value.");
    if (!reasonId) return alert("Select an adjustment reason.");

    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        const res = await fetch('api/inventory.php?action=adjust_stock', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ product_id: currentAdjProductId, mode: isCount ? 'count' : 'delta', value: val, reason_id: reasonId, note: note })
        });
        const data = await res.json();
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('unifiedAdjustmentModal')).hide();
            alert("Save Adjustment: Completed successfully.");
            window.location.reload();
        } else alert(data.error);
    } catch (e) {
        alert("Server error saving stock adjustment.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Adjustment";
    }
};

window.openUnifiedAdjustmentModal = openUnifiedAdjustmentModal;