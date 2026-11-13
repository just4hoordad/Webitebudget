import { useState } from "react";
import { Plus } from "lucide-react";
import ExtendableList from "@/components/ExtendableList";
import "@/components/WeekMealGrid.css";

// Timeline Agenda Panel: consolidates all weekdays into one rounded linen panel
// with hairline dividers, a continuous vertical timeline rail, right-aligned
// cook/rest chips beside calorie totals, and indented meal rows when expanded.
const MEAL_TYPES = [
  { type: "breakfast", labelKey: "breakfast" },
  { type: "lunch", labelKey: "lunch" },
  { type: "dinner", labelKey: "dinner" },
];

export default function WeekMealGrid({
  week,
  weekIndex,
  t,
  onEdit,
  onSwap,
  onRecipe,
  isPro,
  lockedMeals,
  onToggleLock,
  cookingDays,
  onToggleCookingDay,
}) {
  const days = (week.days || []).filter(Boolean);
  const [expanded, setExpanded] = useState(() => new Set([0]));

  if (days.length === 0) return null;

  const toggle = (dayIdx) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(dayIdx)) next.delete(dayIdx);
      else next.add(dayIdx);
      return next;
    });

  const lockKey = (dayIdx, mealType) => `${weekIndex}:${dayIdx}:${mealType}`;
  const isLocked = (dayIdx, mealType) => lockedMeals?.has(lockKey(dayIdx, mealType));
  const isCookingDay = (dayIdx) => !cookingDays || cookingDays.has(`${weekIndex}:${dayIdx}`);

  return (
    <div className="wmg-week">
      <div className="wmg-days">
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
              <details
                key={dayIdx}
                className={`wmg-day${cooking ? "" : " wmg-rest"}`}
                open={isOpen}
              >
                <summary
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(dayIdx);
                  }}
                >
                  <span className="wmg-rail" />
                  <span className="wmg-node" />
                  <span className="wmg-dayname">
                    {day.day || `${t("day") || "Day"} ${dayIdx + 1}`}
                  </span>
                  <span className="wmg-right">
                    {onToggleCookingDay && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleCookingDay(weekIndex, dayIdx);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleCookingDay(weekIndex, dayIdx);
                          }
                        }}
                        className="wmg-chip wmg-state"
                        title={
                          cooking
                            ? t("cookingDay") || "Cooking day"
                            : t("restDay") || "Rest day"
                        }
                      >
                        {cooking ? t("cook") || "Cook" : t("rest") || "Rest"}
                      </span>
                    )}
                    {dayTotal > 0 && (
                      <span className="wmg-chip wmg-cal">
                        {dayTotal.toLocaleString()} kcal
                      </span>
                    )}
                  </span>
                </summary>

                {isOpen && (
                  <div className="wmg-meals">
                    {MEAL_TYPES.map(({ type, labelKey }) => {
                      const name = day[type];
                      const cal = day[`${type}_calories`];
                      const ings = day[`${type}_ingredients`];
                      const locked = isLocked(dayIdx, type);

                      if (!name) {
                        return (
                          <div key={type} className="wmg-meal">
                            <div className="wmg-meta" style={{ marginBottom: 0 }}>
                              <span className="wmg-kind">{t(labelKey)}</span>
                              {onEdit && (
                                <button
                                  type="button"
                                  className="wmg-act"
                                  onClick={() =>
                                    onEdit(weekIndex, dayIdx, type, {
                                      name: "",
                                      calories: 0,
                                      ingredients: [],
                                      mealType: type,
                                    })
                                  }
                                  title={t("editMeal") || "Add meal"}
                                  aria-label={t("editMeal") || "Add meal"}
                                >
                                  <Plus />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      const ingText =
                        Array.isArray(ings) && ings.length > 0
                          ? ings.map((i) => i.name).join(", ")
                          : "";

                      const mealObj = {
                        name,
                        calories: cal,
                        ingredients: ings,
                        mealType: type,
                      };

                      return (
                        <div key={type} className="wmg-meal">
                          <div className="wmg-meta">
                            <span className="wmg-kind">{t(labelKey)}</span>
                            {cal ? (
                              <span className="wmg-mealcal">{cal} kcal</span>
                            ) : null}
                          </div>
                          <div className="wmg-name">{name}</div>
                          {ingText && (
                            <div className="wmg-ingredients">{ingText}</div>
                          )}
                          <div className="wmg-actions">
                            {onToggleLock && (
                              <button
                                type="button"
                                className="wmg-act"
                                aria-pressed={!!locked}
                                onClick={() => onToggleLock(weekIndex, dayIdx, type)}
                                title={
                                  locked
                                    ? t("unlockMeal") || "Unlock meal"
                                    : t("lockMeal") || "Lock meal"
                                }
                                aria-label={
                                  locked
                                    ? t("unlockMeal") || "Unlock meal"
                                    : t("lockMeal") || "Lock meal"
                                }
                              >
                                <svg viewBox="0 0 16 16">
                                  <rect x="3" y="7" width="10" height="7" rx="1.5" />
                                  <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              className="wmg-act"
                              onClick={() => onEdit(weekIndex, dayIdx, type, mealObj)}
                              title={t("editMeal") || "Edit meal"}
                              aria-label={t("editMeal") || "Edit meal"}
                            >
                              <svg viewBox="0 0 16 16">
                                <path d="m3 11.5-.5 2 2-.5L13 4.5 11.5 3z" />
                                <path d="m10.5 4 1.5 1.5" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="wmg-act"
                              onClick={() => onSwap(weekIndex, dayIdx, type, mealObj)}
                              title={t("aiSwap") || "AI Swap"}
                              aria-label={t("aiSwap") || "AI Swap"}
                            >
                              <svg viewBox="0 0 16 16">
                                <path d="M3 5h9l-2-2M13 11H4l2 2" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="wmg-act"
                              onClick={() => onRecipe(weekIndex, dayIdx, type, mealObj)}
                              title={
                                isPro
                                  ? t("recipe") || "Recipe"
                                  : t("recipePro") || "Unlock AI Recipe — Pro"
                              }
                              aria-label={
                                isPro
                                  ? t("recipe") || "Recipe"
                                  : t("recipePro") || "Recipe PRO"
                              }
                            >
                              <svg viewBox="0 0 16 16">
                                <path d="M3 7h10a5 5 0 0 1-10 0ZM8 2v5M5 2v2M11 2v2" />
                              </svg>
                            </button>
                            {!isPro && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={() => onRecipe(weekIndex, dayIdx, type, mealObj)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onRecipe(weekIndex, dayIdx, type, mealObj);
                                  }
                                }}
                                className="wmg-chip wmg-cal"
                                style={{ cursor: "pointer" }}
                              >
                                PRO
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </details>
            );
          }}
        />
      </div>
    </div>
  );
}