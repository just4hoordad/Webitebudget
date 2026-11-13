import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import ExtendableList from "@/components/ExtendableList";
import WeekMealRow from "@/components/WeekMealRow";

// Bento Arcade Timeline Agenda Panel:
// Consolidates all weekdays into one tactile arcade panel with a continuous
// vertical timeline rail, electric-lime active nodes, Cook/Rest & kcal pills,
// smooth animated accordion expansion, and a responsive 3-column bento layout on desktop.
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
    <div className="wmg-week bba-t bg-card text-card-foreground px-3.5 py-2.5 sm:px-5 sm:py-3.5 overflow-hidden">
      <div className="flex flex-col">
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
            const dayPreview = MEAL_TYPES.map(({ type }) => day[type])
              .filter(Boolean)
              .join(" · ");

            const railPositionCls = isOpen
              ? "[&:first-of-type>.wmg-rail]:top-[23px] [&:last-of-type>.wmg-rail]:bottom-3 [&:only-of-type>.wmg-rail]:top-[23px]"
              : "[&:first-of-type>.wmg-rail]:top-[23px] [&:last-of-type>.wmg-rail]:bottom-auto [&:last-of-type>.wmg-rail]:h-[23px] [&:only-of-type>.wmg-rail]:hidden";

            return (
              <motion.article
                key={dayIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.28,
                  delay: Math.min(dayIdx * 0.04, 0.24),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`relative border-b-2 border-[#111827]/12 dark:border-white/12 last-of-type:border-b-0 ${railPositionCls}`}
              >
                {/* Base Timeline Rail */}
                <span
                  aria-hidden="true"
                  className="wmg-rail pointer-events-none absolute left-[11px] top-0 bottom-0 w-[2.5px] bg-[#111827]/18 dark:bg-white/20 z-0"
                />

                {/* Animated Active Lime Rail */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.span
                      aria-hidden="true"
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      exit={{ scaleY: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformOrigin: "top" }}
                      className="wmg-rail pointer-events-none absolute left-[11px] top-0 bottom-0 w-[2.5px] bg-[#78a71b] z-[1]"
                    />
                  )}
                </AnimatePresence>

                {/* Day Summary Row */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggle(dayIdx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(dayIdx);
                    }
                  }}
                  className="relative z-[2] grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 py-2.5 sm:py-3 min-h-[46px] cursor-pointer select-none rounded-xl hover:bg-[#F3F8E6]/55 dark:hover:bg-secondary/45 transition-colors -mx-1 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a71b]"
                >
                  {/* Timeline Node */}
                  <span className="flex items-center justify-center">
                    <motion.span
                      animate={
                        isOpen
                          ? { scale: 1.15 }
                          : { scale: 1 }
                      }
                      transition={{ type: "spring", stiffness: 420, damping: 22 }}
                      className={`h-3.5 w-3.5 rounded-full border-2 border-[#111827] dark:border-[#78a71b] transition-colors ${
                        isOpen
                          ? "bg-[#78a71b] shadow-[1.5px_1.5px_0_#111827] ring-2 ring-[#78a71b]/35"
                          : "bg-[#F3F8E6] dark:bg-secondary"
                      }`}
                    />
                  </span>

                  {/* Day Name + Collapsed Desktop Preview */}
                  <div className="min-w-0 flex items-baseline gap-2.5">
                    <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-foreground shrink-0">
                      {day.day || `${t("day") || "Day"} ${dayIdx + 1}`}
                    </span>
                    {!isOpen && dayPreview && (
                      <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground truncate">
                        {dayPreview}
                      </span>
                    )}
                  </div>

                  {/* Right Chips & Chevron */}
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                    {onToggleCookingDay && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92, x: 1, y: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCookingDay(weekIndex, dayIdx);
                        }}
                        className={`font-heading font-black text-[10px] sm:text-[11px] leading-none capitalize px-2.5 py-1.5 rounded-full border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] whitespace-nowrap transition-colors ${
                          cooking
                            ? "bg-[#78a71b] text-[#111827] hover:bg-[#8bc121]"
                            : "bg-[#F3F8E6] dark:bg-secondary text-[#111827]/85 dark:text-foreground dark:border-[#78a71b]/70 hover:bg-[#FFB020] hover:text-[#111827]"
                        }`}
                        title={
                          cooking
                            ? t("cookingDay") || "Cooking day"
                            : t("restDay") || "Rest day"
                        }
                      >
                        {cooking ? t("cook") || "Cook" : t("rest") || "Rest"}
                      </motion.button>
                    )}

                    {dayTotal > 0 && (
                      <span className="font-heading font-black text-[10px] sm:text-[11px] leading-none tabular-nums bg-[#FFB020] text-[#111827] border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] px-2.5 py-1.5 rounded-full whitespace-nowrap">
                        {dayTotal.toLocaleString()} kcal
                      </span>
                    )}

                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 360, damping: 26 }}
                      className="h-6 w-6 rounded-full bg-[#F3F8E6] dark:bg-secondary border-[1.5px] border-[#111827] dark:border-[#78a71b]/70 grid place-items-center text-[#111827] dark:text-foreground shrink-0"
                    >
                      <ChevronDown className="h-3.5 w-3.5 stroke-[2.6]" />
                    </motion.span>
                  </div>
                </div>

                {/* Smooth Animated Accordion Body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="meals"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 sm:ml-7 mb-3 pl-3 border-l-[2.5px] border-[#78a71b] flex flex-col md:border-l-0 md:pl-0 md:pt-1 md:grid md:grid-cols-3 md:gap-2.5">
                        {MEAL_TYPES.map(({ type, labelKey }, mIdx) => (
                          <WeekMealRow
                            key={type}
                            index={mIdx}
                            type={type}
                            label={t(labelKey)}
                            name={day[type]}
                            cal={day[`${type}_calories`]}
                            ings={day[`${type}_ingredients`]}
                            locked={isLocked(dayIdx, type)}
                            isPro={isPro}
                            weekIndex={weekIndex}
                            dayIdx={dayIdx}
                            t={t}
                            onToggleLock={onToggleLock}
                            onEdit={onEdit}
                            onSwap={onSwap}
                            onRecipe={onRecipe}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          }}
        />
      </div>
    </div>
  );
}