import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { ArrowLeft, ArrowRight, RefreshCw, CalendarDays, Check } from "lucide-react";
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
  const [planMode, setPlanMode] = useState("suggested");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const L = (k, fb) => { const v = t(k); return v === k ? fb : v; };

  const summaryTop = [
    { label: L("yourBudget", "Budget"), value: `€${budget.toFixed(0)}` },
    { label: L("calorieGoal", "Calories"), value: `${calories} kcal` },
    { label: L("numberOfPeople", "People"), value: `${people} ${t("personS")}` },
    { label: L("goal", "Goal"), value: goalLabel },
  ];

  const summaryBottom = [
    { label: L("diet", "Diet"), value: dietLabel },
    { label: L("stores", "Stores"), value: stores.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") },
    { label: L("days", "Days"), value: String(days) },
    { label: L("spendModeTitle", "Spending mode"), value: L(`spendMode${spendMode.charAt(0).toUpperCase() + spendMode.slice(1)}`, spendMode) },
  ];
  if (bio) summaryBottom.push({ label: L("bio", "Organic"), value: L("yes", "Yes") });
  if (saleHunt) summaryBottom.push({ label: L("saleHunt", "Sale hunt"), value: L("yes", "Yes") });
  if (allergies.length > 0) summaryBottom.push({ label: L("allergies", "Allergies"), value: allergies.join(", ") });
  if (ownedItems.length > 0) summaryBottom.push({ label: L("owned", "Already owned"), value: ownedItems.join(", ") });
  if (postalCode) summaryBottom.push({ label: L("plzLabel", "Postal code"), value: postalCode });

  const confirm = () => {
    const u = new URLSearchParams(window.location.search);
    if (planMode === "custom") {
      u.set("mode", "custom");
      window.scrollTo(0, 0);
      navigate(`/plan-builder?${u.toString()}`);
    } else {
      u.set("planStyle", planStyle);
      window.scrollTo(0, 0);
      navigate(`/meal-plan?${u.toString()}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/budget")}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:opacity-80 transition-opacity mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> {t("reviewBack") || "Back"}
      </button>

      {/* Suggested / Custom tabs */}
      <div className="flex bg-muted rounded-xl p-1 gap-1 mb-3">
        <button
          onClick={() => setPlanMode("suggested")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${
            planMode === "suggested"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {L("suggestedPlan", "Suggested")}
        </button>
        <button
          onClick={() => setPlanMode("custom")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${
            planMode === "custom"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {L("customPlan", "Custom")}
        </button>
      </div>

      {/* Summary card 1 */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm mb-3">
        <div className="grid grid-cols-2 gap-2">
          {summaryTop.map((kv, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-border flex flex-col gap-[3px]">
              <small className="text-[11px] text-muted-foreground leading-tight">{kv.label}</small>
              <b className="text-[15px] leading-tight text-foreground">{kv.value}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Summary card 2 */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm mb-3">
        <div className="grid grid-cols-2 gap-2">
          {summaryBottom.map((kv, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-border flex flex-col gap-[3px]">
              <small className="text-[11px] text-muted-foreground leading-tight">{kv.label}</small>
              <b className="text-[15px] leading-tight text-foreground">{kv.value}</b>
            </div>
          ))}
        </div>
      </div>

      {macros && <MacroBreakdown macros={macros} dailyKcal={calories / Math.max(people, 1)} L={L} />}

      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{recap.body}</p>

      {/* Plan style — only for Suggested */}
      {planMode === "suggested" && (
        <div className="mb-3">
          <h3 className="text-xl leading-tight font-bold text-primary px-1 mb-2">{t("weeklyPlanTitle")}</h3>
          <p className="text-sm text-muted-foreground px-1 mb-3">{t("weeklyPlanSubtitle")}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPlanStyle("repeat")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                planStyle === "repeat"
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              <span className={`w-8.5 h-8.5 rounded-[10px] flex items-center justify-center shrink-0 ${planStyle === "repeat" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`} style={{ width: "34px", height: "34px" }}>
                <RefreshCw className="h-[18px] w-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground">{t("repeatWeeklyPlan")}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t("repeatWeeklyPlanDesc")}</p>
              </div>
              {planStyle === "repeat" && <Check className="h-5 w-5 text-primary shrink-0" />}
            </button>
            <button
              onClick={() => setPlanStyle("unique")}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                planStyle === "unique"
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border hover:border-primary"
              }`}
            >
              <span className={`w-8.5 h-8.5 rounded-[10px] flex items-center justify-center shrink-0 ${planStyle === "unique" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`} style={{ width: "34px", height: "34px" }}>
                <CalendarDays className="h-[18px] w-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground">{t("uniqueMonthlyPlan")}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t("uniqueMonthlyPlanDesc")}</p>
              </div>
              {planStyle === "unique" && <Check className="h-5 w-5 text-primary shrink-0" />}
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={confirm}
        className="w-full py-3.5 rounded-xl text-[15px] font-bold flex justify-center gap-2 items-center bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 animate-drift transition-colors"
      >
        {planMode === "custom" ? L("customConfirm", "Build my plan") : (t("reviewConfirm") || "Confirm & generate")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}