import MealThumb from "@/components/planbuilder/MealThumb";
import { Copy, Eraser, Shuffle } from "lucide-react";

export default function ListView({ plan, slots, setSlot, onSuggest, dayFilled, copyToNextDay, clearDay, dateForIndex, WD, t, setActiveSlot }) {
  const inputCls = "w-full min-h-[40px] border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60";

  return (
    <div className="space-y-2.5">
      {plan.map((day, d) => {
        const dt = dateForIndex(d);
        return (
          <div key={d} className="bg-card border border-border rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-foreground">{t("day")} {d + 1}</span>
                <span className="text-[10px] font-medium text-muted-foreground">· {WD[dt.getDay()]} {dt.getDate()}</span>
                <span className="text-[10px] font-medium tabular-nums rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{dayFilled(d)}/3</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => copyToNextDay(d)}
                  disabled={d + 1 >= plan.length}
                  title={t("copyToNextDay")}
                  aria-label={t("copyToNextDay")}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => clearDay(d)}
                  title={t("clearDay")}
                  aria-label={t("clearDay")}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {slots.map((s) => {
                const Icon = s.icon;
                const filled = (day[s.key] || "").trim();
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" /> {s.label}
                    </div>
                    <div className="flex items-center gap-2">
                      {filled ? <MealThumb name={filled} /> : <div className="h-9 w-9 rounded-full border border-dashed border-border shrink-0" />}
                      <input
                        type="text"
                        value={day[s.key] || ""}
                        onChange={(e) => setSlot(d, s.key, e.target.value)}
                        onFocus={() => setActiveSlot(d, s.key)}
                        placeholder={t("mealNamePlaceholder")}
                        className={inputCls}
                      />
                      {onSuggest && (
                        <button
                          type="button"
                          onClick={() => onSuggest(d, s.key)}
                          title={t("suggestMeal")}
                          aria-label={t("suggestMeal")}
                          className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Shuffle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}