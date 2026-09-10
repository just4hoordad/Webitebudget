import DishPill from "@/components/planbuilder/DishPill";
import { dishList } from "@/lib/planDishes";
import { Copy, Eraser, Plus } from "lucide-react";

export default function ListView({ plan, slots, addDish, updateDish, removeDish, addSideDish, dayFilled, copyToNextDay, clearDay, dateForIndex, WD, t }) {
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
                const dishes = dishList(day, s.key);
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" /> {s.label}
                    </div>
                    {dishes.map((dish, idx) => (
                      <DishPill
                        key={idx}
                        dish={dish}
                        t={t}
                        onType={(v) => updateDish(d, s.key, idx, v)}
                        onRemove={() => removeDish(d, s.key, idx)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => addDish(d, s.key, "")}
                      className="w-full flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-medium text-primary/80 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> {t("addDish")}
                    </button>
                    <button
                      type="button"
                      onClick={() => addSideDish(d, s.key)}
                      className="w-full flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> {t("addSideDish")}
                    </button>
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