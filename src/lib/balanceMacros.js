// Deterministic fix for macro-split deviation.
// When the AI returns a list whose protein/carb/fat split (by kcal) is more
// than 8 percentage points off the user's target, this scales protein-rich
// items UP and carb-heavy items DOWN (or the reverse) to close the gap —
// without another expensive AI call.
//
// Budget-aware: scales up the cheapest protein sources first and stops
// when the budget is reached, so the correction never pushes the list
// over budget. Only runs when p.macros is set AND deviation exceeds 8pp.

const MAX_PACKS = 8;
const MIN_PACKS = 1;

export function balanceMacros(result, p) {
  if (!p.macros) return result;
  const { protein: targetP, carbs: targetC, fats: targetF } = p.macros;
  const budgetCap = Number(p.budget) + (Number(p.proteinSnackBudget) || 0);

  const items = (result?.categories || []).flatMap((c) => c.items || []);
  if (!items.length) return result;

  const computeSplit = (list) => {
    const pKcal = list.reduce((s, i) => s + (Number(i.protein_g) || 0) * 4, 0);
    const cKcal = list.reduce((s, i) => s + (Number(i.carb_g) || 0) * 4, 0);
    const fKcal = list.reduce((s, i) => s + (Number(i.fat_g) || 0) * 9, 0);
    const total = pKcal + cKcal + fKcal;
    if (total <= 0) return null;
    return { protein: (pKcal / total) * 100, carbs: (cKcal / total) * 100, fats: (fKcal / total) * 100, total };
  };

  const split = computeSplit(items);
  if (!split) return result;

  const devP = split.protein - targetP;
  const devC = split.carbs - targetC;
  const worst = Math.max(Math.abs(devP), Math.abs(devC), Math.abs(split.fats - targetF));
  if (worst <= 8) return result;

  // Build per-item pack info
  const info = items.map((i) => {
    const unit = Number(i.unit_price) || 0;
    const n = Math.max(1, Math.round((Number(i.price) || unit) / (unit || 1)));
    const size = String(i.quantity || "").replace(/^\s*\d+\s*[×x]\s*/i, "");
    const kcalPack = (Number(i.total_kcal) || 0) / n;
    const protPack = (Number(i.protein_g) || 0) / n;
    const carbPack = (Number(i.carb_g) || 0) / n;
    const fatPack = (Number(i.fat_g) || 0) / n;
    const itemKcal = protPack * 4 + carbPack * 4 + fatPack * 9;
    const protShare = itemKcal > 0 ? (protPack * 4) / itemKcal : 0;
    const carbShare = itemKcal > 0 ? (carbPack * 4) / itemKcal : 0;
    // Protein per euro — cheapest protein sources get scaled up first
    const protPerEuro = unit > 0 && protPack > 0 ? protPack / unit : 0;
    return { i, unit, n, n0: n, kcalPack, protPack, carbPack, fatPack, size, protShare, carbShare, protPerEuro };
  }).filter((x) => x.unit > 0);

  const needMoreProtein = devP < -8;
  const needFewerCarbs = devC > 8;

  // Phase 1: Scale DOWN carb-heavy items first — this frees up budget
  // for more protein without exceeding the cap.
  if (needMoreProtein && needFewerCarbs) {
    const carbItems = info
      .filter((x) => x.carbShare > 0.50 && x.protShare < 0.15)
      .sort((a, b) => b.carbShare - a.carbShare);
    carbItems.forEach((x) => {
      x.n = Math.max(MIN_PACKS, Math.floor(x.n * 0.5));
    });
  }

  // Phase 2: Scale UP protein-rich items, cheapest first, until budget is reached.
  // This is budget-aware: it tracks the running cost and stops scaling when
  // adding more would exceed the budget cap.
  if (needMoreProtein) {
    // Sort by protein-per-euro descending — cheapest protein sources first
    const proteinItems = info
      .filter((x) => x.protShare > 0.20)
      .sort((a, b) => b.protPerEuro - a.protPerEuro);

    // Compute current cost after carb reduction
    let runningCost = info.reduce((s, x) => s + x.unit * x.n, 0);

    for (const x of proteinItems) {
      if (runningCost >= budgetCap) break;
      const targetN = Math.min(MAX_PACKS, Math.max(x.n, Math.ceil(x.n * 2)));
      while (x.n < targetN && runningCost + x.unit <= budgetCap) {
        x.n += 1;
        runningCost += x.unit;
      }
    }
  } else if (devP > 8) {
    // Too much protein — scale down protein items, scale up carb/fat items
    const proteinItems = info.filter((x) => x.protShare > 0.25).sort((a, b) => b.protShare - a.protShare);
    proteinItems.forEach((x) => { x.n = Math.max(MIN_PACKS, Math.floor(x.n * 0.75)); });
    const otherItems = info.filter((x) => x.carbShare > 0.4 || (x.fatPack * 9) / (x.kcalPack || 1) > 0.4).sort((a, b) => b.carbShare - a.carbShare);
    otherItems.forEach((x) => { x.n = Math.min(MAX_PACKS, Math.ceil(x.n * 1.3)); });
  } else if (needFewerCarbs) {
    const carbItems = info.filter((x) => x.carbShare > 0.55).sort((a, b) => b.carbShare - a.carbShare);
    carbItems.forEach((x) => { x.n = Math.max(MIN_PACKS, Math.floor(x.n * 0.8)); });
  } else if (split.fats - targetF > 8) {
    const fatItems = info.filter((x) => {
      const itemKcal = x.protPack * 4 + x.carbPack * 4 + x.fatPack * 9;
      return itemKcal > 0 && (x.fatPack * 9) / itemKcal > 0.5;
    }).sort((a, b) => {
      const aK = a.protPack * 4 + a.carbPack * 4 + a.fatPack * 9;
      const bK = b.protPack * 4 + b.carbPack * 4 + b.fatPack * 9;
      return (b.fatPack * 9) / bK - (a.fatPack * 9) / aK;
    });
    fatItems.forEach((x) => { x.n = Math.max(MIN_PACKS, Math.floor(x.n * 0.75)); });
  }

  // Apply changes back to items
  let cost = 0;
  info.forEach((x) => {
    x.i.price = Math.round(x.unit * x.n * 100) / 100;
    x.i.total_kcal = Math.round(x.kcalPack * x.n);
    if (x.i.protein_g != null) x.i.protein_g = Math.round(x.protPack * x.n);
    if (x.i.carb_g != null) x.i.carb_g = Math.round(x.carbPack * x.n);
    if (x.i.fat_g != null) x.i.fat_g = Math.round(x.fatPack * x.n);
    if (x.size) x.i.quantity = `${x.n} × ${x.size}`;
    if (x.i.normal_price != null) x.i.normal_price = Math.round((Number(x.i.normal_price) / x.n0) * x.n * 100) / 100;
    cost += x.i.price;
  });

  return { ...result, total_estimated_cost: Math.round(cost * 100) / 100 };
}