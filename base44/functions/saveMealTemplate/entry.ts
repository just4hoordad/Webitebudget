import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function bucketCalories(cal) {
  return Math.round(cal / 500) * 500;
}

function getBudgetCategory(budget, days, people) {
  const dailyPerPerson = budget / days / people;
  if (dailyPerPerson < 4) return 'low';
  if (dailyPerPerson < 8) return 'medium';
  return 'high';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { diet, calories, people, days, budget, language_code, plan_data, plan_type } = await req.json();

    const bucketedCalories = bucketCalories(calories);
    const budgetCategory = getBudgetCategory(budget, days, people);

    // Don't save duplicates — check if a very similar template already exists
    const existing = await base44.asServiceRole.entities.MealTemplate.filter({
      diet,
      calories: bucketedCalories,
      language_code: language_code || 'en',
      plan_type: plan_type || 'exact'
    });

    // Cap library at 20 templates per diet/calorie/language combo to keep variety
    if (existing && existing.length >= 20) {
      return Response.json({ saved: false, reason: 'library_full' });
    }

    const template = await base44.asServiceRole.entities.MealTemplate.create({
      diet,
      calories: bucketedCalories,
      people: people || 1,
      days: days || 7,
      budget_category: budgetCategory,
      language_code: language_code || 'en',
      plan_data,
      plan_type: plan_type || 'exact',
      use_count: 0
    });

    return Response.json({ saved: true, id: template.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});