import { useCountUp, formatNumber } from "./useCountUp";
import ProgressRing from "./ProgressRing";
import { TrendingUp } from "lucide-react";

// Featured stat pill: total budget planned + progress ring (plans vs 10-plan visual cap).
export default function FeaturedStat({ totalBudget, planCount, t }) {
  const animated = useCountUp(totalBudget || 0);
  const ringPercent = Math.min((planCount / 10) * 100, 100);
  return (
    <div className="bg-card border border-border rounded-3xl p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {t("totalPlanned") || "Total planned"}
        </span>
        <span className="block font-heading text-3xl font-bold text-foreground mt-1 tabular-nums">
          €{formatNumber(animated, 0)}
        </span>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
          {planCount} {planCount === 1 ? (t("planSingular") || "plan") : (t("planPlural") || "plans")}
        </p>
      </div>
      <ProgressRing percent={ringPercent} />
    </div>
  );
}