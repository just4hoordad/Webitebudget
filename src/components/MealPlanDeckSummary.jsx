import { Link } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import MacroChart from "@/components/MacroChart";

export default function MealPlanDeckSummary({
  t,
  weeklyPlan,
  activeTotal,
  groceryDays,
  calories,
  macros,
  actualMacroGrams,
  nutritionUrl,
}) {
  const allDays = weeklyPlan.weeks.flatMap((w) => w.days || []);
  const totalCal = allDays.reduce(
    (sum, d) => sum + (d.breakfast_calories || 0) + (d.lunch_calories || 0) + (d.dinner_calories || 0),
    0
  );
  const avgCal = allDays.length > 0 ? Math.round(totalCal / allDays.length) : 0;
  const costPerDay = activeTotal / Math.max(1, groceryDays);
  const planDays = allDays.length;
  const planCost = costPerDay * planDays;

  return (
    <>
      <div className="bba-t bg-card text-card-foreground p-0 overflow-hidden">
        <div className="bg-[#7DD3FC] text-[#111827] border-b-[3px] border-[#111827] px-5 py-3">
          <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[#111827]">
            📊 {t("tx_planSummary")}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[#111827]/12 dark:divide-white/15">
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground mb-1">
              {t("totalDays")}
            </p>
            <p className="font-heading text-2xl font-black text-foreground tabular-nums">{planDays}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground mb-1">
              {t("totalCalories")}
            </p>
            <p className="font-heading text-2xl font-black text-primary tabular-nums">{totalCal.toLocaleString()}</p>
            <p className="text-xs font-semibold text-muted-foreground">~{avgCal} kcal{t("tx_perDay")}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground mb-1">
              {t("tx_estCost")}
            </p>
            <p className="font-heading text-2xl font-black text-foreground tabular-nums">€{planCost.toFixed(2)}</p>
            <p className="text-xs font-semibold text-muted-foreground">~€{costPerDay.toFixed(2)}{t("tx_perDay")}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground mb-1">
              {t("mealsTotal")}
            </p>
            <p className="font-heading text-2xl font-black text-foreground tabular-nums">{planDays * 3}</p>
            <p className="text-xs font-semibold text-muted-foreground">{t("tx_mealsPerDay")}</p>
          </div>
        </div>
      </div>

      <MacroChart calories={parseFloat(calories)} macros={macros} totalGrams={actualMacroGrams} days={groceryDays} />

      {nutritionUrl && (
        <Link to={nutritionUrl} className="block">
          <div className="bba-t bg-[#C084FC] text-[#111827] flex items-center gap-4 hover:translate-x-[2px] hover:translate-y-[2px] transition-transform cursor-pointer">
            <div className="h-11 w-11 bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] rounded-2xl flex items-center justify-center shrink-0">
              <BarChart2 className="h-5 w-5 text-[#111827]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-black text-[#111827] text-base">{t("viewNutritionAnalysis")}</p>
              <p className="text-xs font-semibold text-[#111827]/80">{t("nutritionSubtitle")}</p>
            </div>
            <span className="h-9 w-9 rounded-full bg-[#111827] text-white flex items-center justify-center font-heading font-black text-sm shrink-0">
              →
            </span>
          </div>
        </Link>
      )}
    </>
  );
}