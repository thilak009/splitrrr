const BILLS_KEY = 'splitrrr.bills';
const VERSION_KEY = 'splitrrr.schemaVersion';
const DRAFT_KEY = 'splitrrr.draft';
const VIEW_KEY = 'splitrrr.viewing';
const SCHEMA_VERSION = 1;

export function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function setViewing(billId) {
  if (billId) localStorage.setItem(VIEW_KEY, billId);
  else localStorage.removeItem(VIEW_KEY);
}

export function getViewing() {
  return localStorage.getItem(VIEW_KEY);
}

let billsCache = null;

function readBills() {
  if (billsCache !== null) return billsCache;
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    if (!raw) { billsCache = []; return billsCache; }
    const parsed = JSON.parse(raw);
    billsCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    billsCache = [];
  }
  return billsCache;
}

function writeBills(bills) {
  billsCache = bills;
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
}

export function listBills() {
  return readBills();
}

export function saveBill(bill) {
  const bills = readBills();
  const idx = bills.findIndex(b => b.id === bill.id);
  if (idx >= 0) bills[idx] = bill;
  else bills.unshift(bill);
  writeBills(bills);
}

export function deleteBill(id) {
  const bills = readBills().filter(b => b.id !== id);
  writeBills(bills);
}

export function getBill(id) {
  return readBills().find(b => b.id === id) || null;
}
