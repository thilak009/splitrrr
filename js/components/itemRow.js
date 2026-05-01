export function renderItemRow(item, { onChange, onDelete }) {
  const li = document.createElement('li');
  li.className = 'item-row';
  li.dataset.itemId = item.id;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Item name';
  nameInput.value = item.name || '';
  nameInput.addEventListener('input', () => onChange(item.id, { name: nameInput.value }));

  const priceInput = document.createElement('input');
  priceInput.type = 'number';
  priceInput.min = '0';
  priceInput.step = '0.01';
  priceInput.inputMode = 'decimal';
  priceInput.placeholder = '0.00';
  priceInput.value = item.price ?? '';
  priceInput.addEventListener('input', () => {
    const v = parseFloat(priceInput.value);
    onChange(item.id, { price: isFinite(v) ? v : 0 });
  });

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-btn';
  del.setAttribute('aria-label', 'Delete item');
  del.textContent = '×';
  del.addEventListener('click', () => onDelete(item.id));

  li.append(nameInput, priceInput, del);
  return li;
}
