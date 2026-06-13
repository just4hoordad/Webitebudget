import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Bucket calories to nearest 500 for matching
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
    const { diet, calories, people, days, budget, language_code, plan_type } = await req.json();

    const bucketedCalories = bucketCalories(calories);
    const budgetCategory = getBudgetCategory(budget, days, people);

    // Try to find an existing template matching these params
    const templates = await base44.asServiceRole.entities.MealTemplate.filter({
      diet,
      calories: bucketedCalories,
      language_code: language_code || 'en',
      plan_type: plan_type || 'exact'
    });

    if (!templates || templates.length === 0) {
      return Response.json({ found: false });
    }

    // Pick a random one from matches to provide variety
    const picked = templates[Math.floor(Math.random() * templates.length)];

    // Increment use_count asynchronously (fire and forget)
    base44.asServiceRole.entities.MealTemplate.update(picked.id, {
      use_count: (picked.use_count || 0) + 1
    });

    return Response.json({ found: true, template: picked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});