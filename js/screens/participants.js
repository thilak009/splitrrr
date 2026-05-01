import { renderChip, colorFor, makeId } from '../components/chip.js';
import { emitBillChanged } from '../events.js';

export function renderParticipants({ bill, onNext }) {
  const form = document.getElementById('participant-form');
  const input = document.getElementById('participant-name');
  const list = document.getElementById('participants-list');
  const nextBtn = document.getElementById('participants-next-btn');

  input.value = '';

  function refresh() {
    list.innerHTML = '';
    bill.participants.forEach((p, i) => {
      p.color = p.color || colorFor(i);
      const chip = renderChip({
        id: p.id,
        name: p.name,
        color: p.color,
        removable: true,
        onRemove: (id) => {
          bill.participants = bill.participants.filter(x => x.id !== id);
          for (const itemId of Object.keys(bill.assignments)) {
            bill.assignments[itemId] = bill.assignments[itemId].filter(pid => pid !== id);
          }
          refresh();
          emitBillChanged();
        },
      });
      const li = document.createElement('li');
      li.appendChild(chip);
      list.appendChild(li);
    });
    nextBtn.disabled = bill.participants.length < 2;
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    if (bill.participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      input.value = '';
      return;
    }
    bill.participants.push({
      id: makeId('p'),
      name,
      color: colorFor(bill.participants.length),
    });
    input.value = '';
    input.focus();
    refresh();
    emitBillChanged();
  };

  nextBtn.onclick = onNext;
  refresh();
}
