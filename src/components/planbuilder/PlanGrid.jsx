import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowRight, Utensils, Sparkles, Loader2, ChefHat, Copy, Eraser } from "lucide-react";

export default function PlanGrid({ days, plan, setSlot, onAutoFill, autofilling, onGenerate, generating, prepEnabled, setPrepEnabled, onSuggest, suggesting, recentMeals }) {
  const { t } = useLanguage();
  const [activeSlot, setActiveSlot] = useState(null); // { day, type } — last focused input

  const slots = [
    { key: "breakfast", label: t("breakfast") },
    { key: "lunch", label: t("lunch") },
    { key: "dinner", label: t("dinner") },
  ];

  const inputCls =
    "w-full min-h-[44px] border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow placeholder:text-muted-foreground/60";

  const totalSlots = plan.length * 3;
  const filledSlots = plan.reduce(
    (acc, day) => acc + slots.filter((s) => (day[s.key] || "").trim()).length,
    0
  );
  const dayFilled = (d) => slots.filter((s) => (plan[d][s.key] || "").trim()).length;

  const handlePickRecent = (meal) => {
    if (!activeSlot) {
      toast.info(t("noActiveSlot"));
      return;
    }
    setSlot(activeSlot.day, activeSlot.type, meal);
  };

  const copyToNextDay = (d) => {
    if (d + 1 >= plan.length) return;
    const src = plan[d];
    slots.forEach((s) => setSlot(d + 1, s.key, src[s.key] || ""));
  };
  const clearDay = (d) => slots.forEach((s) => setSlot(d, s.key, ""));

  const renderDayActions = (d) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => copyToNextDay(d)}
        disabled={d + 1 >= plan.length}
        title={t("copyToNextDay")}
        aria-label={t("copyToNextDay")}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => clearDay(d)}
        title={t("clearDay")}
        aria-label={t("clearDay")}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Eraser className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const renderSlot = (d, s, withLabel) => {
    const key = `${d}-${s.key}`;
    const busy = !!suggesting?.[key];
    return (
      <div key={s.key} className="space-y-1">
        {withLabel && (
          <label className="text-[11px] font-medium text-muted-foreground block">{s.label}</label>
        )}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={plan[d][s.key] || ""}
            onChange={(e) => setSlot(d, s.key, e.target.value)}
            onFocus={() => setActiveSlot({ day: d, type: s.key })}
            placeholder={t("mealNamePlaceholder")}
            className={inputCls}
          />
          {onSuggest && (
            <button
              type="button"
              onClick={() => onSuggest(d, s.key)}
              disabled={busy}
              title={t("suggestMeal")}
              aria-label={t("suggestMeal")}
              className="shrink-0 inline-flex items-center justify-center h-[44px] w-[44px] rounded-lg border border-border bg-card text-primary hover:bg-primary/10 disabled:opacity-60 transition-colors"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    );
  };

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
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-all disabled:opacity-60"
      >
        {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t("autoFillMeals")}
      </button>

      {/* Recently used meals — tap a slot, then a chip to fill it */}
      {recentMeals && recentMeals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{t("recentlyUsed")}</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {recentMeals.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePickRecent(m)}
                className="shrink-0 max-w-[180px] truncate px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                title={m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop column headers */}
      <div className="hidden sm:grid grid-cols-[44px_1fr_1fr_1fr_auto] gap-2 px-1 text-[11px] font-medium text-muted-foreground">
        <span>{t("day") || "Day"}</span>
        <span>{t("breakfast")}</span>
        <span>{t("lunch")}</span>
        <span>{t("dinner")}</span>
        <span />
      </div>

      <div className="space-y-2">
        {plan.map((day, d) => (
          <div key={d} className="bg-card border border-border rounded-xl p-2">
            {/* Desktop: compact row */}
            <div className="hidden sm:grid grid-cols-[44px_1fr_1fr_1fr_auto] gap-2 items-center">
              <span className="font-heading font-semibold text-xs text-muted-foreground">#{d + 1}</span>
              {slots.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={day[s.key] || ""}
                    onChange={(e) => setSlot(d, s.key, e.target.value)}
                    onFocus={() => setActiveSlot({ day: d, type: s.key })}
                    placeholder={t("mealNamePlaceholder")}
                    className={inputCls}
                  />
                  {onSuggest && (
                    <button
                      type="button"
                      onClick={() => onSuggest(d, s.key)}
                      disabled={!!suggesting?.[`${d}-${s.key}`]}
                      title={t("suggestMeal")}
                      aria-label={t("suggestMeal")}
                      className="shrink-0 inline-flex items-center justify-center h-[44px] w-[44px] rounded-lg border border-border bg-card text-primary hover:bg-primary/10 disabled:opacity-60 transition-colors"
                    >
                      {suggesting?.[`${d}-${s.key}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              ))}
              {renderDayActions(d)}
            </div>

            {/* Mobile: comfortable stacked day card */}
            <div className="sm:hidden space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-xs text-muted-foreground">{t("day") || "Day"} {d + 1}</span>
                  <span className="text-[10px] font-medium tabular-nums rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    {dayFilled(d)}/3
                  </span>
                </div>
                {renderDayActions(d)}
              </div>
              <div className="space-y-2">
                {slots.map((s) => renderSlot(d, s, true))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t("includePrepGuide") || "Include meal prep guide"}</span>
        </div>
        <Switch checked={prepEnabled} onCheckedChange={setPrepEnabled} aria-label="Toggle prep guide" />
      </div>

      {/* Progress + generate */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${totalSlots ? (filledSlots / totalSlots) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {filledSlots}/{totalSlots}
          </span>
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
    </div>
  );
}