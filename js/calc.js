export function computeTotals(bill) {
  const { items, participants, assignments, extras } = bill;
  const N = participants.length;
  const itemsSubtotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0);
  const serviceCharge = Number(extras?.serviceCharge) || 0;
  const tax = Number(extras?.tax) || 0;
  const tip = Number(extras?.tip) || 0;
  const discountRaw = Number(extras?.discount) || 0;
  const discount = extras?.discountMode === 'pct'
    ? itemsSubtotal * (discountRaw / 100)
    : discountRaw;

  const perPersonItems = {};
  const perPersonItemBreakdown = {};
  const unassignedItems = [];

  for (const p of participants) {
    perPersonItems[p.id] = 0;
    perPersonItemBreakdown[p.id] = [];
  }

  for (const item of items) {
    const price = Number(item.price) || 0;
    const assignees = assignments?.[item.id] || [];
    if (assignees.length === 0) {
      unassignedItems.push(item);
      if (N > 0) {
        const share = price / N;
        for (const p of participants) {
          perPersonItems[p.id] += share;
          perPersonItemBreakdown[p.id].push({ name: item.name, share, shared: true, unassigned: true });
        }
      }
      continue;
    }
    const share = price / assignees.length;
    for (const pid of assignees) {
      if (perPersonItems[pid] === undefined) continue;
      perPersonItems[pid] += share;
      perPersonItemBreakdown[pid].push({
        name: item.name,
        share,
        shared: assignees.length > 1,
        unassigned: false,
      });
    }
  }

  if (discount > 0 && itemsSubtotal > 0) {
    for (const p of participants) {
      const share = perPersonItems[p.id] / itemsSubtotal;
      perPersonItems[p.id] -= discount * share;
    }
  }

  const equalExtras = N > 0 ? (serviceCharge + tax + tip) / N : 0;
  const perPerson = {};
  for (const p of participants) {
    perPerson[p.id] = perPersonItems[p.id] + equalExtras;
  }

  const grandTotal = itemsSubtotal + serviceCharge + tax + tip - discount;

  return {
    grandTotal,
    perPerson,
    perPersonItemBreakdown,
    unassignedItems,
    itemsSubtotal,
    equalExtras,
  };
}

export function fmt(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
