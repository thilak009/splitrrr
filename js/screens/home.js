import { listBills, deleteBill } from '../storage.js';
import { fmt } from '../calc.js';
import { confirmModal } from '../components/modal.js';

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function renderHome({ onNewBill, onOpenBill }) {
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const newBtn = document.getElementById('new-bill-btn');

  newBtn.onclick = onNewBill;

  function refresh() {
    const bills = listBills();
    list.innerHTML = '';
    empty.hidden = bills.length > 0;
    for (const b of bills) {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.onclick = (e) => {
        if (e.target.closest('.h-delete')) return;
        onOpenBill(b.id);
      };

      const meta = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'h-name';
      name.textContent = b.name || 'Untitled bill';
      const date = document.createElement('div');
      date.className = 'h-date';
      date.textContent = fmtDate(b.createdAt);
      meta.append(name, date);

      const total = document.createElement('div');
      total.className = 'h-total';
      total.textContent = fmt(b.totals?.grandTotal ?? 0);

      const del = document.createElement('button');
      del.className = 'h-delete';
      del.type = 'button';
      del.setAttribute('aria-label', 'Delete bill');
      del.textContent = '×';
      del.onclick = async (e) => {
        e.stopPropagation();
        const label = b.name ? `"${b.name}"` : `the bill from ${fmtDate(b.createdAt)}`;
        const ok = await confirmModal(`Delete ${label}?`, { confirmLabel: 'Delete' });
        if (ok) {
          deleteBill(b.id);
          refresh();
        }
      };

      li.append(meta, total, del);
      list.appendChild(li);
    }
  }

  refresh();
}
