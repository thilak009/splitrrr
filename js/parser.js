import { makeId } from './components/chip.js';

const NUMBER_RE = /-?\d{1,6}(?:[.,]\d{1,3})?/g;
const DATE_RE = /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/;
const TIME_RE = /\b\d{1,2}:\d{2}(?::\d{2})?\b/;
const PHONE_RE = /\b(?:ph|tel|phone|mob|mobile|fax)\b/i;
const ID_KEYWORDS_RE = /\b(tin|gstin|fssai|pan|cin|vat\s*no|tax\s*no|reg\s*no|invoice\s*no|bill\s*no|table|waiter|cashier|order|receipt|host|server|guest|cover|ref)\b/i;
const HEADER_HINTS_RE = /\b(item|qty|quantity|price|rate|amount|total|description|particulars|sl|sno|s\.no|hsn|sac)\b/i;
const ADDRESS_HINTS_RE = /\b(road|street|cross|block|nagar|layout|sector|floor|building|complex|opp|near|po\s*box|p\.o)\b/i;

const KEYWORDS = [
  { test: /\b(service\s*charges?|service\s*chrg|svc\s*chg|svc)\b/i,   bucket: 'serviceCharge' },
  { test: /\b(service\s*tax|s\.?tax)\b/i,                              bucket: 'tax' },
  { test: /\b(vat|gst|cgst|sgst|igst|tax|cess)\b/i,                    bucket: 'tax' },
  { test: /\b(tip|gratuity)\b/i,                                        bucket: 'tip' },
  { test: /\b(discount|off|promo|coupon|loyalty)\b/i,                  bucket: 'discount' },
  { test: /\b(sub\s*total|sub-total|gross\s*total)\b/i,                bucket: 'subtotal' },
  { test: /\b(total\s*quantity|total\s*qty|qty\s*total)\b/i,           bucket: 'skip' },
  { test: /\b(grand\s*total|net\s*total|net\s*amount|net\s*payable|amount\s*due|amount\s*payable|total)\b/i, bucket: 'total' },
];

function classify(name) {
  const n = name.toLowerCase();
  for (const kw of KEYWORDS) {
    if (kw.test.test(n)) return kw.bucket;
  }
  return 'item';
}

function looksLikeMetadata(line) {
  if (DATE_RE.test(line)) return true;
  if (TIME_RE.test(line)) return true;
  if (PHONE_RE.test(line)) return true;
  if (ID_KEYWORDS_RE.test(line)) return true;
  if (ADDRESS_HINTS_RE.test(line)) return true;
  if (/^[\-=_~*]{3,}$/.test(line)) return true;
  return false;
}

function looksLikeColumnHeader(line) {
  const matches = line.match(HEADER_HINTS_RE);
  if (!matches) return false;
  const hits = (line.toLowerCase().match(/\b(item|qty|quantity|price|rate|amount|total|description|particulars|sl|sno|s\.no|hsn|sac)\b/g) || []).length;
  return hits >= 2;
}

function extractNumbers(line) {
  const out = [];
  let m;
  NUMBER_RE.lastIndex = 0;
  while ((m = NUMBER_RE.exec(line))) {
    const raw = m[0].replace(',', '.');
    const num = parseFloat(raw);
    if (!isFinite(num)) continue;
    out.push({ value: Math.abs(num), index: m.index, raw: m[0], length: m[0].length });
  }
  return out;
}

function stripNumbersAndJunk(line) {
  return line
    .replace(NUMBER_RE, ' ')
    .replace(/[₹$€£%]/g, ' ')
    .replace(/[\.\-\:\|\s]+/g, ' ')
    .trim();
}

function looksLikeName(text) {
  if (!text) return false;
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 3) return false;
  return true;
}

function isLikelyQuantity(n) {
  if (n.value <= 0) return true;
  if (/\.\d{3}$/.test(n.raw)) return true;
  if (n.value < 10 && /\.\d{2}$/.test(n.raw)) return true;
  if (Number.isInteger(n.value) && n.value <= 20) return true;
  return false;
}

function pickPriceFromNumbers(nums, bucket) {
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0].value;
  if (bucket !== 'item') return nums[nums.length - 1].value;

  const meaningful = nums.filter(n => !isLikelyQuantity(n));
  if (meaningful.length === 0) {
    return Math.max(...nums.map(n => n.value));
  }
  if (meaningful.length === 1) return meaningful[0].value;
  return meaningful[meaningful.length - 1].value;
}

export function parseBillText(rawText) {
  const result = {
    items: [],
    serviceCharge: 0,
    tax: 0,
    tip: 0,
    discount: 0,
    detectedTotal: null,
  };

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (looksLikeMetadata(line)) continue;
    if (looksLikeColumnHeader(line)) continue;

    const nums = extractNumbers(line);
    if (nums.length === 0) continue;

    const nameText = stripNumbersAndJunk(line);
    const bucket = classify(nameText || line);

    if (bucket === 'skip') continue;

    const price = pickPriceFromNumbers(nums, bucket);
    if (price === null || price <= 0) continue;

    if (bucket === 'serviceCharge') { result.serviceCharge += price; continue; }
    if (bucket === 'tax')           { result.tax += price; continue; }
    if (bucket === 'tip')           { result.tip += price; continue; }
    if (bucket === 'discount')      { result.discount += price; continue; }
    if (bucket === 'subtotal')      { continue; }
    if (bucket === 'total')         { result.detectedTotal = price; continue; }

    if (!looksLikeName(nameText)) continue;
    result.items.push({ id: makeId('i'), name: nameText, price });
  }

  return result;
}
