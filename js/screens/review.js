import { renderItemRow } from '../components/itemRow.js';
import { makeId } from '../components/chip.js';
import { emitBillChanged } from '../events.js';

export function renderReview({ bill, onNext }) {
  const nameInput = document.getElementById('bill-name');
  const itemsList = document.getElementById('items-list');
  const addBtn = document.getElementById('add-item-btn');
  const serviceInput = document.getElementById('extra-service');
  const taxInput = document.getElementById('extra-tax');
  const tipInput = document.getElementById('extra-tip');
  const discountInput = document.getElementById('extra-discount');
  const discountToggle = document.getElementById('discount-mode-toggle');
  const nextBtn = document.getElementById('review-next-btn');

  nameInput.value = bill.name || '';
  serviceInput.value = bill.extras.serviceCharge || '';
  taxInput.value = bill.extras.tax || '';
  tipInput.value = bill.extras.tip || '';
  discountInput.value = bill.extras.discount || '';

  bill.extras.discountMode = bill.extras.discountMode || 'amt';
  function refreshToggle() {
    discountToggle.textContent = bill.extras.discountMode === 'pct' ? '%' : 'amt';
    discountToggle.classList.toggle('active', bill.extras.discountMode === 'pct');
    discountInput.placeholder = bill.extras.discountMode === 'pct' ? 'e.g. 10' : '';
  }
  refreshToggle();
  discountToggle.onclick = () => {
    bill.extras.discountMode = bill.extras.discountMode === 'pct' ? 'amt' : 'pct';
    refreshToggle();
    emitBillChanged();
  };

  function refreshItems() {
    itemsList.innerHTML = '';
    for (const item of bill.items) {
      const row = renderItemRow(item, {
        onChange: (id, patch) => {
          const it = bill.items.find(i => i.id === id);
          if (it) Object.assign(it, patch);
        },
        onDelete: (id) => {
          bill.items = bill.items.filter(i => i.id !== id);
          refreshItems();
          emitBillChanged();
        },
      });
      itemsList.appendChild(row);
    }
  }
  refreshItems();

  addBtn.onclick = () => {
    bill.items.push({ id: makeId('i'), name: '', price: 0 });
    refreshItems();
    const last = itemsList.lastElementChild;
    last?.querySelector('input')?.focus();
    emitBillChanged();
  };

  nameInput.oninput = () => { bill.name = nameInput.value; };
  serviceInput.oninput = () => { bill.extras.serviceCharge = parseFloat(serviceInput.value) || 0; };
  taxInput.oninput = () => { bill.extras.tax = parseFloat(taxInput.value) || 0; };
  tipInput.oninput = () => { bill.extras.tip = parseFloat(tipInput.value) || 0; };
  discountInput.oninput = () => { bill.extras.discount = parseFloat(discountInput.value) || 0; };

  nextBtn.onclick = () => {
    bill.items = bill.items.filter(i => (i.name?.trim() || i.price));
    onNext();
  };
}
