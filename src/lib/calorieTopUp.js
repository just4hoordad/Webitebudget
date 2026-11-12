// Bidirectional, budget-aware deterministic calorie calibrator.
// Guarantees the generated grocery list lands within ~97%–103% of (calories × days)
// while respecting the user's main grocery budget and separate Protein Snacks allowance.

import { isProteinSnacks } from "@/lib/grocerySpending";

const MAX_PACKS = 8;

function isLiquidMilk(name) {
  const n = String(name || "").toLowerCase();
  return /\b(vollmilch|haltbare milch|frischmilch|fettarme milch|h-milch|hafermilch|mandelmilch|sojamilch|milch\s+1[.,]5|milch\s+3[.,]5|milk)\b/.test(n)
    && !/joghurt|quark|skyr|käse|cheese|butter|pulver|riegel|bar|drink\s*\d+g/i.test(n);
}

function isPureFatOrOil(name) {
  return /\b(olivenöl|rapsöl|sonnenblumenöl|speiseöl|kokosöl|bratöl|butter|margarine)\b/i.test(String(name || ""));
}

function downsizeSinglePack(sizeStr) {
  const m = String(sizeStr || "").trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)$/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  const base = unit === "kg" || unit === "l" ? val * 1000 : val;
  if (base < 750) return null;
  const half = Math.round(base / 2);
  const isVol = unit === "l" || unit === "ml";
  const label = half >= 1000
    ? `${(half / 1000).toString().replace(/\.0$/, "")}${isVol ? "L" : "kg"}`
    : `${half}${isVol ? "ml" : "g"}`;
  return { ratio: half / base, label };
}

// Diet/store-safe affordable German staples used ONLY when a tight-budget list
// lacks any affordable energy staple to reach the user's minimum calorie goal.
const FALLBACK_STAPLES = [
  { name: "Gut & Günstig Zarte Haferflocken 500g", category: "Grains & Pasta", unit_price: 0.79, size: "500g", calories_info: "372 kcal/100g", kcalPack: 1860, macro: [68, 294, 35], gluten: true, vegan: true, frozen: false },
  { name: "Ja! Langkornreis Spitzenqualität 1kg", category: "Grains & Pasta", unit_price: 1.49, size: "1kg", calories_info: "350 kcal/100g", kcalPack: 3500, macro: [74, 776, 8], gluten: false, vegan: true, frozen: false },
  { name: "Combino Spaghetti 500g", category: "Grains & Pasta", unit_price: 0.79, size: "500g", calories_info: "356 kcal/100g", kcalPack: 1780, macro: [62, 355, 8], gluten: true, vegan: true, frozen: false },
  { name: "Speisekartoffeln festkochend 2,5kg", category: "Vegetables", unit_price: 2.49, size: "2.5kg", calories_info: "73 kcal/100g", kcalPack: 1825, macro: [50, 385, 3], gluten: false, vegan: true, frozen: false },
  { name: "McCain Golden Longs Pommes Frites 750g", category: "Frozen", unit_price: 2.29, size: "750g", calories_info: "165 kcal/100g", kcalPack: 1238, macro: [19, 203, 36], gluten: false, vegan: true, frozen: true },
];

