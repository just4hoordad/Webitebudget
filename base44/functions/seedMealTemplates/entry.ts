import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MASTER_PARAMETER_LIST = [
  { diet: "balanced", calories: 1500, budget: 100, people: 1, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2000, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2500, budget: 200, people: 1, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2000, budget: 250, people: 2, days: 30, language_code: "de" },
  { diet: "balanced", calories: 1500, budget: 100, people: 1, days: 30, language_code: "en" },
  { diet: "balanced", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
  { diet: "balanced", calories: 2500, budget: 200, people: 1, days: 30, language_code: "en" },
  { diet: "vegan", calories: 1500, budget: 100, people: 1, days: 30, language_code: "de" },
  { diet: "vegan", calories: 2000, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "vegan", calories: 2000, budget: 200, people: 2, days: 30, language_code: "de" },
  { diet: "vegan", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
  { diet: "vegetarian", calories: 1500, budget: 100, people: 1, days: 30, language_code: "de" },
  { diet: "vegetarian", calories: 2000, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "vegetarian", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
  { diet: "keto", calories: 1500, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "keto", calories: 2000, budget: 200, people: 1, days: 30, language_code: "de" },
  { diet: "keto", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
];

const PLAN_TYPES = ["repeat", "exact", "unique"];
const MAX_PER_COMBINATION = 3;

const VARIATION_THEMES = [
  "Mediterranean-inspired meals",
  "Quick 15-minute meals",
  "Batch-cooking friendly",
  "High-protein focus",
  "Comfort food classics",
];

const bucketCalories = (cal) => Math.round(cal / 500) * 500;

const getBudgetCategory = (budget, days, people) => {
  const d = budget / days / people;
  if (d < 3) return "low";
  if (d < 6) return "medium";
  return "high";
};

const weeklyPlanSchema = {
  type: "object",
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          breakfast: { type: "string" },
          breakfast_calories: { type: "number" },
          breakfast_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
          lunch: { type: "string" },
          lunch_calories: { type: "number" },
          lunch_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
          dinner: { type: "string" },
          dinner_calories: { type: "number" },
          dinner_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } }
        }
      }
    }
  }
};

const buildWeekPrompt = (params, weekNum, totalWeeks, daysInThisWeek, previousMeals, variationSeed) =>
  `Create a ${daysInThisWeek}-day meal plan for week ${weekNum} of ${totalWeeks}.
Diet: ${params.diet}. Calories: ${params.calories} kcal/day. People: ${params.people}.
Language: ${params.language_code === "de" ? "German" : "English"}.
${variationSeed ? `Theme: ${variationSeed}.` : ""}
${previousMeals ? `Avoid repeating: ${previousMeals}` : ""}
Calorie split: breakfast ~${Math.round(params.calories * 0.25)} kcal, lunch ~${Math.round(params.calories * 0.35)} kcal, dinner ~${Math.round(params.calories * 0.40)} kcal.
Use affordable German supermarket ingredients. Return EXACTLY ${daysInThisWeek} days.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check: allow scheduled (no session) or admin user
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_) { /* scheduled run — no session, allow through */ }

    // Allow forcing a specific combination via payload (for manual seeding)
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { force_diet, force_language, force_plan_type } = body;

    // Find the FIRST combination that still needs more templates (drip-feed one per run)
    let targetParams = null;
    let targetPlanType = null;
    let existingCount = 0;
    let variationSeed = "";

    outer:
    for (const params of MASTER_PARAMETER_LIST) {
      if (force_diet && params.diet !== force_diet) continue;
      if (force_language && params.language_code !== force_language) continue;
      const bucketed = bucketCalories(params.calories);

      for (const plan_type of PLAN_TYPES) {
        if (force_plan_type && plan_type !== force_plan_type) continue;

        const existing = await base44.asServiceRole.entities.MealTemplate.filter({
          diet: params.diet,
          calories: bucketed,
          language_code: params.language_code,
          plan_type,
        });

        const count = existing ? existing.length : 0;
        if (count < MAX_PER_COMBINATION) {
          targetParams = params;
          targetPlanType = plan_type;
          existingCount = count;
          variationSeed = VARIATION_THEMES[count % VARIATION_THEMES.length];
          break outer;
        }
      }
    }

    if (!targetParams) {
      console.log("All combinations fully seeded — nothing to do.");
      return Response.json({ success: true, seeded: 0, message: "Library complete" });
    }

    const bucketed = bucketCalories(targetParams.calories);
    const budgetCat = getBudgetCategory(targetParams.budget, targetParams.days, targetParams.people);
    const totalDays = targetParams.days;
    const totalWeeks = Math.ceil(totalDays / 7);
    const weeksToGenerate = targetPlanType === "repeat" ? 1 : totalWeeks;

    const weeks = [];
    let previousMeals = "";
    let daysRemaining = totalDays;

    for (let w = 1; w <= weeksToGenerate; w++) {
      const daysInThisWeek = Math.min(daysRemaining, 7);
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildWeekPrompt(targetParams, w, weeksToGenerate, daysInThisWeek, previousMeals, w === 1 ? variationSeed : ""),
        response_json_schema: weeklyPlanSchema,
      });
      const weekDays = result.days || [];
      weeks.push({ week: w, days: weekDays });
      previousMeals += `Week ${w}: ` + weekDays.flatMap(d => [d.breakfast, d.lunch, d.dinner]).filter(Boolean).join(", ");
      daysRemaining -= daysInThisWeek;
    }

    await base44.asServiceRole.entities.MealTemplate.create({
      diet: targetParams.diet,
      calories: bucketed,
      people: targetParams.people,
      days: targetParams.days,
      budget_category: budgetCat,
      language_code: targetParams.language_code,
      plan_data: { weeks },
      plan_type: targetPlanType,
      use_count: 0,
    });

    const msg = `Seeded: ${targetParams.diet}/${bucketed}kcal/${targetPlanType}/${targetParams.language_code} — "${variationSeed}" (was ${existingCount}/${MAX_PER_COMBINATION})`;
    console.log(msg);
    return Response.json({ success: true, seeded: 1, message: msg });

  } catch (error) {
    console.error("seedMealTemplates error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});