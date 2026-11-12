import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { AlertTriangle, Bell, ChevronDown, ChevronUp } from "lucide-react";

export default function PantryUsageAlerts({ items, usageCounts, onUpdateThreshold, loadingPlans }) {
  const { t } = useLanguage();
  const [showManager, setShowManager] = useState(false);

  const usage = (name) => usageCounts[(name || "").toLowerCase().trim()] || 0;
  const warnings = items.filter((it) => (it.minUsage || 0) > 0 && usage(it.name) < (it.minUsage || 0));

  return (
    <div className="bba-t bg-card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#FFB020] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-black text-sm text-foreground">
              {t("usageAlerts") || "Usage alerts"}
            </h3>
            <p className="text-xs font-medium text-muted-foreground truncate">
              {t("usageAlertsDesc") || "Warns when an item is used in fewer plans than your set minimum"}
            </p>
          </div>
        </div>
        {warnings.length > 0 && (
          <span className="bg-[#FF3E7F] text-white border-2 border-[#111827] text-xs font-heading font-black px-2.5 py-0.5 rounded-full shrink-0">
            {warnings.length}
          </span>
        )}
      </div>

      {loadingPlans ? (
        <p className="text-xs text-muted-foreground">{t("loading") || "Loading…"}</p>
      ) : warnings.length === 0 ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827] bg-[#F3F8E6] border-2 border-[#111827] rounded-xl px-3.5 py-2.5">
          <span className="font-black">✓</span>
          {t("noUsageAlerts") || "All your tracked staples are being used enough."}
        </div>
      ) : (
        <div className="space-y-2">
          {warnings.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-2 bg-[#FF8FB5] text-[#111827] border-2 border-[#111827] rounded-xl px-3.5 py-2.5"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-heading font-extrabold flex-1 min-w-0 truncate">{it.name}</span>
              <span className="text-xs font-bold shrink-0">
                {t("used") || "Used"} {usage(it.name)} / {t("min") || "min"} {it.minUsage}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowManager((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#111827] bg-[#F3F8E6] border-2 border-[#111827] rounded-full px-3 py-1 shadow-[1.5px_1.5px_0_#111827]"
      >
        {showManager ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {t("manageThresholds") || "Set usage thresholds"}
      </button>
      {showManager && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 pt-1">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("pantryEmptyDashboard") || "No pantry items."}</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0 truncate font-semibold text-foreground">{it.name}</span>
                <span className="text-xs font-medium text-muted-foreground shrink-0">
                  {t("used") || "Used"}: {usage(it.name)}
                </span>
                <span className="text-xs font-medium text-muted-foreground shrink-0">{t("min") || "min"}</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={it.minUsage || 0}
                  onBlur={(e) => onUpdateThreshold(it, parseInt(e.target.value, 10) || 0)}
                  className="w-16 border-2 border-[#111827] dark:border-[#78a71b] rounded-lg px-2 py-1 text-sm font-heading font-bold bg-card focus:outline-none text-right"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}