function pickAllowedStoreLabel(stores) {
  const first = String(stores || "").replace(/\([^)]*\)/g, "").split(",")[0]?.trim();
  if (!first) return "Aldi";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function topUpCalories(result, p, explicitMainCap) {
  const target = Number(p?.calories) * Number(p?.days);
  if (!(target > 0) || !result?.categories?.length) return result;

  const mainCap = Number.isFinite(Number(explicitMainCap)) && Number(explicitMainCap) > 0
    ? Number(explicitMainCap)
    : Number(p.budget) || Infinity;

  const maxMilkPacks = Math.max(2, Math.ceil((Number(p.people) || 1) * 0.25 * (Number(p.days) || 7)));

  const info = [];
  (result.categories || []).forEach((cat) => {
    const isSnackCat = isProteinSnacks(cat);
    const isExtraCat = /^(premium|protein supplements)$/i.test(String(cat.name || "").trim());
    (cat.items || []).forEach((i) => {
      const unit = Number(i.unit_price) || Number(i.price) || 0;
      const n = Math.max(1, Math.round((Number(i.price) || unit) / (unit || 1)));
      const kcalPack = (Number(i.total_kcal) || 0) / n;
      const rawQty = String(i.quantity || "").trim();
      const size = rawQty.replace(/^\s*\d+\s*[×x*]\s*/i, "") || rawQty;
      info.push({
        i,
        cat,
        isSnackCat,
        isExtraCat,
        unit,
        n,
        n0: n,
        kcalPack,
        size,
        milk: isLiquidMilk(i.name),
        oil: isPureFatOrOil(i.name),
        macro: ["protein_g", "carb_g", "fat_g"].map((f) => (Number(i[f]) || 0) / n),
      });
    });
  });

  const calcKcal = () => info.reduce((s, x) => s + (x.removed ? 0 : x.kcalPack * x.n), 0);
  const calcMainCost = () => info.reduce((s, x) => s + (x.removed || x.isSnackCat ? 0 : x.unit * x.n), 0);
  const calcOilKcal = () => info.reduce((s, x) => s + (x.removed || !x.oil ? 0 : x.kcalPack * x.n), 0);

  let kcal = calcKcal();
  let mainCost = calcMainCost();

  const adjustable = info.filter((x) => !x.isSnackCat && x.unit > 0 && x.kcalPack > 0);

  // =========================================================================
  // DIRECTION 1: TOO HIGH (> 104% of target) — step down excess packs/sizes
  // =========================================================================
  if (kcal > target * 1.04) {
    // Step Down-1: proportional pack reduction on multi-pack items (largest kcal/pack first)
    const scale = target / kcal;
    const multiByKcal = [...adjustable].filter((x) => x.n > 1).sort((a, b) => b.kcalPack - a.kcalPack);
    for (const x of multiByKcal) {
      const desiredN = Math.max(1, Math.round(x.n * scale));
      while (x.n > desiredN && kcal - x.kcalPack >= target * 0.97) {
        x.n -= 1;
        kcal -= x.kcalPack;
        mainCost -= x.unit;
      }
    }

    // Step Down-2: greedy best-fit single-pack reductions on remaining n > 1 items
    let trimmed = true;
    while (kcal > target * 1.04 && trimmed) {
      trimmed = false;
      const candidates = adjustable.filter((x) => !x.removed && x.n > 1 && kcal - x.kcalPack >= target * 0.95);
      if (!candidates.length) break;
      candidates.sort((a, b) => Math.abs((kcal - a.kcalPack) - target) - Math.abs((kcal - b.kcalPack) - target));
      const best = candidates[0];
      if (Math.abs((kcal - best.kcalPack) - target) < Math.abs(kcal - target)) {
        best.n -= 1;
        kcal -= best.kcalPack;
        mainCost -= best.unit;
        trimmed = true;
      }
    }

    // Step Down-3: downsize oversized single packs (e.g. 1 × 2kg rice or 1 × 1L oil on short plans)
    if (kcal > target * 1.05) {
      const bigSingles = adjustable
        .filter((x) => !x.removed && x.n === 1 && x.kcalPack > target * 0.16 && downsizeSinglePack(x.size))
        .sort((a, b) => b.kcalPack - a.kcalPack);
      for (const x of bigSingles) {
        if (kcal <= target * 1.04) break;
        const ds = downsizeSinglePack(x.size);
        if (!ds) continue;
        const savedKcal = x.kcalPack * (1 - ds.ratio);
        if (kcal - savedKcal < target * 0.95) continue;
        const priceFactor = Math.max(ds.ratio, 0.55);
        mainCost -= x.unit * (1 - priceFactor);
        x.unit = Math.max(0.39, Math.round(x.unit * priceFactor * 100) / 100);
        x.kcalPack = x.kcalPack * ds.ratio;
        x.macro = x.macro.map((m) => m * ds.ratio);
        const oldSize = x.size;
        x.size = ds.label;
        if (oldSize && x.i.name) {
          x.i.name = String(x.i.name).replace(new RegExp(`\\b${oldSize.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), ds.label);
        }
        kcal -= savedKcal;
      }
    }

    // Step Down-4: if extra padding items (Premium / Supplements / surplus items beyond minItems)
    // still push calories > 106%, drop the surplus item that lands closest to target.
    const minItems = (Number(p.days) || 7) >= 14 ? 12 : 8;
    let activeCount = info.filter((x) => !x.removed).length;
    while (kcal > target * 1.06 && activeCount > minItems) {
      const droppable = adjustable.filter(
        (x) => !x.removed && x.n === 1 && kcal - x.kcalPack >= target * 0.95
      );
      if (!droppable.length) break;
      // Prefer dropping injected Premium/Supplement items first, then closest-to-target
      droppable.sort((a, b) => {
        if (a.isExtraCat !== b.isExtraCat) return a.isExtraCat ? -1 : 1;
        return Math.abs((kcal - a.kcalPack) - target) - Math.abs((kcal - b.kcalPack) - target);
      });
      const drop = droppable[0];
      if (Math.abs((kcal - drop.kcalPack) - target) >= Math.abs(kcal - target)) break;
      drop.removed = true;
      kcal -= drop.kcalPack;
      mainCost -= drop.unit;
      activeCount -= 1;
    }
  }

  // =========================================================================
  // DIRECTION 2: TOO LOW (< 97% of target) — scale up within budget
  // =========================================================================
  const canGrow = (x) => {
    if (x.removed || x.isSnackCat || x.unit <= 0 || x.kcalPack <= 0) return false;
    if (x.n >= MAX_PACKS) return false;
    if (x.milk && x.n >= maxMilkPacks) return false;
    if (x.oil && calcOilKcal() + x.kcalPack > target * 0.18) return false;
    return true;
  };

  if (kcal > 0 && kcal < target * 0.97) {
    // Step Up-1: budget-aware proportional scaling, highest kcal/€ staples first
    const scale = target / kcal;
    const byEfficiency = [...adjustable].sort((a, b) => b.kcalPack / b.unit - a.kcalPack / a.unit);
    for (const x of byEfficiency) {
      if (kcal >= target * 0.98) break;
      const desiredN = Math.min(MAX_PACKS, Math.max(x.n, Math.round(x.n * scale)));
      while (x.n < desiredN && canGrow(x) && mainCost + x.unit <= mainCap && kcal + x.kcalPack <= target * 1.04) {
        x.n += 1;
        kcal += x.kcalPack;
        mainCost += x.unit;
      }
    }

    // Step Up-2: greedy best-fit pack additions within remaining main budget
    let added = true;
    while (kcal < target * 0.97 && added) {
      added = false;
      const candidates = byEfficiency.filter(
        (x) => canGrow(x) && mainCost + x.unit <= mainCap && kcal + x.kcalPack <= target * 1.05
      );
      if (!candidates.length) break;
      // When budget is comfortable, pick the pack that lands closest to target; when tight, pick best kcal/€
      const budgetHeadroom = mainCap - mainCost;
      if (budgetHeadroom > 6) {
        candidates.sort((a, b) => Math.abs((kcal + a.kcalPack) - target) - Math.abs((kcal + b.kcalPack) - target));
      }
      const pick = candidates[0];
      pick.n += 1;
      kcal += pick.kcalPack;
      mainCost += pick.unit;
      added = true;
    }

    // Step Up-3: budget reallocation — if still < 96% because low-kcal/€ items
    // consumed the budget, trade 1 pack of a multi-pack low-kcal/€ item for high-kcal/€ staples.
    let reallocated = true;
    while (kcal < target * 0.96 && reallocated) {
      reallocated = false;
      const lowEff = adjustable
        .filter((x) => !x.removed && x.n > 1 && x.kcalPack / x.unit < 500)
        .sort((a, b) => a.kcalPack / a.unit - b.kcalPack / b.unit);
      const highEff = adjustable
        .filter((x) => canGrow(x) && x.kcalPack / x.unit >= 900)
        .sort((a, b) => b.kcalPack / b.unit - a.kcalPack / a.unit);
      if (!lowEff.length || !highEff.length) break;

      const donor = lowEff[0];
      const receiver = highEff.find(
        (r) => mainCost - donor.unit + r.unit <= mainCap && r.kcalPack > donor.kcalPack && kcal - donor.kcalPack + r.kcalPack <= target * 1.05
      );
      if (receiver) {
        donor.n -= 1;
        receiver.n += 1;
        kcal += receiver.kcalPack - donor.kcalPack;
        mainCost += receiver.unit - donor.unit;
        reallocated = true;
      }
    }

    // Step Up-4: fallback affordable staple if list still < 95% and budget has €0.80+ left
    if (kcal < target * 0.95 && mainCost + 0.79 <= mainCap) {
      const isFrozen = p.diet === "frozen" || p.diet === "half-cooked";
      const isGF = p.diet === "gluten-free" || (p.allergies || []).some((a) => /gluten|weizen|wheat/i.test(a));
      const storeLabel = pickAllowedStoreLabel(p.stores);
      const existingNames = new Set(info.map((x) => String(x.i.name || "").toLowerCase()));
      const candidates = FALLBACK_STAPLES.filter((s) => {
        if (s.frozen !== isFrozen) return false;
        if (isGF && s.gluten) return false;
        if (existingNames.has(s.name.toLowerCase())) return false;
        return true;
      });
      for (const st of candidates) {
        if (kcal >= target * 0.97) break;
        if (mainCost + st.unit_price > mainCap || kcal + st.kcalPack > target * 1.05) continue;
        let packs = 1;
        while (
          packs < MAX_PACKS &&
          kcal + st.kcalPack * (packs + 1) <= target * 1.03 &&
          mainCost + st.unit_price * (packs + 1) <= mainCap
        ) {
          packs += 1;
        }
        const newItem = {
          name: p.bio ? `Bio ${st.name.replace(/^(Gut & Günstig|Ja!|Combino)\s+/i, "")}` : st.name,
          store: storeLabel,
          unit_price: st.unit_price,
          price: Math.round(st.unit_price * packs * 100) / 100,
          normal_price: Math.round(st.unit_price * 1.12 * packs * 100) / 100,
          quantity: `${packs} × ${st.size}`,
          calories_info: st.calories_info,
          total_kcal: Math.round(st.kcalPack * packs),
          protein_g: Math.round(st.macro[0] * packs),
          carb_g: Math.round(st.macro[1] * packs),
          fat_g: Math.round(st.macro[2] * packs),
        };
        let targetCat = result.categories.find((c) => c.name === st.category);
        if (!targetCat) {
          targetCat = { name: st.category, items: [] };
          result.categories = [...result.categories, targetCat];
        }
        targetCat.items = [...(targetCat.items || []), newItem];
        kcal += st.kcalPack * packs;
        mainCost += st.unit_price * packs;
      }
    }
  }

  // Write calibrated pack counts, prices, and nutrients back to items
  info.forEach((x) => {
    if (x.removed) return;
    x.i.unit_price = Math.round(x.unit * 100) / 100;
    x.i.price = Math.round(x.unit * x.n * 100) / 100;
    x.i.total_kcal = Math.round(x.kcalPack * x.n);
    ["protein_g", "carb_g", "fat_g"].forEach((f, k) => {
      if (x.i[f] != null) x.i[f] = Math.round(x.macro[k] * x.n);
    });
    if (x.size) x.i.quantity = `${x.n} × ${x.size}`;
    if (x.i.normal_price != null && x.n0 > 0) {
      const scaledNormal = Math.round((Number(x.i.normal_price) / x.n0) * x.n * 100) / 100;
      x.i.normal_price = Math.max(x.i.price, scaledNormal);
    }
  });

  const removedRefs = new Set(info.filter((x) => x.removed).map((x) => x.i));
  const categories = (result.categories || [])
    .map((c) => ({ ...c, items: (c.items || []).filter((it) => !removedRefs.has(it)) }))
    .filter((c) => c.items.length > 0);

  const totalCost = categories
    .flatMap((c) => c.items)
    .reduce((s, i) => s + (Number(i.price) || 0), 0);

  return { ...result, categories, total_estimated_cost: Math.round(totalCost * 100) / 100 };
}