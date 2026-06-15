import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function bucketCalories(cal) {
  return Math.round(cal / 500) * 500;
}

function getBudgetCategory(budget, days, people) {
  const dailyPerPerson = budget / days / people;
  if (dailyPerPerson < 3) return 'low';
  if (dailyPerPerson < 6) return 'medium';
  return 'high';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { diet, calories, people, days, budget, language_code, plan_type } = await req.json();

    const bucketedCalories = bucketCalories(calories);

    // Fetch all matching templates for this diet + calorie + language + plan_type
    const templates = await base44.asServiceRole.entities.MealTemplate.filter({
      diet,
      calories: bucketedCalories,
      language_code: language_code || 'en',
      plan_type: plan_type || 'exact'
    });

    if (!templates || templates.length === 0) {
      return Response.json({ found: false });
    }

    // Pick the least-used template for variety (with random tiebreaking)
    const sorted = [...templates].sort((a, b) => {
      const diff = (a.use_count || 0) - (b.use_count || 0);
      return diff !== 0 ? diff : Math.random() - 0.5;
    });
    const picked = sorted[0];

    // Increment use_count asynchronously (fire and forget)
    base44.asServiceRole.entities.MealTemplate.update(picked.id, {
      use_count: (picked.use_count || 0) + 1
    }).catch(() => {});

    return Response.json({ found: true, template: picked });
  } catch (error) {
    console.error("getMealTemplate error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});