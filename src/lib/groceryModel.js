// Central model used for ALL grocery-list generation tasks.
// Determined by the admin A/B benchmark (src/pages/ABTest.jsx) which ranks
// OpenRouter candidates by grocery-list quality vs. live token cost.
// DeepSeek V4.1 Flash won the live benchmark across grocery-list, meal-plan,
// recipe and grocery-assistance scenarios — it is now the primary model for
// every user-facing AI task.
//
// To change the grocery model, update ONLY this constant. Every grocery-list
// generation entry point (generateGroceries, PlanBuilder grocery list) reads it.
// Meal-plan generation, recipes, nutrition and other AI tasks are unaffected.
export const GROCERY_MODEL = "deepseek/deepseek-v4.1-flash";