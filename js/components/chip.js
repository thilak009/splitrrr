const HUE_START = 8;
const GOLDEN_ANGLE = 137.508;

export function colorFor(index) {
  const hue = (HUE_START + index * GOLDEN_ANGLE) % 360;
  const sat = 60 + ((index * 7) % 15);
  const light = 58 + ((index * 11) % 8);
  return `hsl(${hue.toFixed(1)}, ${sat}%, ${light}%)`;
}

export function makeId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function renderChip({ id, name, color, draggable = false, removable = false, onRemove }) {
  const el = document.createElement('span');
  el.className = 'chip';
  el.style.background = color;
  el.dataset.participantId = id;
  el.textContent = name;
  if (draggable) el.style.cursor = 'grab';
  if (removable) {
    const x = document.createElement('button');
    x.className = 'chip-x';
    x.type = 'button';
    x.setAttribute('aria-label', 'Remove ' + name);
    x.textContent = '×';
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onRemove) onRemove(id);
    });
    el.appendChild(x);
  }
  return el;
}
