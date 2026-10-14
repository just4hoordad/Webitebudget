import { useState } from "react";
import { Shuffle, Edit2, Plus, Sun, Utensils, Moon, ChefHat, Lock, ChevronDown, Flame } from "lucide-react";

// Per-day card layout: each day is a vertical card with breakfast/lunch/dinner rows.
// Clearer on mobile than a horizontal day×meal grid. Days are collapsible to
// keep long plans scannable — only the first day is expanded by default.
// Supports cooking-day toggles and meal locking — locked meals survive
// "regenerate remaining" because the parent skips them.
const MEAL_TYPES = [
  { type: "breakfast", labelKey: "breakfast", Icon: Sun },
  { type: "lunch", labelKey: "lunch", Icon: Utensils },
  { type: "dinner", labelKey: "dinner", Icon: Moon },
];

export default function WeekMealGrid({ week, weekIndex, t, onEdit, onSwap, onRecipe, isPro, lockedMeals, onToggleLock, cookingDays, onToggleCookingDay }) {
  const days = (week.days || []).filter(Boolean);
  const [expanded, setExpanded] = useState(() => new Set([0]));

  if (days.length === 0) return null;

  const toggle = (dayIdx) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(dayIdx)) next.delete(dayIdx);
    else next.add(dayIdx);
    return next;
  });

  const lockKey = (dayIdx, mealType) => `${weekIndex}:${dayIdx}:${mealType}`;
  const isLocked = (dayIdx, mealType) => lockedMeals?.has(lockKey(dayIdx, mealType));
  const isCookingDay = (dayIdx) => !cookingDays || cookingDays.has(`${weekIndex}:${dayIdx}`);

  return (
    <div className="space-y-3">
      {days.map((day, dayIdx) => {
        const dayTotal =
          (day.breakfast_calories || 0) +
          (day.lunch_calories || 0) +
          (day.dinner_calories || 0);
        const isOpen = expanded.has(dayIdx);
        const cooking = isCookingDay(dayIdx);

        return (
          <div key={dayIdx} className={`bg-card border rounded-2xl overflow-hidden transition-colors ${cooking ? "border-border" : "border-border/50 opacity-60"}`}>
            {/* Day header — tap to expand/collapse */}
            <button
              type="button"
              onClick={() => toggle(dayIdx)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/10 border-b border-border text-left"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-2 font-heading font-bold text-sm text-primary uppercase tracking-wide">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                {day.day || `${t("day") || "Day"} ${dayIdx + 1}`}
              </span>
              <div className="flex items-center gap-2">
                {onToggleCookingDay && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onToggleCookingDay(weekIndex, dayIdx); }}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                      cooking
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                    title={cooking ? (t("cookingDay") || "Cooking day") : (t("restDay") || "Rest day")}
                  >
                    <Flame className={`h-3 w-3 ${cooking ? "text-primary" : ""}`} />
                    {cooking ? (t("cook") || "Cook") : (t("rest") || "Rest")}
                  </span>
                )}
                {dayTotal > 0 && (
                  <span className="text-xs font-semibold text-primary bg-primary/15 rounded-full px-2 py-0.5">
                    {dayTotal.toLocaleString()} kcal
                  </span>
                )}
              </div>
            </button>

            {/* Meal rows */}
            {isOpen && (
              <div className="divide-y divide-border">
                {MEAL_TYPES.map(({ type, labelKey, Icon }) => {
                  const name = day[type];
                  const cal = day[`${type}_calories`];
                  const ings = day[`${type}_ingredients`];
                  const locked = isLocked(dayIdx, type);

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

                  const mealObj = { name, calories: cal, ingredients: ings, mealType: type };

                  return (
                    <div key={type} className={`flex items-start gap-3 px-4 py-3 ${locked ? "bg-amber-50/40" : ""}`}>
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t(labelKey)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {locked && (
                              <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5" />
                              </span>
                            )}
                            {cal ? (
                              <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded px-1.5 py-0.5 leading-none shrink-0">
                                {cal} kcal
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm font-medium leading-tight text-foreground line-clamp-2">{name}</p>
                        {ingText && (
                          <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2 mt-0.5">{ingText}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {onToggleLock && (
                          <button
                            onClick={() => onToggleLock(weekIndex, dayIdx, type)}
                            className={`p-1 rounded-md transition-colors ${locked ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`}
                            title={locked ? (t("unlockMeal") || "Unlock meal") : (t("lockMeal") || "Lock meal")}
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(weekIndex, dayIdx, type, mealObj)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                          title={t("editMeal") || "Edit meal"}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onSwap(weekIndex, dayIdx, type, mealObj)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                          title={t("aiSwap") || "AI Swap"}
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onRecipe(weekIndex, dayIdx, type, mealObj)}
                          className="relative text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10"
                          title={isPro ? (t("recipe") || "Recipe") : (t("recipePro") || "Recipe — Pro")}
                        >
                          <ChefHat className="h-3.5 w-3.5" />
                          {!isPro && (
                            <Lock className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-foreground bg-card rounded-full p-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}