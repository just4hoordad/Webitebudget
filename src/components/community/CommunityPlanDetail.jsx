import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Leaf, Wallet, Calendar, Users, ShoppingBasket, Loader2, ChefHat, Utensils } from "lucide-react";
import CommunityRecipeCard from "@/components/community/CommunityRecipeCard";

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

function mealName(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join(", ");
  return val.name || "";
}

function mealCal(day, type) {
  return day[`${type}_calories`] ?? (day[type] && typeof day[type] === "object" ? day[type].calories : null);
}

function mealIngs(day, type) {
  const ings = day[`${type}_ingredients`];
  if (Array.isArray(ings)) return ings;
  if (day[type] && Array.isArray(day[type].ingredients)) return day[type].ingredients;
  return [];
}

function getDays(plan) {
  if (Array.isArray(plan)) return plan;
  if (plan?.weeks && Array.isArray(plan.weeks)) {
    return plan.weeks.flatMap((w) => w.days || []);
  }
  return [];
}

export default function CommunityPlanDetail({ planId, open, onClose }) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !planId) return;
    setLoading(true);
    setError("");
    base44.functions
      .invoke("getCommunityPlans", { planId })
      .then((res) => {
        setDetail(res.data);
      })
      .catch((e) => {
        setError(e?.data?.error || (t("loadError") || "Failed to load plan"));
      })
      .finally(() => setLoading(false));
  }, [open, planId]);

  const plan = detail?.plan;
  const days = plan ? getDays(plan.plan) : [];
  const recipes = (plan && plan.recipes && typeof plan.recipes === "object" && !Array.isArray(plan.recipes)) ? plan.recipes : {};
  const recipeEntries = Object.entries(recipes).filter(([, v]) => v && (v.mealName || v.recipe));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{plan?.name || (t("communityTitle") || "Community plan")}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-destructive">{error}</div>
        ) : plan ? (
          <div className="space-y-5">
            {/* Owner + meta */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{detail.ownerDisplayName}</span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs font-semibold">
                <Leaf className="h-3 w-3" />{plan.diet}
              </span>
              {plan.budget != null && <span className="flex items-center gap-1"><Wallet className="h-4 w-4" />€{Number(plan.budget).toFixed(2)}</span>}
              {plan.days != null && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{plan.days} {t("days") || "days"}</span>}
              {plan.calories != null && <span>{plan.calories} kcal/day</span>}
              {plan.people != null && <span>{plan.people} {t("personS") || "person(s)"}</span>}
            </div>
            {plan.stores && (
              <p className="text-xs text-muted-foreground"><strong>{t("stores") || "Stores"}:</strong> {plan.stores}</p>
            )}

            {/* Grocery list */}
            {plan.groceryList?.categories?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4 text-primary" />
                  {t("yourGroceryList") || "Grocery list"}
                  <span className="text-xs text-muted-foreground font-normal">· €{plan.groceryList.total_estimated_cost?.toFixed?.(2) ?? Number(plan.groceryList.total_estimated_cost || 0).toFixed(2)}</span>
                </h3>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {plan.groceryList.categories.map((cat, ci) => (
                    <div key={ci} className="bg-card">
                      <div className="bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {cat.name} · {cat.items?.length || 0} {t("items") || "items"}
                      </div>
                      {cat.items?.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between px-3 py-1.5 text-sm border-t border-border">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} · {item.store}</p>
                          </div>
                          <span className="font-semibold text-foreground shrink-0 ml-2">€{Number(item.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal plan — full days with meals, calories and ingredients */}
            {days.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  {t("yourWeeklyMealPlan") || "Meal plan"}
                </h3>
                <div className="space-y-2">
                  {days.map((day, di) => {
                    const meals = MEAL_TYPES.map((type) => ({
                      type,
                      name: mealName(day[type]),
                      cal: mealCal(day, type),
                      ings: mealIngs(day, type),
                    })).filter((m) => m.name);
                    if (meals.length === 0) return null;
                    return (
                      <div key={di} className="bba-t bg-card p-3 space-y-2">
                        <span className="text-[11px] font-heading font-bold uppercase tracking-wide text-muted-foreground">
                          {t("day") || "Day"} {di + 1}
                        </span>
                        {meals.map((m, mi) => (
                          <div key={mi} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-primary bg-primary/15 rounded px-1.5 py-0.5 leading-none shrink-0">
                                {t(m.type) || m.type}
                              </span>
                              <p className="text-sm font-medium text-foreground leading-tight flex-1 min-w-0">{m.name}</p>
                              {m.cal != null && (
                                <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded px-1.5 py-0.5 leading-none shrink-0">
                                  {m.cal} kcal
                                </span>
                              )}
                            </div>
                            {m.ings.length > 0 && (
                              <p className="text-[11px] text-muted-foreground leading-snug pl-1">
                                {m.ings.map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`).join(" · ")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cooking recipes */}
            {recipeEntries.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-primary" />
                  {t("recipesTitle") || "Recipes"}
                  <span className="text-xs text-muted-foreground font-normal">· {recipeEntries.length}</span>
                </h3>
                <div className="space-y-3">
                  {recipeEntries.map(([key, entry]) => (
                    <CommunityRecipeCard key={key} entry={entry} />
                  ))}
                </div>
              </div>
            )}

            {days.length === 0 && recipeEntries.length === 0 && !plan.groceryList?.categories?.length && (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t("communityEmptyDetail") || "No plan details available."}
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}