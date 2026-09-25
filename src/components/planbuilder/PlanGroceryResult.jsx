import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { categoryTranslations } from "@/lib/translations";
import { euCategoryTranslations } from "@/lib/translations_eu";
import { ArrowLeft, RefreshCw, ShoppingBasket, Store, ChefHat, Loader2, Clock, Lock } from "lucide-react";
import RecipeModal from "@/components/RecipeModal";
import { AnimatePresence } from "framer-motion";

const allCategoryTranslations = { ...categoryTranslations, ...euCategoryTranslations };

const MEAL_SLOTS = [
  { key: "breakfast", labelKey: "breakfast" },
  { key: "lunch", labelKey: "lunch" },
  { key: "dinner", labelKey: "dinner" },
];

export default function PlanGroceryResult({ grocery, prep, days, people, diet, onReset, readOnly, footer }) {
  const { t, currentLanguage } = useLanguage();
  const { isPro, openPricing } = useMonetization();
  const [recipes, setRecipes] = useState({});
  const [recipeTarget, setRecipeTarget] = useState(null);
  const total = grocery.total_estimated_cost || 0;

  const recipeKey = (dayIdx, mealType) => `${dayIdx}:${mealType}`;
  const handleRecipe = (dayIdx, mealType, mealName) => {
    if (!isPro) { openPricing?.(); return; }
    setRecipeTarget({ dayIdx, mealType, meal: { name: mealName, mealType, ingredients: [] } });
  };
  const cacheRecipe = (dayIdx, mealType, entry) =>
    setRecipes((prev) => ({ ...prev, [recipeKey(dayIdx, mealType)]: entry }));
  const catMap = allCategoryTranslations[currentLanguage.code] || {};
  const trCat = (name) => catMap[name] || name;

  // Latest price observation across all grocery items (ISO YYYY-MM-DD).
  const allDates = (grocery.categories || [])
    .flatMap((c) => c.items || [])
    .map((i) => i.fetched_date)
    .filter(Boolean)
    .sort();
  const lastUpdated = grocery.lastUpdated || allDates[allDates.length - 1] || new Date().toISOString().slice(0, 10);
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(currentLanguage.code || "en", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="space-y-5">
      {!readOnly && (
        <button onClick={onReset} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
      )}

      <div className="rounded-2xl bg-dark p-6 text-dark-foreground">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <ShoppingBasket className="h-4 w-4" /> {t("planGroceryTitle")}
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="font-heading font-bold text-3xl text-primary">€{total.toFixed(2)}</span>
          <span className="text-sm text-dark-muted">/ {days} {t("days")} · {people} {people === 1 ? t("person") : t("people")}</span>
        </div>
        {lastUpdatedLabel && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-dark-muted">
            <Clock className="h-3 w-3" />
            <span>{t("pricesLastUpdated") || "Prices last updated"} {lastUpdatedLabel}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground px-1 -mt-2">{t("priceEstimateNote")}</p>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Grocery list */}
        <div className="space-y-4">
          {grocery.categories?.map((cat) => (
            <div key={cat.name} className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/40">
                <h3 className="font-heading font-semibold text-sm uppercase tracking-wide">{trCat(cat.name)}</h3>
              </div>
              <div className="divide-y divide-border">
                {cat.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{item.quantity}</span>
                        {item.store && <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {item.store}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-sm">€{(item.price || 0).toFixed(2)}</p>
                      {item.normal_price && item.normal_price > item.price && (
                        <p className="text-xs text-muted-foreground line-through">€{item.normal_price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Prep guide */}
        <div className="space-y-3 lg:sticky lg:top-20">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <ChefHat className="h-4 w-4" /> {t("planPrepTitle")}
          </div>
          <p className="text-xs text-muted-foreground">{t("planPrepSubtitle")}</p>
          {!prep ? (
            <div className="border border-dashed border-border rounded-2xl p-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("planPrepLoading")}
            </div>
          ) : (
            <div className="space-y-3">
              {prep.days?.map((d, i) => {
                const meals = MEAL_SLOTS.map((s) => ({ ...s, data: d[s.key] })).filter((s) => s.data && s.data.meal);
                if (!meals.length) return null;
                return (
                  <div key={i} className="border border-border rounded-2xl bg-card p-4">
                    <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">
                      {t("day") || "Day"} {i + 1}
                    </h4>
                    <div className="space-y-3">
                      {meals.map((s) => (
                        <div key={s.key} className="border-t border-border pt-2 first:border-0 first:pt-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground flex-1 min-w-0">{s.data.meal}</p>
                            <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
                              {t(s.labelKey)}
                            </span>
                            <button
                              onClick={() => handleRecipe(i, s.key, s.data.meal)}
                              className="relative text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10 shrink-0"
                              title={isPro ? (t("recipe") || "Recipe") : (t("recipePro") || "Recipe — Pro")}
                            >
                              <ChefHat className="h-3.5 w-3.5" />
                              {!isPro && (
                                <Lock className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-foreground bg-card rounded-full p-0.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{t("portionLabel")}:</span> {s.data.portion}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{s.data.prep}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <button onClick={onReset} className="w-full h-12 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" /> {t("regenerate") || "Regenerate"}
        </button>
      )}
      {footer}

      <AnimatePresence>
        {recipeTarget && (
          <RecipeModal
            meal={recipeTarget.meal}
            diet={diet || ""}
            people={people}
            initialRecipe={recipes[recipeKey(recipeTarget.dayIdx, recipeTarget.mealType)]}
            onCache={(entry) => cacheRecipe(recipeTarget.dayIdx, recipeTarget.mealType, entry)}
            onClose={() => setRecipeTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}