// Free-tier duration policy.
// Free users can generate a meal plan for up to 30 days, but the generated
// grocery list is capped at 7 days (a Premium upsell). Pro users get the full
// selected duration for both the plan and the grocery list.

export const FREE_GROCERY_DAY_CAP = 7;
export const MAX_PLAN_DAYS = 30;

// Days the grocery list should cover for a given user.
export function groceryDaysForUser(days, isPro) {
  const d = Number(days) || 1;
  return isPro ? d : Math.min(d, FREE_GROCERY_DAY_CAP);
}

// True when the free-tier grocery list is shorter than the requested plan.
export function isGroceryCapped(planDays, isPro) {
  return !isPro && Number(planDays) > FREE_GROCERY_DAY_CAP;
}