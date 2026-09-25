import { useState, useEffect, useRef } from "react";
import { X, ChefHat, Clock, Users, ListOrdered, Loader2, Snowflake, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "sonner";

// On-demand cooking recipe for a single meal. Pro-only — the parent only
// renders this for Pro users; free users get the Pro upsell instead.
// Generated recipes are reported back via onCache so the parent persists
// them with the meal plan (no re-generation on re-open).

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    prep_time: { type: "number", description: "prep time in minutes" },
    cook_time: { type: "number", description: "cook time in minutes" },
    servings: { type: "number" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, quantity: { type: "string" } },
      },
    },
    steps: { type: "array", items: { type: "string" } },
  },
};

export default function RecipeModal({ meal, diet, people, initialRecipe, onCache, onClose }) {
  const { t, currentLanguage } = useLanguage();
  const [recipe, setRecipe] = useState(
    initialRecipe && initialRecipe.mealName === meal.name ? initialRecipe.recipe : null
  );
  const [loading, setLoading] = useState(!recipe);
  const reported = useRef(false);
  const isFrozen = diet === "frozen";

  const ingredientList = Array.isArray(meal.ingredients)
    ? meal.ingredients.map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`).join(", ")
    : "";

  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Write a complete, practical cooking recipe for this meal: "${meal.name}".

Return ALL text (title, ingredient names, step instructions) in ${currentLanguage.label} language.

These are the ingredients planned for this meal (from the grocery list): ${ingredientList || "not specified"}.
Diet type: ${diet}
Number of servings to prepare: ${people || 1}

Provide:
- A short recipe title
- prep_time in minutes
- cook_time in minutes
- servings
- An ingredients array with {name, quantity} for the recipe (use the planned ingredients; add basic pantry staples like salt/oil/pepper only if essential)
- A steps array of clear, ordered cooking instructions (numbered naturally in the text)

Keep the steps concise and actionable. Do not include the meal's calorie count.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: RECIPE_SCHEMA,
      });
      setRecipe(result);
      if (!reported.current) {
        reported.current = true;
        onCache({ mealName: meal.name, recipe: result });
      }
    } catch (e) {
      toast.error(t("recipeError") || "Couldn't generate the recipe. Try again.");
      onClose();
    }
  };

  useEffect(() => {
    if (isFrozen) return; // frozen meals show a reheat note, no LLM call
    if (!recipe) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mealTypeLabel =
    meal.mealType === "breakfast" ? "🌅" : meal.mealType === "lunch" ? "☀️" : "🌙";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-16 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: "80vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wide flex items-center gap-1">
              <ChefHat className="h-3.5 w-3.5" /> {mealTypeLabel} {t("recipe") || "Recipe"}
            </p>
            <h2 className="font-heading font-bold text-foreground mt-0.5 line-clamp-2">{meal.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {isFrozen ? (
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Snowflake className="h-7 w-7 text-blue-500" />
              </div>
              <p className="font-heading font-semibold text-foreground">{t("readyToHeat") || "Ready-to-heat product"}</p>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {t("reheatNote") || "This is a frozen ready-to-heat meal — just follow the heating instructions on the packaging."}
              </p>
              {meal.name && (
                <p className="text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">{meal.name}</p>
              )}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{t("recipeGenerating") || "Generating your recipe…"}</p>
            </div>
          ) : recipe ? (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <Stat icon={Clock} label={t("prepTime") || "Prep"} value={recipe.prep_time != null ? `${recipe.prep_time} min` : "—"} />
                <Stat icon={Clock} label={t("cookTime") || "Cook"} value={recipe.cook_time != null ? `${recipe.cook_time} min` : "—"} />
                <Stat icon={Users} label={t("servings") || "Serves"} value={recipe.servings || people || 1} />
              </div>

              {/* Ingredients */}
              {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
                    <ListOrdered className="h-4 w-4 text-primary" /> {t("ingredients") || "Ingredients"}
                  </h3>
                  <ul className="space-y-1.5">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex justify-between gap-3 text-sm border-b border-border/60 pb-1.5">
                        <span className="text-foreground">{ing.name}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-xs">{ing.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-2">{t("steps") || "Steps"}</h3>
                  <ol className="space-y-2.5">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground/90 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {(!Array.isArray(recipe.steps) || recipe.steps.length === 0) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{t("recipeIncomplete") || "The recipe came back incomplete — try regenerating."}</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="bg-card border-t border-border px-5 py-4 pb-6 flex shrink-0">
          <button
            onClick={onClose}
            className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-muted/40 rounded-lg px-2.5 py-2 text-center">
      <Icon className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-heading font-bold text-foreground leading-none mt-0.5">{value}</p>
    </div>
  );
}