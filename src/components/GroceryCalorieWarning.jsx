import { Flame, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

// Compares the generated grocery plan's total calories against the user's
// daily caloric intake target. Shows both values and a warning when they
// differ beyond a 10% tolerance.
export default function GroceryCalorieWarning({ dailyTarget, generatedKcal, days }) {
  const { t } = useLanguage();

  const target = Number(dailyTarget);
  const generated = Number(generatedKcal) || 0;
  const d = Number(days) || 1;

  if (!target || !generated || d <= 0) return null;

  const targetTotal = target * d;
  const generatedDaily = Math.round(generated / d);
  const diff = generated - targetTotal;
  const pct = (diff / targetTotal) * 100;
  const off = Math.abs(pct) > 10;

  if (!off) return null;

  const over = pct > 0;
  const TrendIcon = over ? TrendingUp : TrendingDown;

  return (
    <div
      className={`rounded-xl px-4 py-3.5 flex items-start gap-3 border-2 ${
        over
          ? "bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700"
          : "bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700"
      }`}
    >
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
          over ? "bg-amber-200 dark:bg-amber-800" : "bg-blue-200 dark:bg-blue-800"
        }`}
      >
        <AlertTriangle className={`h-5 w-5 ${over ? "text-amber-700 dark:text-amber-200" : "text-blue-700 dark:text-blue-200"}`} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className={`text-sm font-heading font-bold ${over ? "text-amber-800 dark:text-amber-200" : "text-blue-800 dark:text-blue-200"}`}>
          <TrendIcon className="h-3.5 w-3.5 inline -mt-0.5 mr-1" />
          {over
            ? (t("groceryCalHigh") || "Grocery plan is higher than your daily target")
            : (t("groceryCalLow") || "Grocery plan is lower than your daily target")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/70 dark:bg-card/60 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {t("dailyTarget") || "Daily intake"}
            </p>
            <p className="text-sm font-heading font-bold text-foreground">{target.toLocaleString()} kcal</p>
          </div>
          <div className="bg-white/70 dark:bg-card/60 rounded-lg px-2.5 py-1.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {t("groceryPlan") || "Grocery plan"}
            </p>
            <p className="text-sm font-heading font-bold text-foreground">
              {generated.toLocaleString()} kcal
              <span className="text-[11px] font-normal text-muted-foreground"> · ~{generatedDaily.toLocaleString()}/day</span>
            </p>
          </div>
        </div>
        <p className={`text-xs ${over ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>
          {over
            ? (t("groceryCalHighHint", { pct: Math.round(Math.abs(pct)) }) || `The list provides ~${Math.round(Math.abs(pct))}% more energy than your target over ${d} days. Consider reducing quantities or check that the target matches your needs.`)
            : (t("groceryCalLowHint", { pct: Math.round(Math.abs(pct)) }) || `The list provides ~${Math.round(Math.abs(pct))}% less energy than your target over ${d} days. You may need larger quantities to meet your daily intake.`)}
        </p>
      </div>
    </div>
  );
}