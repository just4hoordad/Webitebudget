// Deterministic fix for lists with too little food: add packs of the items that give
// the most calories per euro (at their real pack price) until the calorie target is
// met, without exceeding the budget or a realistic pack count per item.
const MAX_PACKS = 8;

export function topUpCalories(result, p, cap) {
  const target = Number(p.calories) * Number(p.days) * 0.95;
  const items = (result?.categories || []).flatMap((c) => c.items || []);
  const info = items.map((i) => {
    const unit = Number(i.unit_price) || 0;
    const n = Math.max(1, Math.round((Number(i.price) || unit) / (unit || 1)));
    const kcalPack = (Number(i.total_kcal) || 0) / n;
    const size = String(i.quantity || "").replace(/^\s*\d+\s*[×x]\s*/i, "");
    return { i, unit, n, n0: n, kcalPack, size, macro: ["protein_g", "carb_g", "fat_g"].map((f) => (Number(i[f]) || 0) / n) };
  }).filter((x) => x.unit > 0 && x.kcalPack > 0 && !/protein snack/i.test(x.i.category || ""))
    .sort((a, b) => b.kcalPack / b.unit - a.kcalPack / a.unit);

  let kcal = items.reduce((s, i) => s + (Number(i.total_kcal) || 0), 0);
  let cost = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  let added = true;
  while (kcal < target && added) {
    added = false;
    for (const x of info) {
      if (kcal >= target) break;
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