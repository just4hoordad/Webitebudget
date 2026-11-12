import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Wallet, Flame, Users, Target, RefreshCw, CalendarDays, Check } from "lucide-react";
import { REASSURANCE_STR } from "@/components/ReassuranceRecap";
import MacroBreakdown from "@/components/MacroBreakdown";

const DIET_LABEL_KEYS = { balanced: "balanced", vegetarian: "vegetarian", vegan: "vegan", "high-protein": "highProtein", pescatarian: "pescatarian", "gluten-free": "glutenFree", halal: "halal", frozen: "frozenFoods", "half-cooked": "halfCooked" };
const GOAL_LABEL_KEYS = { lose: "loseWeight", maintain: "maintain", gain: "gainWeight", muscle: "buildMuscle" };

export default function PlanReview() {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  const budget = parseFloat(params.get("budget") || "0");
  const days = parseInt(params.get("days") || "0", 10);
  const people = parseInt(params.get("people") || "1", 10);
  const calories = parseInt(params.get("calories") || "2000", 10);
  const goal = params.get("goal") || "maintain";
  const diet = params.get("diet") || "balanced";
  const stores = (params.get("stores") || "aldi,lidl").split(",").filter(Boolean);
  const saleHunt = params.get("saleHunt") === "true";
  const bio = params.get("bio") === "true";
  const junkPercent = parseInt(params.get("junkPercent") || "0", 10);
  const proteinSnackBudget = parseInt(params.get("proteinSnackBudget") || "0", 10);
  const spendMode = params.get("spendMode") || "balanced";
  const allergies = params.get("allergies") ? params.get("allergies").split(",").filter(Boolean) : [];
  const ownedItems = params.get("owned") ? params.get("owned").split(",").filter(Boolean) : [];
  const macrosParam = params.get("macros");
  const macros = macrosParam ? (() => { const [p, c, f] = macrosParam.split(",").map(Number); return { protein: p || 30, carbs: c || 40, fats: f || 30 }; })() : null;
  const postalCode = params.get("plz") || "";

  const recap = REASSURANCE_STR[currentLanguage.code] || REASSURANCE_STR.en;
  const dietLabel = t(DIET_LABEL_KEYS[diet] || "balanced");
  const goalLabel = t(GOAL_LABEL_KEYS[goal] || "maintain");

  const [planStyle, setPlanStyle] = useState(params.get("planStyle") === "unique" ? "unique" : "repeat");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const L = (k, fb) => { const v = t(k); return v === k ? fb : v; };

  const headline = [
    { icon: Wallet, value: `€${budget.toFixed(0)}`, label: L("yourBudget", "Budget"), bg: "bg-[#78a71b]" },
    { icon: Flame, value: `${calories} kcal`, label: L("calorieGoal", "Calories"), bg: "bg-[#FFB020]" },
    { icon: Users, value: `${people} ${t("personS")}`, label: L("numberOfPeople", "People"), bg: "bg-[#7DD3FC]" },
    { icon: Target, value: goalLabel, label: L("goal", "Goal"), bg: "bg-[#FF8FB5]" },
  ];

  const details = [
    { label: L("diet", "Diet"), value: dietLabel },
    { label: L("stores", "Stores"), value: stores.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") },
    { label: L("days", "Days"), value: String(days) },
    { label: L("goal", "Goal"), value: goalLabel },
  ];
  if (proteinSnackBudget > 0) details.push({ label: L("proteinSnackBudgetTitle", "Protein snack budget"), value: `€${proteinSnackBudget}` });
  if (spendMode) details.push({ label: L("spendModeTitle", "Spending mode"), value: L(`spendMode${spendMode.charAt(0).toUpperCase() + spendMode.slice(1)}`, spendMode) });
  if (bio) details.push({ label: L("bio", "Organic"), value: L("yes", "Yes") });
  if (saleHunt) details.push({ label: L("saleHunt", "Sale hunt"), value: L("yes", "Yes") });
  if (junkPercent > 0) details.push({ label: L("junkFood", "Junk allowance"), value: `${junkPercent}%` });
  if (allergies.length > 0) details.push({ label: L("allergies", "Allergies"), value: allergies.join(", ") });
  if (ownedItems.length > 0) details.push({ label: L("owned", "Already owned"), value: ownedItems.join(", ") });
  if (params.get("height")) details.push({ label: L("height", "Height"), value: `${params.get("height")} cm` });
  if (params.get("weight")) details.push({ label: L("weight", "Weight"), value: `${params.get("weight")} kg` });
  if (params.get("age")) details.push({ label: L("age", "Age"), value: params.get("age") });
  if (params.get("sex")) details.push({ label: L("sex", "Sex"), value: L(params.get("sex"), params.get("sex")) });
  if (params.get("activity")) details.push({ label: L("activityLevel", "Activity level"), value: L(params.get("activity"), params.get("activity")) });
  if (postalCode) details.push({ label: L("plzLabel", "Postal code"), value: postalCode });

  const confirm = () => {
    const u = new URLSearchParams(window.location.search);
    u.set("planStyle", planStyle);
    window.scrollTo(0, 0);
    navigate(`/meal-plan?${u.toString()}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button
        type="button"
        onClick={() => navigate("/budget")}
        className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#111827] bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] rounded-full px-3.5 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("reviewBack") || "Back to edit"}
      </button>

      <div className="bba-t bg-[#FF3E7F] text-white space-y-1.5">
        <span className="bba-sticker">Ready Check</span>
        <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white">
          {t("reviewTitle") || "Confirm your plan"}
        </h1>
        <p className="text-sm text-white/90 font-medium">
          {t("reviewSubtitle") || "Review everything you selected, then we'll generate your grocery list."}
        </p>
      </div>

      {/* Headline params — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {headline.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`flex items-center gap-3 ${c.bg} text-[#111827] border-[2.5px] border-[#111827] rounded-2xl px-4 py-3.5 shadow-[3px_3px_0_#111827]`}>
              <div className="h-10 w-10 rounded-2xl bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-[#111827]" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-black text-[#111827] text-base sm:text-lg leading-tight truncate">{c.value}</p>
                <p className="text-[10px] font-heading font-black text-[#111827]/75 uppercase tracking-wider">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Everything you selected */}
      <div className="bba-t bg-card text-card-foreground overflow-hidden p-0">
        <div className="bg-[#FFB020] border-b-[3px] border-[#111827] px-4 py-3">
          <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[#111827]">
            {t("reviewYourSelections") || "Your selections"}
          </h3>
        </div>
        <div className="divide-y-2 divide-[#111827]/12 dark:divide-white/15">
          {details.map((d, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">{d.label}</span>
              <span className="text-sm font-heading font-extrabold text-foreground text-right">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {macros && <MacroBreakdown macros={macros} dailyKcal={calories / Math.max(people, 1)} L={L} />}

      <div className="bba-t bg-[#F3F8E6] text-[#111827]">
        <p className="text-sm font-medium text-[#111827] leading-relaxed">{recap.body}</p>
      </div>

      {/* Plan style selection */}
      <div className="bba-t bg-card text-card-foreground space-y-3">
        <div>
          <h2 className="font-heading text-xl font-black text-foreground">{t("weeklyPlanTitle")}</h2>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{t("weeklyPlanSubtitle")}</p>
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => setPlanStyle("repeat")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-[2.5px] text-left transition-all ${
              planStyle === "repeat"
                ? "border-[#111827] bg-[#78a71b] text-[#111827] shadow-[3px_3px_0_#111827]"
                : "border-[#111827] dark:border-[#78a71b] bg-background text-foreground hover:bg-[#F3F8E6] hover:text-[#111827]"
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-[#111827] flex items-center justify-center shrink-0">
              <RefreshCw className="h-5 w-5 text-[#111827]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-black">{t("repeatWeeklyPlan")}</p>
              <p className={`text-xs font-medium mt-0.5 ${planStyle === "repeat" ? "text-[#111827]/80" : "text-muted-foreground"}`}>{t("repeatWeeklyPlanDesc")}</p>
            </div>
            {planStyle === "repeat" && (
              <span className="h-7 w-7 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-[#111827] stroke-[3]" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPlanStyle("unique")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-[2.5px] text-left transition-all ${
              planStyle === "unique"
                ? "border-[#111827] bg-[#FFB020] text-[#111827] shadow-[3px_3px_0_#111827]"
                : "border-[#111827] dark:border-[#78a71b] bg-background text-foreground hover:bg-[#F3F8E6] hover:text-[#111827]"
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-[#111827] flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-[#111827]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-black">{t("uniqueMonthlyPlan")}</p>
              <p className={`text-xs font-medium mt-0.5 ${planStyle === "unique" ? "text-[#111827]/80" : "text-muted-foreground"}`}>{t("uniqueMonthlyPlanDesc")}</p>
            </div>
            {planStyle === "unique" && (
              <span className="h-7 w-7 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-[#111827] stroke-[3]" />
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+80px)] z-30 -mx-1 px-1 pt-3 pb-2 bg-gradient-to-t from-background via-background/95 to-background/0">
        <Button
          onClick={confirm}
          variant="destructive"
          className="w-full h-14 text-base"
          size="lg"
        >
          {t("reviewConfirm") || "Confirm & generate"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}