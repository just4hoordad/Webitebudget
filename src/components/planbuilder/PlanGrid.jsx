import { useLanguage } from "@/lib/LanguageContext";
import { ArrowRight, Utensils, Sparkles, Loader2 } from "lucide-react";

export default function PlanGrid({ days, plan, setSlot, onAutoFill, autofilling, onGenerate, generating }) {
  const { t } = useLanguage();
  const slots = [
    { key: "breakfast", label: t("breakfast"), abbr: "B" },
    { key: "lunch", label: t("lunch"), abbr: "L" },
    { key: "dinner", label: t("dinner"), abbr: "D" },
  ];
  const inputCls = "w-full border border-border rounded-md px-2 py-1.5 text-xs bg-card focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <Utensils className="h-4 w-4" /> {t("planGridTitle", { days })}
        </div>
        <p className="text-muted-foreground text-sm">{t("planGridSubtitle")}</p>
      </div>

      <button
        onClick={onAutoFill}
        disabled={autofilling}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-all disabled:opacity-60"
      >
        {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t("autoFillMeals")}
      </button>

      {/* Column headers (desktop) */}
      <div className="hidden sm:grid grid-cols-[52px_1fr_1fr_1fr] gap-2 px-1 text-[11px] font-medium text-muted-foreground">
        <span>{t("day") || "Day"}</span>
        <span>{t("breakfast")}</span>
        <span>{t("lunch")}</span>
        <span>{t("dinner")}</span>
      </div>

      <div className="space-y-1.5">
        {plan.map((day, d) => (
          <div key={d} className="bg-card border border-border rounded-lg p-2">
            {/* Desktop: single row */}
            <div className="hidden sm:grid grid-cols-[52px_1fr_1fr_1fr] gap-2 items-center">
              <span className="font-heading font-semibold text-xs text-muted-foreground">#{d + 1}</span>
              {slots.map((s) => (
                <input key={s.key} type="text" value={day[s.key] || ""} onChange={(e) => setSlot(d, s.key, e.target.value)} placeholder={t("mealNamePlaceholder")} className={inputCls} />
              ))}
            </div>
            {/* Mobile: compact 3-col with abbreviations */}
            <div className="sm:hidden space-y-1.5">
              <div className="font-heading font-semibold text-xs text-muted-foreground">Day {d + 1}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {slots.map((s) => (
                  <div key={s.key}>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">{s.abbr}</label>
                    <input type="text" value={day[s.key] || ""} onChange={(e) => setSlot(d, s.key, e.target.value)} placeholder={t("mealNamePlaceholder")} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full h-12 text-sm font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 transition-all flex items-center justify-center text-primary-foreground disabled:opacity-60"
      >
        {t("generateGroceryFromPlan")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  );
}