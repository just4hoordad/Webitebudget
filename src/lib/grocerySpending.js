const cents = (value) => Math.round((Number(value) || 0) * 100);
export const isProteinSnacks = (category) => String(category.name).trim().toLowerCase() === "protein snacks";

export function grocerySpending(result) {
  let main = 0, snacks = 0;
  for (const category of result?.categories || []) {
    const cost = (category.items || []).reduce((sum, item) => sum + cents(item.price), 0);
    if (isProteinSnacks(category)) snacks += cost;
    else main += cost;
  }
  return { main: main / 100, snacks: snacks / 100, total: (main + snacks) / 100 };
}

export function normalizeGroceryTotal(result) {
  return { ...result, total_estimated_cost: grocerySpending(result).total };
}

export function spendingIssues(result, params, checkSavingTarget = true) {
  const { main, snacks } = grocerySpending(result);
  const budget = cents(params.budget);
  const mainCost = cents(main);
  const snackBudget = cents(params.proteinSnackBudget);
  const mode = params.spendMode || "balanced";
  const issues = [];
  if (mainCost > budget) issues.push(`Main groceries cost €${main.toFixed(2)}, exceeding the main budget of €${(budget / 100).toFixed(2)}. The protein snack allowance cannot fund main groceries.`);
  if (cents(snacks) > snackBudget) issues.push(`Protein snacks cost €${snacks.toFixed(2)}, exceeding their separate €${(snackBudget / 100).toFixed(2)} allowance.`);
  if (snackBudget > 0 && cents(snacks) < Math.max(0, snackBudget - 100)) issues.push("Keep the dedicated Protein Snacks category within €1 of its separate allowance.");
  if (checkSavingTarget && mode === "save" && mainCost > Math.floor(budget * 0.8)) issues.push(`Save mode still costs €${main.toFixed(2)}. Replace expensive products with cheaper equivalents and remove only surplus food, aiming at or below €${(Math.floor(budget * 0.8) / 100).toFixed(2)} without reducing the required nutrition.`);
  if (mode === "balanced" && mainCost < Math.ceil(budget * 0.92)) issues.push(`Balanced mode: the item prices only sum to €${main.toFixed(2)}, while the target is €${(Math.ceil(budget * 0.92) / 100).toFixed(2)}–€${(budget / 100).toFixed(2)}. Upgrade cheap staples to higher-value fresh foods (fresh berries, fruit, vegetables, fish, lean meat, branded dairy) WITHOUT exceeding the required ${Number(params.calories) * Number(params.days)} kcal total — do NOT stack extra packs of high-calorie staples or inflate total_estimated_cost.`);
  return issues;
}

export function preferSpendingCandidate(current, candidate, params, qualityIssues) {
  const qualityDifference = qualityIssues(candidate).length - qualityIssues(current).length;
  if (qualityDifference) return qualityDifference < 0;
  const spendingDifference = spendingIssues(candidate, params).length - spendingIssues(current, params).length;
  if (spendingDifference) return spendingDifference < 0;
  const currentCost = grocerySpending(current).main;
  const nextCost = grocerySpending(candidate).main;
  return params.spendMode === "save" ? nextCost < currentCost
    : Math.abs(nextCost - Number(params.budget) * 0.96) < Math.abs(currentCost - Number(params.budget) * 0.96);
}

export function spendingFailureMessage(mode, language) {
  if (language === "de") return mode === "save"
    ? "Es konnte keine vollständige Einkaufsliste zum Sparziel erstellt werden. Versuche es erneut oder passe Budget, Dauer oder Läden an."
    : "Es konnte keine vollständige Einkaufsliste nahe deinem Budget erstellt werden. Versuche es erneut oder passe Budget, Dauer oder Läden an.";
  return mode === "save"
    ? "Couldn't create a complete list at the saving target. Retry, or adjust your budget, duration or stores."
    : "Couldn't create a complete list close to your budget. Retry, or adjust your budget, duration or stores.";
}