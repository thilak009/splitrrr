import { renderChip } from '../components/chip.js';
import { fmt } from '../calc.js';
import { emitBillChanged } from '../events.js';

let sortableInstances = [];

function destroySortables() {
  for (const s of sortableInstances) {
    try { s.destroy(); } catch {}
  }
  sortableInstances = [];
}

export function renderAssign({ bill, onNext }) {
  if (typeof Sortable === 'undefined') {
    throw new Error('SortableJS failed to load');
  }
  const roster = document.getElementById('roster');
  const itemsList = document.getElementById('assign-items-list');
  const nextBtn = document.getElementById('assign-next-btn');

  destroySortables();
  roster.innerHTML = '';
  itemsList.innerHTML = '';

  for (const p of bill.participants) {
    const chip = renderChip({
      id: p.id,
      name: p.name,
      color: p.color,
      draggable: true,
    });
    roster.appendChild(chip);
  }

  sortableInstances.push(new Sortable(roster, {
    group: { name: 'chips', pull: 'clone', put: false },
    sort: false,
    animation: 150,
    forceFallback: true,
    fallbackOnBody: true,
    delay: 100,
    delayOnTouchOnly: true,
  }));

  function rerenderBucket(itemId) {
    const bucket = itemsList.querySelector(`.bucket[data-item-id="${itemId}"]`);
    if (!bucket) return;
    bucket.innerHTML = '';
    const assigned = bill.assignments[itemId] || [];
    for (const pid of assigned) {
      const p = bill.participants.find(x => x.id === pid);
      if (!p) continue;
      const chip = renderChip({
        id: p.id,
        name: p.name,
        color: p.color,
        removable: true,
        onRemove: (rid) => {
          bill.assignments[itemId] = (bill.assignments[itemId] || []).filter(x => x !== rid);
          rerenderBucket(itemId);
          emitBillChanged();
        },
      });
      bucket.appendChild(chip);
    }
  }

  for (const item of bill.items) {
    bill.assignments[item.id] = bill.assignments[item.id] || [];

    const li = document.createElement('li');
    li.className = 'item-row';

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = item.name || '(unnamed)';
    const price = document.createElement('span');
    price.className = 'item-price';
    price.textContent = fmt(Number(item.price) || 0);
    meta.append(name, price);

    const bucket = document.createElement('div');
    bucket.className = 'bucket';
    bucket.dataset.itemId = item.id;

    li.append(meta, bucket);
    itemsList.appendChild(li);

    rerenderBucket(item.id);

    sortableInstances.push(new Sortable(bucket, {
      group: { name: 'chips', pull: false, put: true },
      sort: false,
      animation: 150,
      forceFallback: true,
      onAdd: (evt) => {
        const participantId = evt.item.dataset.participantId;
        const itemId = bucket.dataset.itemId;
        evt.item.remove();
        if (!participantId) return;
        const current = bill.assignments[itemId] || [];
        if (current.includes(participantId)) return;
        bill.assignments[itemId] = [...current, participantId];
        rerenderBucket(itemId);
        emitBillChanged();
      },
    }));
  }

  nextBtn.onclick = onNext;
}

export function teardownAssign() {
  destroySortables();
}
