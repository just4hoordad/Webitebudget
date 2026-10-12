import { grocerySpending, isProteinSnacks, normalizeGroceryTotal } from "@/lib/grocerySpending";

// Choose actual replacement products, never multiply prices or add unrelated food.
export function applySpendingAlternatives(input, params, qualityIssues) {
  let result = { ...input, categories: (input.categories || []).map((category) => ({
    ...category, items: (category.items || []).map((item) => ({ ...item })),
  })) };
  const options = [];
  result.categories.forEach((category, categoryIndex) => {
    if (isProteinSnacks(category)) return;
    category.items.forEach((item, itemIndex) => {
      (item.alternatives || []).forEach((replacement) => {
        const fields = ["price", "unit_price", "total_kcal", "protein_g", "carb_g", "fat_g"];
        if (!replacement.name || !replacement.store || !replacement.quantity ||
          fields.some((field) => replacement[field] == null || !Number.isFinite(Number(replacement[field]))) ||
          Number(replacement.price) <= 0 || Number(replacement.unit_price) < 0.15) return;
        const delta = Math.round(Number(replacement.price) * 100) - Math.round(Number(item.price) * 100);
        if (params.spendMode === "save" ? delta >= 0 : delta <= 0) return;
        options.push({ categoryIndex, itemIndex, replacement, delta });
      });
    });
  });
  // Save: biggest saving first. Balanced: smallest upgrade first, so the extra
  // money lifts the quality of many items instead of one premium splurge.
  options.sort((a, b) => a.delta - b.delta);
  const replaced = new Set();
  for (const option of options) {
    const { categoryIndex, itemIndex, replacement, delta } = option;
    const key = `${categoryIndex}:${itemIndex}`;
    if (replaced.has(key)) continue;
    const main = grocerySpending(result).main;
    if (params.spendMode !== "save" && Math.round(main * 100) + delta > Math.round(Number(params.budget) * 100)) continue;
    if (result.categories.some((category) => category.items.some((item) => item.name.toLowerCase() === replacement.name.toLowerCase()))) continue;
    const candidate = { ...result, categories: result.categories.map((category, index) => index !== categoryIndex ? category : {
      ...category, items: category.items.map((item, index) => index === itemIndex ? { ...replacement } : item),
    }) };
    const existingIssues = qualityIssues(result);
    if (qualityIssues(candidate).some((issue) => !existingIssues.includes(issue))) continue;
    result = candidate;
    replaced.add(key);
    if (params.spendMode !== "save" && grocerySpending(result).main >= Number(params.budget) * 0.96) break;
  }
  return normalizeGroceryTotal({ ...result, categories: result.categories.map((category) => ({
    ...category, items: category.items.map(({ alternatives, ...item }) => item),
  })) });
}