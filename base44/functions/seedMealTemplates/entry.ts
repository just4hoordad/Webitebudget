import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Top combinations to keep pre-generated in the library
const MASTER_PARAMETER_LIST = [
  // Balanced
  { diet: "balanced", calories: 1500, budget: 100, people: 1, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2000, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2500, budget: 200, people: 1, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2000, budget: 250, people: 2, days: 30, language_code: "de" },
  { diet: "balanced", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
  // Vegan
  { diet: "vegan", calories: 1500, budget: 100, people: 1, days: 30, language_code: "de" },
  { diet: "vegan", calories: 2000, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "vegan", calories: 2000, budget: 200, people: 2, days: 30, language_code: "de" },
  { diet: "vegan", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
  // Keto
  { diet: "keto", calories: 1500, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "keto", calories: 2000, budget: 200, people: 1, days: 30, language_code: "de" },
  { diet: "keto", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
  // Frozen
  { diet: "frozen", calories: 2000, budget: 150, people: 1, days: 30, language_code: "de" },
  { diet: "frozen", calories: 2000, budget: 150, people: 1, days: 30, language_code: "en" },
];

const PLAN_TYPES = ["repeat", "exact", "unique"];

const bucketCalories = (cal) => Math.round(cal / 500) * 500;

const getBudgetCategory = (budget, days, people) => {
  const dailyPerPerson = budget / days / people;
  if (dailyPerPerson < 3) return "low";
  if (dailyPerPerson < 6) return "medium";
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

const buildWeekPrompt = (params, weekNum, totalWeeks, daysInThisWeek, previousMeals = "") =>
  `Create a complete ${daysInThisWeek}-day meal plan for week ${weekNum} of ${totalWeeks}.
Diet: ${params.diet}. Target calories: ${params.calories} kcal/day. People: ${params.people}.
Language: ${params.language_code === "de" ? "German" : "English"}.
${previousMeals ? `Do NOT repeat these meals from previous weeks:\n${previousMeals}` : ""}
Calorie split: breakfast ~${Math.round(params.calories * 0.25)} kcal, lunch ~${Math.round(params.calories * 0.35)} kcal, dinner ~${Math.round(params.calories * 0.40)} kcal.
Use common, affordable German supermarket ingredients. Keep it realistic for a ${params.diet} diet.
Return EXACTLY ${daysInThisWeek} days.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = { seeded: 0, skipped: 0, errors: [] };

    for (const params of MASTER_PARAMETER_LIST) {
      const bucketed = bucketCalories(params.calories);
      const budgetCat = getBudgetCategory(params.budget, params.days, params.people);

      for (const plan_type of PLAN_TYPES) {
        // Check if template already exists
        const existing = await base44.asServiceRole.entities.MealTemplate.filter({
          diet: params.diet,
          calories: bucketed,
          language_code: params.language_code,
          plan_type,
          budget_category: budgetCat,
        });

        if (existing && existing.length > 0) {
          results.skipped++;
          continue;
        }

        // Generate the plan
        try {
          const totalDays = params.days;
          const totalWeeks = Math.ceil(totalDays / 7);
          const weeks = [];
          let previousMeals = "";
          let daysRemaining = totalDays;

          // For "repeat" plan type, only generate 1 week
          const weeksToGenerate = plan_type === "repeat" ? 1 : totalWeeks;

          for (let w = 1; w <= weeksToGenerate; w++) {
            const daysInThisWeek = Math.min(daysRemaining, 7);
            const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: buildWeekPrompt(params, w, weeksToGenerate, daysInThisWeek, previousMeals),
              response_json_schema: weeklyPlanSchema,
            });
            const weekDays = result.days || [];
            weeks.push({ week: w, days: weekDays });
            previousMeals += `\nWeek ${w}: ` + weekDays.flatMap(d => [d.breakfast, d.lunch, d.dinner]).filter(Boolean).join(", ");
            daysRemaining -= daysInThisWeek;
          }

          await base44.asServiceRole.entities.MealTemplate.create({
            diet: params.diet,
            calories: bucketed,
            people: params.people,
            days: params.days,
            budget_category: budgetCat,
            language_code: params.language_code,
            plan_data: { weeks },
            plan_type,
            use_count: 0,
          });

          results.seeded++;
        } catch (err) {
          results.errors.push(`${params.diet}/${bucketed}/${plan_type}: ${err.message}`);
        }
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});