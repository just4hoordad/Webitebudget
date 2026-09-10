import MealThumb from "@/components/planbuilder/MealThumb";
import { filledDishes } from "@/lib/planDishes";
import { Plus, GripVertical } from "lucide-react";

export default function WeekView({ plan, slots, selectCell, activeDay, slotType, dateForIndex, WD, weekOffset, setWeekOffset }) {
  const perWeek = 7;
  const startIdx = weekOffset * perWeek;
  const cols = Array.from({ length: perWeek }, (_, c) => startIdx + c).filter((i) => i < plan.length);
  const canPrev = weekOffset > 0;
  const canNext = startIdx + perWeek < plan.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && setWeekOffset((w) => w - 1)}
          disabled={!canPrev}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >‹</button>
        <span className="text-xs font-medium text-muted-foreground tabular-nums">{startIdx + 1}–{startIdx + cols.length}</span>
        <button
          type="button"
          onClick={() => canNext && setWeekOffset((w) => w + 1)}
          disabled={!canNext}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >›</button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {cols.map((d) => {
          const dt = dateForIndex(d);
          const day = plan[d];
          return (
            <div
              key={d}
              className={`min-w-[118px] flex-1 rounded-2xl border p-2 ${d === activeDay ? "border-primary/60 bg-primary/5" : "border-border bg-card"}`}
            >
              <div className="flex flex-col items-center mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{WD[dt.getDay()]}</span>
                <span className="font-heading font-bold text-lg leading-none">{dt.getDate()}</span>
              </div>
              <div className="space-y-1.5">
                {slots.map((s) => {
                  const dishes = filledDishes(day, s.key);
                  const filled = dishes.length > 0;
                  const firstName = dishes[0]?.name || "";
                  const extra = dishes.length - 1;
                  const selected = d === activeDay && s.key === slotType;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => selectCell(d, s.key)}
                      className={`w-full text-left rounded-xl p-2 border transition-colors ${
                        selected ? "border-primary bg-primary/10"
                        : filled ? "border-border bg-muted/40"
                        : "border-dashed border-border bg-transparent hover:bg-muted/40"
                      }`}
                    >
                      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{s.label}</div>
                      {filled ? (
                        <div className="flex items-center gap-1.5">
                          <MealThumb name={firstName} size="h-8 w-8" />
                          <span className="text-[11px] font-medium leading-tight line-clamp-2 flex-1 min-w-0">{firstName}{extra > 0 && <span className="text-muted-foreground"> +{extra}</span>}</span>
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                          <Plus className="h-3 w-3" /> {s.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}