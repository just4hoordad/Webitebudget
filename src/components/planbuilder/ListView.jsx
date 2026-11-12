import DishPill from "@/components/planbuilder/DishPill";
import { dishList } from "@/lib/planDishes";
import { Copy, Eraser, Plus } from "lucide-react";

export default function ListView({ plan, slots, addDish, updateDish, removeDish, addSideDish, dayFilled, copyToNextDay, clearDay, dateForIndex, WD, t }) {
  return (
    <div className="space-y-3">
      {plan.map((day, d) => {
        const dt = dateForIndex(d);
        const count = dayFilled(d);
        return (
          <div key={d} className="bg-[#F3F8E6]/60 dark:bg-secondary/60 border-[2.5px] border-[#111827] dark:border-[#78a71b] rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0_#111827]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-black text-xs bg-[#78a71b] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full">
                  {t("day")} {d + 1}
                </span>
                <span className="text-xs font-heading font-bold text-muted-foreground">· {WD[dt.getDay()]} {dt.getDate()}</span>
                <span className={`text-[10px] font-heading font-black tabular-nums rounded-full border border-[#111827] px-2 py-0.5 ${count === 3 ? "bg-[#FFB020] text-[#111827]" : "bg-white text-[#111827]"}`}>
                  {count}/3
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyToNextDay(d)}
                  disabled={d + 1 >= plan.length}
                  title={t("copyToNextDay")}
                  aria-label={t("copyToNextDay")}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#7DD3FC] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => clearDay(d)}
                  title={t("clearDay")}
                  aria-label={t("clearDay")}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF8FB5] transition-colors"
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
                  <div key={s.key} className="space-y-1.5 bg-card rounded-xl p-2.5 border-2 border-[#111827]/80 dark:border-[#78a71b]/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-heading font-black uppercase tracking-wide text-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" /> {s.label}
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
                      className="w-full flex items-center gap-1.5 rounded-xl border-2 border-dashed border-[#111827]/40 px-3 py-1.5 text-xs font-heading font-bold text-primary hover:border-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> {t("addDish")}
                    </button>
                    <button
                      type="button"
                      onClick={() => addSideDish(d, s.key)}
                      className="w-full flex items-center gap-1.5 rounded-xl border border-dashed border-[#111827]/30 px-3 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
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