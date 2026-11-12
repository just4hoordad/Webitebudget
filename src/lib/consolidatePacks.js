// Deterministically consolidates unrealistic pack stacking (e.g. "8 × 1kg")
// into fewer, larger packs (e.g. "4 × 2kg") so a grocery list looks like a real
// shopping basket instead of eight small packs of every product.
//
// The AI often ignores the "never more than 6 packs, pick a larger pack size"
// rule and stacks many small packs. This runs after generation and merges
// packs deterministically: total quantity and total price are preserved, only
// the pack count and per-pack size change.

const COUNT_UNITS = new Set(["stk", "st\u00fcck", "st", "paar", "beutel", "rollen", "pack", "er"]);

function parsePackSize(sizeStr) {
  const m = String(sizeStr || "").trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|stk|st\u00fcck|st|paar|beutel|rollen|pack|er)?$/i);
  if (!m) return null;
  return { val: parseFloat(m[1].replace(",", ".")), unit: (m[2] || "").toLowerCase() };
}

function formatPackSize(val, unit) {
  if (!unit) return String(val);
  // Convert up to kg / L for anything >= 1000g/ml so the pack size stays readable.
  if (unit === "g" && val >= 1000) return `${(val / 1000).toString().replace(/\.0$/, "")}kg`;
  if (unit === "ml" && val >= 1000) return `${(val / 1000).toString().replace(/\.0$/, "")}L`;
  if (unit === "l") return `${val}L`;
  return `${val}${unit}`;
}

function parseQuantity(qty) {
  const m = String(qty || "").match(/^(\d+)\s*[x\u00d7]\s*(.+)$/i);
  if (!m) return null;
  return { packs: parseInt(m[1], 10), packSize: m[2].trim() };
}

export function consolidatePacks(result, p) {
  const maxPacks = Math.min(6, 3 + Number(p?.people || 1) * 2);
  const categories = (result?.categories || []).map((c) => ({
    ...c,
    items: (c.items || []).map((item) => {
      if (!item.quantity || !item.unit_price || !item.price) return item;
      const parsed = parseQuantity(item.quantity);
      if (!parsed || parsed.packs <= maxPacks) return item;
      const ps = parsePackSize(parsed.packSize);
      if (!ps) return item;
      // Merge packs: m = how many original packs go into one new pack, chosen
      // so the new pack count fits within maxPacks. Total quantity is preserved.
      const m = Math.ceil(parsed.packs / maxPacks);
      const newPacks = Math.ceil(parsed.packs / m);
      const newVal = ps.val * m;
      const ratio = (newPacks * m) / parsed.packs;
      const newUnitPrice = Math.round(Number(item.unit_price) * m * 100) / 100;
      const newPrice = Math.round(newUnitPrice * newPacks * 100) / 100;
      return {
        ...item,
        quantity: `${newPacks} \u00d7 ${formatPackSize(newVal, ps.unit)}`,
        unit_price: newUnitPrice,
        price: newPrice,
        ...(item.normal_price != null ? { normal_price: Math.round(Number(item.normal_price) * ratio * 100) / 100 } : {}),
        ...(item.total_kcal != null ? { total_kcal: Math.round(Number(item.total_kcal) * ratio) } : {}),
        ...(item.protein_g != null ? { protein_g: Math.round(Number(item.protein_g) * ratio) } : {}),
        ...(item.carb_g != null ? { carb_g: Math.round(Number(item.carb_g) * ratio) } : {}),
        ...(item.fat_g != null ? { fat_g: Math.round(Number(item.fat_g) * ratio) } : {}),
      };
    }),
  }));
  return { ...result, categories };
}