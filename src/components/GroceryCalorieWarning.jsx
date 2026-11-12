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
      className={`bba-t flex items-start gap-3.5 text-[#111827] ${
        over ? "bg-[#FFB020]" : "bg-[#7DD3FC]"
      }`}
    >
      <div className="h-10 w-10 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
        <AlertTriangle className="h-5 w-5 text-[#111827]" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="text-sm font-heading font-black text-[#111827]">
          <TrendIcon className="h-4 w-4 inline -mt-0.5 mr-1.5" />
          {over
            ? (t("groceryCalHigh") || "Grocery plan is higher than your daily target")
            : (t("groceryCalLow") || "Grocery plan is lower than your daily target")}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white border-2 border-[#111827] rounded-xl px-3 py-2 shadow-[2px_2px_0_#111827]">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-[#111827]/70 flex items-center gap-1">
              <Flame className="h-3 w-3 text-[#FF3E7F]" />
              {t("dailyTarget") || "Daily intake"}
            </p>
            <p className="text-sm font-heading font-black text-[#111827]">{target.toLocaleString()} kcal</p>
          </div>
          <div className="bg-white border-2 border-[#111827] rounded-xl px-3 py-2 shadow-[2px_2px_0_#111827]">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-[#111827]/70 flex items-center gap-1">
              <Flame className="h-3 w-3 text-[#78a71b]" />
              {t("groceryPlan") || "Grocery plan"}
            </p>
            <p className="text-sm font-heading font-black text-[#111827]">
              {generated.toLocaleString()} kcal
              <span className="text-[11px] font-bold text-[#111827]/70"> · ~{generatedDaily.toLocaleString()}/day</span>
            </p>
          </div>
        </div>
        <p className="text-xs font-semibold text-[#111827]/85 leading-relaxed">
          {over
            ? (t("groceryCalHighHint", { pct: Math.round(Math.abs(pct)) }) || `The list provides ~${Math.round(Math.abs(pct))}% more energy than your target over ${d} days. Consider reducing quantities or check that the target matches your needs.`)
            : (t("groceryCalLowHint", { pct: Math.round(Math.abs(pct)) }) || `The list provides ~${Math.round(Math.abs(pct))}% less energy than your target over ${d} days. You may need larger quantities to meet your daily intake.`)}
        </p>
      </div>
    </div>
  );
}