import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Wallet, Flame, Users, Target, RefreshCw, CalendarDays, ShoppingBasket, AlertCircle } from "lucide-react";
import { REASSURANCE_STR } from "@/components/ReassuranceRecap";
import GeneratingLoader from "@/components/GeneratingLoader";
import GroceryItemRow from "@/components/GroceryItemRow";
import { categoryTranslations } from "@/lib/translations";
import { euCategoryTranslations } from "@/lib/translations_eu";
import { groceryParamsFromSearch, grocerySignature, getCachedGroceries, setCachedGroceries, runGroceryGeneration } from "@/lib/generateGroceries";
import { toast } from "sonner";

const allCategoryTranslations = { ...categoryTranslations, ...euCategoryTranslations };
const GOAL_NAME = { lose: "loseWeight", maintain: "maintain", gain: "gainWeight", muscle: "buildMuscle" };

export default function PlanReview() {
  const { t, currentLanguage } = useLanguage();
  const { guarded } = useMonetization();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  const budget = parseFloat(params.get("budget") || "150");
  const days = parseInt(params.get("days") || "30", 10);
  const people = parseInt(params.get("people") || "1", 10);
  const calories = parseInt(params.get("calories") || "2000", 10);
  const goal = params.get("goal") || "maintain";
  const stores = params.get("stores") || "aldi,lidl";

  const goalLabel = t(GOAL_NAME[goal] || "maintain");
  const recap = REASSURANCE_STR[currentLanguage.code] || REASSURANCE_STR.en;

  const [planStyle, setPlanStyle] = useState(params.get("planStyle") === "unique" ? "unique" : "repeat");
  const [groceries, setGroceries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const translateCategory = (en) => (allCategoryTranslations[currentLanguage.code] || {})[en] || en;

  useEffect(() => {
    const p = groceryParamsFromSearch(window.location.search);
    const sig = grocerySignature(p, currentLanguage.code);
    const cached = getCachedGroceries(sig);
    if (cached) { setGroceries(cached); setLoading(false); return; }
    setLoading(true);
    setError(false);
    guarded(async () => {
      try {
        const res = await runGroceryGeneration(p, currentLanguage.label);
        setCachedGroceries(sig, res);
        setGroceries(res);
      } catch (e) {
        setError(true);
        toast.error("Failed to generate grocery list. Please try again.");
      } finally {
        setLoading(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage.code]);

  const cards = [
    { icon: Wallet, value: `€${budget.toFixed(0)}` },
    { icon: Flame, value: `${calories} kcal` },
    { icon: Users, value: `${people} ${t("personS")}` },
    { icon: Target, value: goalLabel },
  ];

  const total = groceries?.categories?.flatMap((c) => c.items || []).reduce((s, i) => s + (i.price || 0), 0) || 0;

  const confirm = () => {
    const u = new URLSearchParams(window.location.search);
    u.set("planStyle", planStyle);
    navigate(`/meal-plan?${u.toString()}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors -ml-1"
      >
        <ArrowLeft className="h-4 w-4" /> {t("reviewBack") || "Back to edit"}
      </button>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("reviewTitle") || "Confirm your plan"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("reviewSubtitle") || "Here's exactly what we'll create for you."}</p>
      </div>

      {/* Param summary — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-3.5">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading font-semibold text-foreground text-base sm:text-lg leading-tight">{c.value}</span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{recap.body}</p>

      {/* Grocery list preview — price-forward tiles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5 text-primary" />
            {t("yourGroceryList")}
          </h2>
          {!loading && groceries && (
            <span className="font-heading text-xl font-bold text-primary">€{total.toFixed(2)}</span>
          )}
        </div>

        {loading ? (
          <GeneratingLoader type="grocery" />
        ) : error ? (
          <div className="bg-destructive/5 border border-destructive/30 rounded-2xl p-5 text-center">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Could not generate your grocery list.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const p = groceryParamsFromSearch(window.location.search);
                const sig = grocerySignature(p, currentLanguage.code);
                setLoading(true); setError(false);
                guarded(async () => {
                  try {
                    const res = await runGroceryGeneration(p, currentLanguage.label);
                    setCachedGroceries(sig, res);
                    setGroceries(res);
                  } catch (e) { setError(true); toast.error("Failed to generate grocery list. Please try again."); }
                  finally { setLoading(false); }
                });
              }}
            >
              {t("regenerate")}
            </Button>
          </div>
        ) : groceries?.categories?.map((cat) => (
          <div key={cat.name} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="bg-secondary px-5 py-2.5">
              <h3 className="font-heading font-semibold text-xs uppercase tracking-wide text-secondary-foreground">
                {translateCategory(cat.name)}
              </h3>
            </div>
            <div className="divide-y divide-border">
              {cat.items?.map((item, i) => (
                <GroceryItemRow
                  key={i}
                  item={item}
                  categoryName={cat.name}
                  stores={stores}
                  readOnly
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Plan style selection */}
      <div className="pt-2">
        <h2 className="font-heading text-xl font-bold text-foreground">{t("weeklyPlanTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("weeklyPlanSubtitle")}</p>

        <div className="mt-4 space-y-3">
          <button
            onClick={() => setPlanStyle("repeat")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all ${
              planStyle === "repeat"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${planStyle === "repeat" ? "bg-amber-500/10" : "bg-muted"}`}>
              <RefreshCw className={`h-5 w-5 ${planStyle === "repeat" ? "text-amber-500" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-foreground">{t("repeatWeeklyPlan")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("repeatWeeklyPlanDesc")}</p>
            </div>
          </button>

          <button
            onClick={() => setPlanStyle("unique")}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 text-left transition-all ${
              planStyle === "unique"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${planStyle === "unique" ? "bg-primary/10" : "bg-muted"}`}>
              <CalendarDays className={`h-5 w-5 ${planStyle === "unique" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold text-foreground">{t("uniqueMonthlyPlan")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("uniqueMonthlyPlanDesc")}</p>
            </div>
          </button>
        </div>
      </div>

      <Button
        onClick={confirm}
        disabled={loading || error}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        size="lg"
      >
        {t("reviewConfirm") || "Confirm & generate"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}