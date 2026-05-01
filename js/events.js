export const BILL_CHANGED = 'splitrrr:bill-changed';

export function emitBillChanged() {
  document.dispatchEvent(new CustomEvent(BILL_CHANGED));
}
