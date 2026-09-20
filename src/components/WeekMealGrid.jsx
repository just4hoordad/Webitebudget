import { Shuffle, Edit2, Plus, Sun, Utensils, Moon } from "lucide-react";

// Per-day card layout: each day is a vertical card with breakfast/lunch/dinner rows.
// Clearer on mobile than a horizontal day×meal grid.
const MEAL_TYPES = [
  { type: "breakfast", labelKey: "breakfast", Icon: Sun },
  { type: "lunch", labelKey: "lunch", Icon: Utensils },
  { type: "dinner", labelKey: "dinner", Icon: Moon },
];

export default function WeekMealGrid({ week, weekIndex, t, onEdit, onSwap }) {
  const days = (week.days || []).filter(Boolean);

  if (days.length === 0) return null;

  return (
    <div className="space-y-3">
      {days.map((day, dayIdx) => {
        const dayTotal =
          (day.breakfast_calories || 0) +
          (day.lunch_calories || 0) +
          (day.dinner_calories || 0);

        return (
          <div key={dayIdx} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-border">
              <span className="font-heading font-bold text-sm text-primary uppercase tracking-wide">
                {day.day || `${t("day") || "Day"} ${dayIdx + 1}`}
              </span>
              {dayTotal > 0 && (
                <span className="text-xs font-semibold text-primary bg-primary/15 rounded-full px-2 py-0.5">
                  {dayTotal.toLocaleString()} kcal
                </span>
              )}
            </div>

            {/* Meal rows */}
            <div className="divide-y divide-border">
              {MEAL_TYPES.map(({ type, labelKey, Icon }) => {
                const name = day[type];
                const cal = day[`${type}_calories`];
                const ings = day[`${type}_ingredients`];

                if (!name) {
                  return (
                    <div key={type} className="flex items-center gap-3 px-4 py-3 text-muted-foreground/60">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs flex items-center gap-1 flex-1">
                        <Plus className="h-3 w-3" /> {t(labelKey)}
                      </span>
                    </div>
                  );
                }

                const ingText = Array.isArray(ings) && ings.length > 0
                  ? ings.map((i) => i.name).join(", ")
                  : "";

                return (
                  <div key={type} className="flex items-start gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t(labelKey)}
                        </span>
                        {cal ? (
                          <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded px-1.5 py-0.5 leading-none shrink-0">
                            {cal} kcal
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium leading-tight text-foreground line-clamp-2">{name}</p>
                      {ingText && (
                        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2 mt-0.5">{ingText}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => onEdit(weekIndex, dayIdx, type, { name, calories: cal, ingredients: ings })}
                        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                        title={t("editMeal") || "Edit meal"}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onSwap(weekIndex, dayIdx, type, { name, calories: cal, ingredients: ings })}
                        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                        title={t("aiSwap") || "AI Swap"}
                      >
                        <Shuffle className="h-3.5 w-3.5" />
                      </button>
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