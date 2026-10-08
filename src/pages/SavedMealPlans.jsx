import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Leaf, BarChart2, ShoppingBasket, ChevronDown, ChevronUp, CalendarPlus, Check, Loader2, LogIn, Link2, Unlink, FileSpreadsheet, Share2, CheckCircle2, Circle, ChefHat, Lock } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import SharePlanModal from "@/components/planbuilder/SharePlanModal";
import RecipeModal from "@/components/RecipeModal";

function RecipeBtn({ onClick }) {
  const { t } = useLanguage();
  const { isPro } = useMonetization();
  return (
    <button
      onClick={onClick}
      className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-md transition-colors"
      title={isPro ? t("recipe") : t("recipePro")}
    >
      <ChefHat className="h-3 w-3" />
      {t("recipe")}
      {!isPro && <Lock className="h-2.5 w-2.5 text-foreground/70" />}
    </button>
  );
}

export default function SavedMealPlans() {
  const { t } = useLanguage();
  const { isPro, openPricing } = useMonetization();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGrocery, setExpandedGrocery] = useState({});
  const [expandedDay, setExpandedDay] = useState({}); // `${planId}:${dayKey}` -> bool
  const [sharePlan, setSharePlan] = useState(null);
  const [recipeTarget, setRecipeTarget] = useState(null);

  const toggleDay = (planId, dayKey) =>
    setExpandedDay((prev) => ({ ...prev, [`${planId}:${dayKey}`]: !prev[`${planId}:${dayKey}`] }));
  const [boughtItems, setBoughtItems] = useState(() => {
    try {
      const raw = localStorage.getItem("bb_bought_saved");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const toggleBought = (key) => {
    setBoughtItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("bb_bought_saved", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };
  const location = useLocation();
  const cal = useGoogleCalendarSync();

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

  // Normalizes the many stored meal shapes into a plain meal name string.
  const mealName = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) return val.map((x) => (x && typeof x === "object" ? x.name : x)).filter((n) => n && String(n).trim()).join(", ");
    return String(val).trim();
  };

  const handleRecipe = (plan, dayIdx, mealType, mealNameStr, weekIdx = 0) => {
    if (!isPro) { openPricing?.(); return; }
    if (!mealNameStr) return;
    const key = `${weekIdx}:${dayIdx}:${mealType}`;
    const cached = plan.recipes?.[key];
    setRecipeTarget({
      planId: plan.id,
      plan,
      dayIdx,
      mealType,
      weekIdx,
      key,
      meal: { name: mealNameStr, mealType, ingredients: [] },
      initialRecipe: cached && cached.mealName === mealNameStr ? cached : null,
    });
  };

  const cacheRecipe = async (entry) => {
    if (!recipeTarget) return;
    const plan = recipeTarget.plan;
    if (!plan) return;
    const next = { ...(plan.recipes || {}), [recipeTarget.key]: entry };
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, recipes: next } : p));
    try { await base44.entities.MealPlan.update(plan.id, { recipes: next }); } catch { /* offline cache ok */ }
  };

  const exportToSheets = (plan) => {
    const rows = [["Category", "Item", "Quantity", "Price (EUR)", "Store", "Calories Info"]];
    let total = 0;
    plan.groceryList?.categories?.forEach((cat) => {
      cat.items?.forEach((item) => {
        rows.push([cat.name, item.name, item.quantity, (item.price || 0).toFixed(2), item.store || "", item.calories_info || ""]);
        total += item.price || 0;
      });
    });
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "TOTAL", "", total.toFixed(2), "", ""]);
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(plan.name || "meal-plan").replace(/[^a-z0-9]+/gi, "_")}_grocery.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PullToRefresh onRefresh={loadPlans}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("savedMealPlans")}</h1>
          <p className="text-sm text-muted-foreground">{t("viewManage")}</p>
        </div>

        {/* Google Calendar sync */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-sm text-foreground">{t("calendarSync") || "Google Calendar sync"}</p>
              <p className="text-xs text-muted-foreground truncate">
                {cal.status === "loading" ? (t("loading") || "Loading…") :
                 cal.status === "unauthenticated" ? (t("calLoginNeeded") || "Log in to sync your meal plan to your calendar") :
                 cal.status === "connected" ? (t("calConnected") || "Connected — sync a plan to see what you're cooking each day") :
                 (t("calNotConnected") || "Connect Google Calendar to sync your plans")}
              </p>
              {cal.error && <p className="text-xs text-destructive truncate mt-0.5">{cal.error}</p>}
            </div>
          </div>
          <div className="shrink-0">
            {cal.status === "loading" ? null :
             cal.status === "unauthenticated" ? (
               <Button size="sm" variant="outline" onClick={cal.login}><LogIn className="h-4 w-4" />{t("login") || "Log in"}</Button>
             ) : cal.status === "connected" ? (
               <Button size="sm" variant="outline" onClick={cal.disconnect}><Unlink className="h-4 w-4" />{t("disconnect") || "Disconnect"}</Button>
             ) : (
               <Button size="sm" onClick={cal.connect}><Link2 className="h-4 w-4" />{t("connectCalendar") || "Connect"}</Button>
             )}
          </div>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold text-foreground break-words">{plan.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Leaf className="h-4 w-4" />
                        {plan.diet}
                      </span>
                      {plan.budget != null && <span>€{plan.budget?.toFixed(2)}{t("budgetPerMonth")}</span>}
                      {plan.calories != null && <span>{plan.calories} kcal/day</span>}
                      {plan.days != null && <span>{plan.days} {t("days")}</span>}
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
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => setSharePlan(plan)}
                      className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      title={t("sharePlan") || "Share plan"}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {t("share") || "Share"}
                    </button>
                    <button
                      onClick={() => exportToSheets(plan)}
                      className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      title={t("exportToSheets") || "Export to Google Sheets"}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      {t("export") || "Export"}
                    </button>
                    {plan.budget != null && (
                      <Link to={`/nutrition?budget=${plan.budget}&stores=${encodeURIComponent(plan.stores || "")}&diet=${plan.diet}&people=${plan.people}&calories=${plan.calories}`}>
                        <button className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors" title={t("viewNutrition")}>
                          <BarChart2 className="h-3.5 w-3.5" />
                          {t("nutrition")}
                        </button>
                      </Link>
                    )}
                    {cal.status === "connected" && (
                      <button
                        onClick={() => { cal.sync(plan.id).catch(() => {}); }}
                        disabled={cal.syncingId === plan.id}
                        className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        title={t("syncToCalendar") || "Sync to Google Calendar"}
                      >
                        {cal.syncingId === plan.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                         cal.syncedIds.has(plan.id) ? <Check className="h-3.5 w-3.5" /> :
                         <CalendarPlus className="h-3.5 w-3.5" />}
                        {cal.syncingId === plan.id ? (t("syncing") || "Syncing…") :
                         cal.syncedIds.has(plan.id) ? (t("synced") || "Synced") :
                         (t("syncToCalendar") || "Sync")}
                      </button>
                    )}
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                      title={t("deletePlan")}
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
                            {cat.items?.map((item, i) => {
                              const bKey = `${plan.id}::${cat.name}::${item.name}`;
                              const bought = boughtItems.has(bKey);
                              return (
                                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <button onClick={() => toggleBought(bKey)} className="shrink-0" title={t("markBought")} aria-label={t("markBought")}>
                                      {bought ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
                                    </button>
                                    <div className="min-w-0">
                                      <p className={`font-medium ${bought ? "text-muted-foreground line-through opacity-60" : "text-foreground"}`}>{item.name}</p>
                                      <p className="text-xs text-muted-foreground">{item.quantity} · {item.store}</p>
                                    </div>
                                  </div>
                                  <p className={`font-semibold ${bought ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>€{item.price?.toFixed(2)}</p>
                                </div>
                              );
                            })}
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
                      {plan.plan.map((day, idx) => {
                        const dayKey = `a:${idx}`;
                        const dayPrep = plan.prep?.days?.[idx];
                        const isOpen = !!expandedDay[`${plan.id}:${dayKey}`];
                        const summary = ["breakfast", "lunch", "dinner"]
                          .map((type) => mealName(day[type]))
                          .filter(Boolean)
                          .join(" · ");
                        const cell = (type, val) => {
                          const name = mealName(val);
                          return (
                            <div>
                              <span className="block text-[10px] uppercase text-muted-foreground mb-0.5">{t(type)}</span>
                              <span className="text-foreground">{name || "—"}</span>
                              {dayPrep?.[type]?.portion && (
                                <span className="block text-[10px] text-primary mt-0.5">🍽 {dayPrep[type].portion}</span>
                              )}
                              {name && (
                                <button
                                  onClick={() => handleRecipe(plan, idx, type, name)}
                                  className="relative mt-1 inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded-md transition-colors"
                                  title={isPro ? t("recipe") : t("recipePro")}
                                >
                                  <ChefHat className="h-3 w-3" />
                                  {t("recipe")}
                                  {!isPro && <Lock className="h-2.5 w-2.5 text-foreground/70" />}
                                </button>
                              )}
                            </div>
                          );
                        };
                        return (
                          <div key={idx}>
                            <button
                              onClick={() => toggleDay(plan.id, dayKey)}
                              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-foreground text-xs">{t("day") || "Day"} {idx + 1}</span>
                                {summary && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{summary}</p>}
                              </div>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-3 pt-1 text-sm">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  {cell("breakfast", day.breakfast)}
                                  {cell("lunch", day.lunch)}
                                  {cell("dinner", day.dinner)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                      {week.days?.map((day, idx) => {
                        const dayKey = `w:${weekIdx}:${idx}`;
                        const isOpen = !!expandedDay[`${plan.id}:${dayKey}`];
                        const summary = ["breakfast", "lunch", "dinner"]
                          .map((type) => mealName(day[type]))
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <div key={idx}>
                            <button
                              onClick={() => toggleDay(plan.id, dayKey)}
                              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-foreground text-xs">{day.day}</span>
                                {summary && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{summary}</p>}
                              </div>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-3 pt-1 grid grid-cols-4 gap-3 text-sm items-start">
                                <div className="text-muted-foreground col-span-4 sm:col-span-1">
                                  <span className="font-medium text-foreground block text-xs mb-0.5">{t("breakfast")} {day.breakfast_calories && <span className="text-primary">({day.breakfast_calories} kcal)</span>}</span>
                                  <span>{day.breakfast}</span>
                                  {Array.isArray(day.breakfast_ingredients) && day.breakfast_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.breakfast_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                                  {mealName(day.breakfast) && <RecipeBtn onClick={() => handleRecipe(plan, idx, "breakfast", mealName(day.breakfast), weekIdx)} />}
                                </div>
                                <div className="text-muted-foreground col-span-4 sm:col-span-1">
                                  <span className="font-medium text-foreground block text-xs mb-0.5">{t("lunch")} {day.lunch_calories && <span className="text-primary">({day.lunch_calories} kcal)</span>}</span>
                                  <span>{day.lunch}</span>
                                  {Array.isArray(day.lunch_ingredients) && day.lunch_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.lunch_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                                  {mealName(day.lunch) && <RecipeBtn onClick={() => handleRecipe(plan, idx, "lunch", mealName(day.lunch), weekIdx)} />}
                                </div>
                                <div className="text-muted-foreground col-span-4 sm:col-span-1">
                                  <span className="font-medium text-foreground block text-xs mb-0.5">{t("dinner")} {day.dinner_calories && <span className="text-primary">({day.dinner_calories} kcal)</span>}</span>
                                  <span>{day.dinner}</span>
                                  {Array.isArray(day.dinner_ingredients) && day.dinner_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.dinner_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                                  {mealName(day.dinner) && <RecipeBtn onClick={() => handleRecipe(plan, idx, "dinner", mealName(day.dinner), weekIdx)} />}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <SharePlanModal plan={sharePlan} open={!!sharePlan} onClose={() => setSharePlan(null)} />
      {recipeTarget && (
        <RecipeModal
          meal={recipeTarget.meal}
          diet={recipeTarget.plan.diet || "balanced"}
          people={recipeTarget.plan.people || 1}
          initialRecipe={recipeTarget.initialRecipe}
          onCache={cacheRecipe}
          onClose={() => setRecipeTarget(null)}
        />
      )}
    </PullToRefresh>
  );
}