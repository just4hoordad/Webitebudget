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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && setWeekOffset((w) => w - 1)}
          disabled={!canPrev}
          className="h-8 w-8 rounded-xl border-2 border-[#111827] bg-white text-[#111827] font-black shadow-[2px_2px_0_#111827] flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
        >‹</button>
        <span className="text-xs font-heading font-black text-foreground tabular-nums bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] px-3 py-0.5 rounded-full">
          Days {startIdx + 1}–{startIdx + cols.length}
        </span>
        <button
          type="button"
          onClick={() => canNext && setWeekOffset((w) => w + 1)}
          disabled={!canNext}
          className="h-8 w-8 rounded-xl border-2 border-[#111827] bg-white text-[#111827] font-black shadow-[2px_2px_0_#111827] flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
        >›</button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
        {cols.map((d) => {
          const dt = dateForIndex(d);
          const day = plan[d];
          const isCurrentDay = d === activeDay;
          return (
            <div
              key={d}
              className={`min-w-[128px] flex-1 rounded-2xl border-[2.5px] border-[#111827] dark:border-[#78a71b] p-2.5 transition-all ${
                isCurrentDay
                  ? "bg-[#F3F8E6] dark:bg-secondary shadow-[3px_3px_0_#111827]"
                  : "bg-card"
              }`}
            >
              <div className={`flex flex-col items-center mb-2 py-1 rounded-xl border-2 border-[#111827] ${isCurrentDay ? "bg-[#78a71b] text-[#111827]" : "bg-secondary text-foreground"}`}>
                <span className="text-[10px] font-heading font-black uppercase tracking-wide">{WD[dt.getDay()]}</span>
                <span className="font-heading font-black text-base leading-none">{dt.getDate()}</span>
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
                      className={`w-full text-left rounded-xl p-2 border-2 transition-all ${
                        selected
                          ? "border-[#111827] bg-[#FFB020] text-[#111827] shadow-[2px_2px_0_#111827]"
                          : filled
                          ? "border-[#111827] dark:border-[#78a71b] bg-white dark:bg-card text-foreground"
                          : "border-dashed border-[#111827]/40 dark:border-foreground/30 bg-transparent hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-[9px] font-heading font-black uppercase tracking-wide opacity-75 mb-1">{s.label}</div>
                      {filled ? (
                        <div className="flex items-center gap-1.5">
                          <MealThumb name={firstName} size="h-7 w-7" />
                          <span className="text-[11px] font-bold leading-tight line-clamp-2 flex-1 min-w-0">
                            {firstName}{extra > 0 && <span className="opacity-70"> +{extra}</span>}
                          </span>
                          <GripVertical className="h-3.5 w-3.5 opacity-50 shrink-0" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-[11px] font-heading font-bold opacity-65 py-1">
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