// Central model used for ALL grocery-list generation tasks.
// Determined by the admin A/B benchmark (src/pages/ABTest.jsx) which ranks
// OpenRouter candidates by grocery-list quality vs. live token cost.
//
// To change the grocery model, update ONLY this constant. Every grocery-list
// generation entry point (generateGroceries, PlanBuilder grocery list) reads it.
// Meal-plan generation, recipes, nutrition and other AI tasks are unaffected.
export const GROCERY_MODEL = "google/gemini-2.5-flash";