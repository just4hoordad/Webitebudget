// Deterministic price correction applied to every generated grocery list.
// The AI's numbers are never trusted as-is: totals are recomputed from
// pack price × pack count, known community prices override guesses, and the
// "regular price" comparison is clamped to a realistic range.

const MID_RANGE = ["rewe", "edeka"];
const round = (n) => Math.round(n * 100) / 100;

// "3 × 500g", "3x 1L", "2 Packungen" → 3 / 3 / 2; otherwise null.
export function packCount(quantity) {
  const q = String(quantity || "").toLowerCase();
  const m = q.match(/^\s*(\d+)\s*(?:x|×|\*|stk|stück|packs?|packungen?|pkg|dosen|flaschen|becher|beutel)\b/)
    || q.match(/(\d+)\s*(?:x|×)\s*\d/);
  const n = m ? parseInt(m[1], 10) : null;
  return n && n > 0 && n <= 20 ? n : null;
}

// Typical per-pack price bounds in EUR — anything outside is an AI error.
const MIN_PACK = 0.19;
const MAX_PACK = 25;

export function sanitizeItem(item, known) {
  const i = { ...item };
  let unit = Number(i.unit_price);
  let price = Number(i.price);
  const ref = known?.get(String(i.name || "").toLowerCase());
  // A real observed price beats the AI's guess when they disagree by >25%.
  if (ref && Number(ref.unit_price) > 0 && (!(unit > 0) || Math.abs(unit - ref.unit_price) / ref.unit_price > 0.25)) {
    unit = Number(ref.unit_price);
  }
  let packs = packCount(i.quantity);
  if (!packs && unit > 0 && price > 0) packs = Math.max(1, Math.round(price / unit));
  packs = packs || 1;
  if (!(unit > 0)) unit = price > 0 ? price / packs : MIN_PACK;
  unit = Math.min(MAX_PACK, Math.max(MIN_PACK, unit));
  price = unit * packs;
  i.unit_price = round(unit);
  i.price = round(price);
  // Regular (REWE/Edeka) price: never below our price, at most ~25% above.
  const midRange = MID_RANGE.some((s) => String(i.store || "").toLowerCase().includes(s));
  const maxNormal = price * (midRange ? 1.05 : 1.25);
  let normal = Number(i.normal_price);
  if (!(normal >= price)) normal = price * (midRange ? 1 : 1.12);
  i.normal_price = round(Math.min(normal, maxNormal));
  if (i.alternatives) i.alternatives = i.alternatives.map((a) => sanitizeItem(a, known));
  return i;
}

export function sanitizePrices(result, known) {
  if (!result?.categories) return result;
  const categories = result.categories.map((c) => ({ ...c, items: (c.items || []).map((i) => sanitizeItem(i, known)) }));
  const total = categories.flatMap((c) => c.items).reduce((s, i) => s + i.price, 0);
  return { ...result, categories, total_estimated_cost: round(total) };
}