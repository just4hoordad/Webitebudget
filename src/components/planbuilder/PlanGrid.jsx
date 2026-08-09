import { useLanguage } from "@/lib/LanguageContext";
import { ArrowRight, Utensils, Sparkles, Loader2 } from "lucide-react";

export default function PlanGrid({ days, plan, setSlot, onAutoFill, autofilling, onGenerate, generating }) {
  const { t } = useLanguage();
  const mealTypes = [
    { key: "breakfast", label: t("breakfast") },
    { key: "lunch", label: t("lunch") },
    { key: "dinner", label: t("dinner") },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <Utensils className="h-4 w-4" /> {t("planGridTitle", { days })}
        </div>
        <p className="text-muted-foreground text-sm">{t("planGridSubtitle")}</p>
      </div>

      <button
        onClick={onAutoFill}
        disabled={autofilling}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-all disabled:opacity-60"
      >
        {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t("autoFillMeals")}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plan.map((day, d) => (
          <div key={d} className="border border-border rounded-xl bg-card p-4">
            <div className="font-heading font-semibold text-sm mb-3">{t("day") || "Day"} {d + 1}</div>
            <div className="space-y-3">
              {mealTypes.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <input
                    type="text"
                    value={day[key] || ""}
                    onChange={(e) => setSlot(d, key, e.target.value)}
                    placeholder={t("mealNamePlaceholder")}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-primary-foreground disabled:opacity-60"
      >
        {t("generateGroceryFromPlan")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
}