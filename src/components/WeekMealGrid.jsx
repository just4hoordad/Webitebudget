import { useState } from "react";
import { Shuffle, Edit2, Plus, Sun, Utensils, Moon, ChefHat, Lock, ChevronDown, Flame } from "lucide-react";
import ExtendableList from "@/components/ExtendableList";

// Per-day card layout: each day is a vertical card with breakfast/lunch/dinner rows.
// Clearer on mobile than a horizontal day×meal grid. Days are collapsible to
// keep long plans scannable — only the first day is expanded by default.
// Supports cooking-day toggles and meal locking — locked meals survive
// "regenerate remaining" because the parent skips them.
// Long plans (24-30 days) are progressively disclosed via ExtendableList so
// only the first 7 day cards render until the user expands.
const MEAL_TYPES = [
  { type: "breakfast", labelKey: "breakfast", Icon: Sun, badgeBg: "bg-[#FFB020]" },
  { type: "lunch", labelKey: "lunch", Icon: Utensils, badgeBg: "bg-[#78a71b]" },
  { type: "dinner", labelKey: "dinner", Icon: Moon, badgeBg: "bg-[#C084FC]" },
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
    <div className="space-y-3.5">
      <ExtendableList
        items={days}
        limit={7}
        renderItem={(day, dayIdx) => {
        const dayTotal =
          (day.breakfast_calories || 0) +
          (day.lunch_calories || 0) +
          (day.dinner_calories || 0);
        const isOpen = expanded.has(dayIdx);
        const cooking = isCookingDay(dayIdx);

        return (
          <div key={dayIdx} className={`bba-t bg-card text-card-foreground p-0 overflow-hidden transition-opacity ${cooking ? "" : "opacity-65"}`}>
            {/* Day header — tap to expand/collapse */}
            <button
              type="button"
              onClick={() => toggle(dayIdx)}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#F3F8E6] dark:bg-secondary text-left ${
                isOpen ? "border-b-[2.5px] border-[#111827] dark:border-[#78a71b]" : ""
              }`}
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-2 font-heading font-black text-sm text-[#111827] dark:text-foreground uppercase tracking-wide">
                <span className="h-6 w-6 rounded-lg bg-white border-2 border-[#111827] flex items-center justify-center shrink-0 text-[#111827]">
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
                </span>
                {day.day || `${t("day") || "Day"} ${dayIdx + 1}`}
              </span>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {onToggleCookingDay && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onToggleCookingDay(weekIndex, dayIdx); }}
                    className={`flex items-center gap-1 text-[10px] font-heading font-black uppercase px-2.5 py-0.5 rounded-full border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] transition-colors ${
                      cooking
                        ? "bg-[#78a71b] text-[#111827]"
                        : "bg-white text-[#111827]/70"
                    }`}
                    title={cooking ? (t("cookingDay") || "Cooking day") : (t("restDay") || "Rest day")}
                  >
                    <Flame className="h-3 w-3" />
                    {cooking ? (t("cook") || "Cook") : (t("rest") || "Rest")}
                  </span>
                )}
                {dayTotal > 0 && (
                  <span className="text-xs font-heading font-black text-[#111827] bg-[#FFB020] border-[1.5px] border-[#111827] rounded-full px-2.5 py-0.5 shadow-[1.5px_1.5px_0_#111827]">
                    {dayTotal.toLocaleString()} kcal
                  </span>
                )}
              </div>
            </button>

            {/* Meal rows */}
            {isOpen && (
              <div className="divide-y-2 divide-[#111827]/12 dark:divide-white/15">
                {MEAL_TYPES.map(({ type, labelKey, Icon, badgeBg }) => {
                  const name = day[type];
                  const cal = day[`${type}_calories`];
                  const ings = day[`${type}_ingredients`];
                  const locked = isLocked(dayIdx, type);

                  if (!name) {
                    return (
                      <div key={type} className="flex items-center gap-3 px-4 py-3 text-muted-foreground/60">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold flex items-center gap-1 flex-1">
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
                    <div key={type} className={`flex items-start gap-3 px-4 py-3.5 ${locked ? "bg-[#FFB020]/15" : ""}`}>
                      <div className={`h-9 w-9 rounded-xl ${badgeBg} border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0 mt-0.5 text-[#111827]`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground">
                            {t(labelKey)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {locked && (
                              <span className="text-[10px] font-heading font-black text-[#111827] bg-[#FFB020] border border-[#111827] rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5" />
                              </span>
                            )}
                            {cal ? (
                              <span className="text-[10px] font-heading font-black text-[#111827] bg-[#F3F8E6] border-[1.5px] border-[#111827] rounded-full px-2 py-0.5 leading-none shrink-0">
                                {cal} kcal
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-sm font-heading font-extrabold leading-snug text-foreground line-clamp-2">{name}</p>
                        {ingText && (
                          <p className="text-[11px] font-medium leading-snug text-muted-foreground line-clamp-2 mt-0.5">{ingText}</p>
                        )}
                      </div>
                      <div className="flex items-center sm:flex-row flex-wrap gap-1 shrink-0 max-w-[92px] sm:max-w-none justify-end">
                        {onToggleLock && (
                          <button
                            type="button"
                            onClick={() => onToggleLock(weekIndex, dayIdx, type)}
                            className={`h-7 w-7 rounded-lg border-[1.5px] border-[#111827] dark:border-[#78a71b] flex items-center justify-center transition-all ${
                              locked
                                ? "bg-[#FFB020] text-[#111827] shadow-[1.5px_1.5px_0_#111827]"
                                : "bg-white dark:bg-secondary text-foreground hover:bg-[#FFB020] hover:text-[#111827]"
                            }`}
                            title={locked ? (t("unlockMeal") || "Unlock meal") : (t("lockMeal") || "Lock meal")}
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(weekIndex, dayIdx, type, mealObj)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-secondary text-foreground border-[1.5px] border-[#111827] dark:border-[#78a71b] hover:bg-[#7DD3FC] hover:text-[#111827] flex items-center justify-center transition-all"
                          title={t("editMeal") || "Edit meal"}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSwap(weekIndex, dayIdx, type, mealObj)}
                          className="h-7 w-7 rounded-lg bg-white dark:bg-secondary text-foreground border-[1.5px] border-[#111827] dark:border-[#78a71b] hover:bg-[#78a71b] hover:text-[#111827] flex items-center justify-center transition-all"
                          title={t("aiSwap") || "AI Swap"}
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRecipe(weekIndex, dayIdx, type, mealObj)}
                          className={`relative h-7 rounded-lg border-[1.5px] flex items-center justify-center transition-all ${
                            isPro
                              ? "w-7 bg-white dark:bg-secondary text-foreground border-[#111827] dark:border-[#78a71b] hover:bg-[#FF8FB5] hover:text-[#111827]"
                              : "px-1.5 gap-1 bba-locked-arcade text-[#F3F8E6]/75 border-[#111827] dark:border-[#FFB020]/70 hover:text-white shadow-[1.5px_1.5px_0_#FFB020]"
                          }`}
                          title={isPro ? (t("recipe") || "Recipe") : (t("recipePro") || "Unlock AI Recipe — Pro")}
                        >
                          <ChefHat className="h-3.5 w-3.5 shrink-0" />
                          {!isPro && (
                            <span className="inline-flex items-center gap-0.5 bg-[#FFB020] text-[#111827] rounded px-1 py-0.5 text-[8px] font-heading font-black leading-none">
                              <Lock className="h-2 w-2 stroke-[3]" /> PRO
                            </span>
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
      }}
      />
    </div>
  );
}