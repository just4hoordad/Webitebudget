// Deterministic fix for lists with too little food.
// Phase 1: scale ALL pack counts proportionally so the whole list grows
// toward the calorie target (not just a few calorie-dense items).
// Phase 2: add packs of the best kcal/€ items to close any remaining gap
// left by whole-pack rounding, without exceeding budget or MAX_PACKS.
const MAX_PACKS = 8;

export function topUpCalories(result, p, cap) {
  const target = Number(p.calories) * Number(p.days);
  const items = (result?.categories || []).flatMap((c) => c.items || []);
  const info = items.map((i) => {
    const unit = Number(i.unit_price) || 0;
    const n = Math.max(1, Math.round((Number(i.price) || unit) / (unit || 1)));
    const kcalPack = (Number(i.total_kcal) || 0) / n;
    const size = String(i.quantity || "").replace(/^\s*\d+\s*[×x]\s*/i, "");
    return { i, unit, n, n0: n, kcalPack, size, macro: ["protein_g", "carb_g", "fat_g"].map((f) => (Number(i[f]) || 0) / n) };
  }).filter((x) => x.unit > 0 && x.kcalPack > 0);

  let kcal = info.reduce((s, x) => s + x.kcalPack * x.n, 0);
  let cost = items.reduce((s, i) => s + (Number(i.price) || 0), 0);

  // Phase 1: proportional scaling — grow every item's pack count by the same
  // factor so nutritional balance is preserved, not skewed toward one staple.
  if (kcal > 0 && kcal < target * 0.98) {
    const scale = target / kcal;
    info.forEach((x) => {
      const newN = Math.max(1, Math.round(x.n * scale));
      if (newN > x.n && newN <= MAX_PACKS) {
        cost += x.unit * (newN - x.n);
        x.n = newN;
      }
    });
    kcal = info.reduce((s, x) => s + x.kcalPack * x.n, 0);
  }

  // Phase 2: top up with best kcal/€ items if whole-pack rounding left a gap.
  const ranked = [...info]
    .filter((x) => !/protein snack/i.test(x.i.category || ""))
    .sort((a, b) => b.kcalPack / b.unit - a.kcalPack / a.unit);
  let added = true;
  while (kcal < target * 0.98 && added) {
    added = false;
    for (const x of ranked) {
      if (kcal >= target * 0.98) break;
      if (x.n >= MAX_PACKS || cost + x.unit > cap) continue;
      x.n += 1; kcal += x.kcalPack; cost += x.unit; added = true;
    }
  }

  info.forEach((x) => {
    x.i.price = Math.round(x.unit * x.n * 100) / 100;
    x.i.total_kcal = Math.round(x.kcalPack * x.n);
    ["protein_g", "carb_g", "fat_g"].forEach((f, k) => { if (x.i[f] != null) x.i[f] = Math.round(x.macro[k] * x.n); });
    if (x.size) x.i.quantity = `${x.n} × ${x.size}`;
    if (x.i.normal_price != null) x.i.normal_price = Math.round((Number(x.i.normal_price) / x.n0) * x.n * 100) / 100;
  });
  return { ...result, total_estimated_cost: Math.round(cost * 100) / 100 };
}