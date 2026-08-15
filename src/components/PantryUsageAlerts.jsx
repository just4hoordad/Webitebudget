import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { AlertTriangle, Bell, ChevronDown, ChevronUp } from "lucide-react";

export default function PantryUsageAlerts({ items, usageCounts, onUpdateThreshold, loadingPlans }) {
  const { t } = useLanguage();
  const [showManager, setShowManager] = useState(false);

  const usage = (name) => usageCounts[(name || "").toLowerCase().trim()] || 0;
  const warnings = items.filter((it) => (it.minUsage || 0) > 0 && usage(it.name) < (it.minUsage || 0));

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-sm text-foreground">
              {t("usageAlerts") || "Usage alerts"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {t("usageAlertsDesc") || "Warns when an item is used in fewer plans than your set minimum"}
            </p>
          </div>
        </div>
        {warnings.length > 0 && (
          <span className="bg-destructive/15 text-destructive text-xs font-bold px-2 py-1 rounded-full shrink-0">
            {warnings.length}
          </span>
        )}
      </div>

      {loadingPlans ? (
        <p className="text-xs text-muted-foreground">{t("loading") || "Loading…"}</p>
      ) : warnings.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2.5">
          <span>✓</span>
          {t("noUsageAlerts") || "All your tracked staples are being used enough."}
        </div>
      ) : (
        <div className="space-y-2">
          {warnings.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{it.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {t("used") || "Used"} {usage(it.name)} / {t("min") || "min"} {it.minUsage}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowManager((v) => !v)}
        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
      >
        {showManager ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {t("manageThresholds") || "Set usage thresholds"}
      </button>
      {showManager && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("pantryEmptyDashboard") || "No pantry items."}</p>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 min-w-0 truncate text-foreground">{it.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {t("used") || "Used"}: {usage(it.name)}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{t("min") || "min"}</span>
                <input
                  type="number"
                  min={0}
                  defaultValue={it.minUsage || 0}
                  onBlur={(e) => onUpdateThreshold(it, parseInt(e.target.value, 10) || 0)}
                  className="w-16 border border-border rounded-lg px-2 py-1 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-right"
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}