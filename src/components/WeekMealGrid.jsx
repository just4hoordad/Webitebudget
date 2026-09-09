import { Shuffle, Edit2, Plus } from "lucide-react";

// mise.cooking-style week grid: day columns × meal-type rows, dashed cells.
// Compact, horizontally scrollable on small screens with a sticky meal-label column.
export default function WeekMealGrid({ week, weekIndex, t, onEdit, onSwap }) {
  const mealTypes = [
    { type: "breakfast", label: t("breakfast") },
    { type: "lunch", label: t("lunch") },
    { type: "dinner", label: t("dinner") },
  ];
  const days = week.days || [];
  // Always render 7 columns; pad missing days (partial final week) with empty slots.
  const columns = Array.from({ length: 7 }, (_, i) => days[i] || null);

  const COLS = "64px repeat(7, minmax(86px, 1fr))";

  const renderCell = (day, dayIdx, mealType, mealLabel) => {
    if (!day) {
      return (
        <div
          key={`${dayIdx}-${mealType}`}
          className="border border-dashed border-border/60 rounded-lg min-h-[92px] bg-muted/20"
        />
      );
    }
    const name = day[mealType];
    const cal = day[`${mealType}_calories`];
    const ings = day[`${mealType}_ingredients`];

    if (!name) {
      return (
        <div
          key={`${dayIdx}-${mealType}`}
          className="border border-dashed border-border rounded-lg min-h-[92px] flex items-center justify-center"
        >
          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
            <Plus className="h-3 w-3" /> {mealLabel}
          </span>
        </div>
      );
    }

    const ingText = Array.isArray(ings) && ings.length > 0
      ? ings.map((i) => i.name).join(", ")
      : "";

    return (
      <div
        key={`${dayIdx}-${mealType}`}
        className="border border-dashed border-primary/30 rounded-lg min-h-[92px] p-2 bg-primary/5 flex flex-col gap-1"
      >
        <div className="flex items-center justify-between gap-1">
          {cal ? (
            <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded px-1 py-0.5 leading-none">
              {cal} kcal
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onEdit(weekIndex, dayIdx, mealType, { name, calories: cal, ingredients: ings })}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5"
              title="Edit meal"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={() => onSwap(weekIndex, dayIdx, mealType, { name, calories: cal, ingredients: ings })}
              className="text-muted-foreground hover:text-primary transition-colors p-0.5"
              title="AI Swap"
            >
              <Shuffle className="h-3 w-3" />
            </button>
          </div>
        </div>
        <p className="text-xs font-medium leading-tight text-foreground line-clamp-2">{name}</p>
        {ingText && (
          <p className="text-[10px] leading-tight text-muted-foreground line-clamp-2">{ingText}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Day header row */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="grid min-w-max" style={{ gridTemplateColumns: COLS }}>
          <div className="sticky left-0 bg-secondary/60 border-b border-border" />
          {columns.map((day, i) => (
            <div
              key={i}
              className="border-b border-border px-2 py-2 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
                {day ? day.day : "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Meal rows */}
        {mealTypes.map(({ type, label }) => (
          <div key={type} className="grid min-w-max border-t border-border" style={{ gridTemplateColumns: COLS }}>
            <div className="sticky left-0 bg-secondary/60 flex items-center justify-center px-1 py-2 border-r border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
                {label}
              </span>
            </div>
            {columns.map((day, i) => renderCell(day, i, type, label))}
          </div>
        ))}
      </div>
    </div>
  );
}