import { motion } from "framer-motion";
import { Plus, Lock, Pencil, ArrowLeftRight, ChefHat } from "lucide-react";
import ProLockBadge from "@/components/monetization/ProLockBadge";

const SLOT_BADGE_BG = {
  breakfast: "bg-[#FFB020]",
  lunch: "bg-[#7DD3FC]",
  dinner: "bg-[#C084FC]",
};

export default function WeekMealRow({
  type,
  label,
  name,
  cal,
  ings,
  locked,
  isPro,
  index = 0,
  weekIndex,
  dayIdx,
  t,
  onToggleLock,
  onEdit,
  onSwap,
  onRecipe,
}) {
  const slotBg = SLOT_BADGE_BG[type] || "bg-[#FFB020]";

  if (!name) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.045, ease: "easeOut" }}
        className="py-2.5 last:pb-1 md:py-3 md:px-3.5 md:rounded-2xl md:border-2 md:border-dashed md:border-[#111827]/35 md:dark:border-[#78a71b]/40 md:bg-[#F3F8E6]/40 md:dark:bg-secondary/30 flex items-center justify-between gap-2"
      >
        <span
          className={`${slotBg} inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-heading font-black uppercase tracking-wider text-[#111827] border-[1.5px] border-[#111827] shadow-[1px_1px_0_#111827]`}
        >
          {label}
        </span>
        {onEdit && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              onEdit(weekIndex, dayIdx, type, {
                name: "",
                calories: 0,
                ingredients: [],
                mealType: type,
              })
            }
            className="h-7 w-7 rounded-xl bg-white dark:bg-card text-foreground hover:bg-[#78a71b] hover:text-[#111827] border-[1.5px] border-[#111827] dark:border-[#78a71b] shadow-[1.5px_1.5px_0_#111827] grid place-items-center transition-colors"
            title={t("editMeal") || "Add meal"}
            aria-label={t("editMeal") || "Add meal"}
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          </motion.button>
        )}
      </motion.div>
    );
  }

  const ingText =
    Array.isArray(ings) && ings.length > 0
      ? ings.map((i) => i.name).filter(Boolean).join(", ")
      : "";

  const mealObj = {
    name,
    calories: cal,
    ingredients: ings,
    mealType: type,
  };

  const actBase =
    "h-7 w-7 rounded-xl border-[1.5px] border-[#111827] dark:border-[#78a71b]/80 shadow-[1.5px_1.5px_0_#111827] dark:shadow-[1.5px_1.5px_0_#000] grid place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78a71b]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`py-2.5 border-b-2 border-[#111827]/10 dark:border-white/10 last:border-b-0 last:pb-1 md:border-2 md:last:border-b-2 md:rounded-2xl md:p-3.5 md:flex md:flex-col md:justify-between md:shadow-[2.5px_2.5px_0_#111827] md:dark:shadow-[2.5px_2.5px_0_#000] transition-colors ${
        locked
          ? "md:bg-[#FF8FB5]/20 md:dark:bg-[#FF3E7F]/15 md:border-[#111827] md:dark:border-[#FF8FB5]"
          : "md:bg-[#F3F8E6]/75 md:dark:bg-secondary/65 md:border-[#111827] md:dark:border-[#78a71b]/70"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={`${slotBg} inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-heading font-black uppercase tracking-wider text-[#111827] border-[1.5px] border-[#111827] shadow-[1px_1px_0_#111827]`}
          >
            {label}
          </span>
          {cal ? (
            <span className="text-[10px] font-heading font-extrabold tabular-nums bg-white dark:bg-card text-[#111827] dark:text-foreground border-[1.5px] border-[#111827] dark:border-[#78a71b]/70 rounded-full px-2 py-0.5 whitespace-nowrap">
              {cal} kcal
            </span>
          ) : null}
        </div>

        <div className="font-heading font-extrabold text-[13px] sm:text-sm text-foreground leading-snug break-words">
          {name}
        </div>

        {ingText && (
          <div className="font-body text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-1 break-words">
            {ingText}
          </div>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
        {onToggleLock && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.9, x: 1, y: 1 }}
            aria-pressed={!!locked}
            onClick={() => onToggleLock(weekIndex, dayIdx, type)}
            className={`${actBase} ${
              locked
                ? "bg-[#FF3E7F] text-white border-[#111827]"
                : "bg-white dark:bg-card text-foreground hover:bg-[#FF8FB5] hover:text-[#111827]"
            }`}
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
            <Lock className="h-3.5 w-3.5 stroke-[2.3]" />
          </motion.button>
        )}

        {onEdit && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.9, x: 1, y: 1 }}
            onClick={() => onEdit(weekIndex, dayIdx, type, mealObj)}
            className={`${actBase} bg-white dark:bg-card text-foreground hover:bg-[#FFB020] hover:text-[#111827]`}
            title={t("editMeal") || "Edit meal"}
            aria-label={t("editMeal") || "Edit meal"}
          >
            <Pencil className="h-3.5 w-3.5 stroke-[2.3]" />
          </motion.button>
        )}

        {onSwap && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.9, x: 1, y: 1 }}
            onClick={() => onSwap(weekIndex, dayIdx, type, mealObj)}
            className={`${actBase} bg-white dark:bg-card text-foreground hover:bg-[#7DD3FC] hover:text-[#111827]`}
            title={t("aiSwap") || "AI Swap"}
            aria-label={t("aiSwap") || "AI Swap"}
          >
            <ArrowLeftRight className="h-3.5 w-3.5 stroke-[2.3]" />
          </motion.button>
        )}

        {onRecipe && (
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.9, x: 1, y: 1 }}
            onClick={() => onRecipe(weekIndex, dayIdx, type, mealObj)}
            className={`${actBase} ${
              isPro
                ? "bg-[#78a71b] text-[#111827] hover:bg-[#8bc121]"
                : "bba-locked-arcade text-[#F3F8E6] hover:text-white border-[#111827] dark:border-[#FFB020]/70"
            }`}
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
            <ChefHat className="h-3.5 w-3.5 stroke-[2.3]" />
          </motion.button>
        )}

        {!isPro && onRecipe && (
          <ProLockBadge
            size="xs"
            onClick={() => onRecipe(weekIndex, dayIdx, type, mealObj)}
          />
        )}
      </div>
    </motion.div>
  );
}