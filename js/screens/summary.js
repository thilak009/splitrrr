import { computeTotals, fmt } from '../calc.js';
import { saveBill } from '../storage.js';

export function renderSummary({ bill, viewOnly = false, onSaved, onDiscard, onDone }) {
  const grandEl = document.getElementById('summary-grand-total');
  const warnEl = document.getElementById('summary-warnings');
  const list = document.getElementById('summary-list');
  const saveBtn = document.getElementById('summary-save-btn');
  const discardBtn = document.getElementById('summary-discard-btn');

  const totals = computeTotals(bill);
  if (!viewOnly) {
    bill.totals = { grandTotal: totals.grandTotal, perPerson: totals.perPerson };
  }

  grandEl.textContent = 'Total: ' + fmt(totals.grandTotal);

  warnEl.innerHTML = '';
  if (totals.unassignedItems.length > 0) {
    warnEl.hidden = false;
    const details = document.createElement('details');
    details.className = 'shared-all';
    const summary = document.createElement('summary');
    summary.textContent = `${totals.unassignedItems.length} item${totals.unassignedItems.length === 1 ? '' : 's'} shared across all`;
    const ul = document.createElement('ul');
    for (const it of totals.unassignedItems) {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = it.name || '(unnamed)';
      const price = document.createElement('span');
      price.textContent = fmt(Number(it.price) || 0);
      li.append(name, price);
      ul.appendChild(li);
    }
    details.append(summary, ul);
    warnEl.appendChild(details);
  } else {
    warnEl.hidden = true;
  }

  list.innerHTML = '';
  for (const p of bill.participants) {
    const li = document.createElement('li');
    li.className = 'summary-card';
    li.style.borderLeftColor = p.color;

    const header = document.createElement('div');
    header.className = 's-header';
    const name = document.createElement('span');
    name.className = 's-name';
    name.textContent = p.name;
    const total = document.createElement('span');
    total.className = 's-total';
    total.textContent = fmt(totals.perPerson[p.id] || 0);
    header.append(name, total);

    const items = document.createElement('ul');
    items.className = 's-items';
    const breakdown = totals.perPersonItemBreakdown[p.id] || [];
    for (const b of breakdown) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = (b.name || '(unnamed)') + (b.shared ? ' (shared)' : '') + (b.unassigned ? ' *' : '');
      const amt = document.createElement('span');
      amt.textContent = fmt(b.share);
      row.append(label, amt);
      items.appendChild(row);
    }
    if (breakdown.length === 0) {
      const row = document.createElement('li');
      row.textContent = 'No items assigned';
      items.appendChild(row);
    }

    li.append(header, items);
    list.appendChild(li);
  }

  if (viewOnly) {
    discardBtn.hidden = true;
    saveBtn.textContent = 'Done';
    saveBtn.onclick = () => onDone();
  } else {
    discardBtn.hidden = false;
    saveBtn.textContent = 'Save & finish';
    saveBtn.onclick = () => {
      saveBill(bill);
      onSaved();
    };
    discardBtn.onclick = onDiscard;
  }
}
