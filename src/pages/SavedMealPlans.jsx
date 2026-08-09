import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Leaf, BarChart2, ShoppingBasket, ChevronDown, ChevronUp } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

export default function SavedMealPlans() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGrocery, setExpandedGrocery] = useState({});
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/saved-plans") loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const loadPlans = async () => {
    try {
      const mealPlans = await base44.entities.MealPlan.list();
      setPlans(mealPlans);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm(t("deletePlanConfirm"))) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    await base44.entities.MealPlan.delete(id);
  };

  return (
    <PullToRefresh onRefresh={loadPlans}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("savedMealPlans")}</h1>
          <p className="text-sm text-muted-foreground">{t("viewManage")}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
        ) : plans.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <p className="text-muted-foreground">{t("noPlans")}</p>
            <Link to="/">
              <Button>{t("createFirst")}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground">{plan.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Leaf className="h-4 w-4" />
                        {plan.diet}
                      </span>
                      {plan.budget != null && <span>€{plan.budget?.toFixed(2)}{t("budgetPerMonth")}</span>}
                      {plan.calories != null && <span>{plan.calories} kcal/day</span>}
                      {plan.people != null && <span>{plan.people} {t("personS")}</span>}
                      {plan.macros && (
                        <span className="flex items-center gap-1.5">
                          <span>🥩 {plan.macros.protein}%</span>
                          <span>🍞 {plan.macros.carbs}%</span>
                          <span>🥑 {plan.macros.fats}%</span>
                        </span>
                      )}
                    </div>
                    {plan.stores && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>{t("stores")}:</strong> {plan.stores}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(plan.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.budget != null && (
                      <Link to={`/nutrition?budget=${plan.budget}&stores=${encodeURIComponent(plan.stores || "")}&diet=${plan.diet}&people=${plan.people}&calories=${plan.calories}`}>
                        <button className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors" title="View nutrition">
                          <BarChart2 className="h-3.5 w-3.5" />
                          {t("nutrition")}
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                      title="Delete plan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Grocery List */}
                {plan.groceryList?.categories && (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedGrocery(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                      className="w-full flex items-center justify-between bg-secondary px-4 py-3 hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBasket className="h-4 w-4 text-primary" />
                        <span className="font-heading font-semibold text-sm text-secondary-foreground">{t("yourGroceryList")}</span>
                        <span className="text-xs text-muted-foreground">· €{plan.groceryList.total_estimated_cost?.toFixed(2)}</span>
                      </div>
                      {expandedGrocery[plan.id] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedGrocery[plan.id] && (
                      <div className="divide-y divide-border">
                        {plan.groceryList.categories.map((cat) => (
                          <div key={cat.name}>
                            <div className="bg-muted px-4 py-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.name}</p>
                            </div>
                            {cat.items?.map((item, i) => (
                              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                                <div>
                                  <p className="font-medium text-foreground">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.quantity} · {item.store}</p>
                                </div>
                                <p className="font-semibold text-foreground">€{item.price?.toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {Array.isArray(plan.plan) ? (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-primary px-5 py-3">
                      <h3 className="font-heading font-semibold text-primary-foreground">{plan.plan.length}-{t("days")}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {plan.plan.map((day, idx) => (
                        <div key={idx} className="px-5 py-3 text-sm">
                          <div className="font-semibold text-foreground text-xs mb-1.5">{t("day") || "Day"} {idx + 1}</div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="block text-[10px] uppercase text-muted-foreground mb-0.5">{t("breakfast")}</span><span className="text-foreground">{day.breakfast || "—"}</span></div>
                            <div><span className="block text-[10px] uppercase text-muted-foreground mb-0.5">{t("lunch")}</span><span className="text-foreground">{day.lunch || "—"}</span></div>
                            <div><span className="block text-[10px] uppercase text-muted-foreground mb-0.5">{t("dinner")}</span><span className="text-foreground">{day.dinner || "—"}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : plan.plan?.weeks && plan.plan.weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-primary px-5 py-3">
                      <h3 className="font-heading font-semibold text-primary-foreground">
                        {plan.plan.weeks.length > 1 ? `Week ${week.week}` : t("sevenDayPlan")}
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {week.days?.map((day, idx) => (
                        <div key={idx} className="px-5 py-4 grid grid-cols-4 gap-3 text-sm items-start">
                          <div className="font-semibold text-foreground col-span-4 border-b border-border pb-1 mb-1">{day.day}</div>
                          <div className="text-muted-foreground col-span-4 sm:col-span-1">
                            <span className="font-medium text-foreground block text-xs mb-0.5">{t("breakfast")} {day.breakfast_calories && <span className="text-primary">({day.breakfast_calories} kcal)</span>}</span>
                            <span>{day.breakfast}</span>
                            {Array.isArray(day.breakfast_ingredients) && day.breakfast_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.breakfast_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                          </div>
                          <div className="text-muted-foreground col-span-4 sm:col-span-1">
                            <span className="font-medium text-foreground block text-xs mb-0.5">{t("lunch")} {day.lunch_calories && <span className="text-primary">({day.lunch_calories} kcal)</span>}</span>
                            <span>{day.lunch}</span>
                            {Array.isArray(day.lunch_ingredients) && day.lunch_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.lunch_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                          </div>
                          <div className="text-muted-foreground col-span-4 sm:col-span-1">
                            <span className="font-medium text-foreground block text-xs mb-0.5">{t("dinner")} {day.dinner_calories && <span className="text-primary">({day.dinner_calories} kcal)</span>}</span>
                            <span>{day.dinner}</span>
                            {Array.isArray(day.dinner_ingredients) && day.dinner_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.dinner_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}