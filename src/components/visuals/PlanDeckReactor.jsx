import { motion, AnimatePresence } from "framer-motion";
import { Sunrise, Sun, Moon, ChefHat, Flame } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { filledDishes } from "@/lib/planDishes";
import { REACTOR_COPY } from "@/lib/reactiveVisualData";

const SLOT_STYLES = [
  { key: "breakfast", Icon: Sunrise, bg: "bg-[#FFB020]", emoji: "🥐" },
  { key: "lunch", Icon: Sun, bg: "bg-[#7DD3FC]", emoji: "🥗" },
  { key: "dinner", Icon: Moon, bg: "bg-[#C084FC]", emoji: "🍝" },
];

export default function PlanDeckReactor({
  plan = [],
  activeDay = 0,
  slotType = "breakfast",
  onSelectSlot,
  slotLabels = {},
}) {
  const { currentLanguage } = useLanguage();
  const isDe = currentLanguage?.code === "de";
  const c = REACTOR_COPY[isDe ? "de" : "en"];

  const currentDayObj = plan[activeDay] || { breakfast: [], lunch: [], dinner: [] };

  // Count unique dish names across the entire plan (= distinct cooking recipes unlocked!)
  const uniqueDishSet = new Set();
  plan.forEach((day) => {
    ["breakfast", "lunch", "dinner"].forEach((k) => {
      filledDishes(day, k).forEach((d) => {
        if (d.name) uniqueDishSet.add(d.name.toLowerCase().trim());
      });
    });
  });
  const uniqueRecipesCount = uniqueDishSet.size;

  return (
    <div className="rounded-2xl bg-white/95 text-[#111827] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-heading font-black uppercase tracking-wider flex items-center gap-1.5">
          🍱 {c.trayTitle} · #{activeDay + 1}
          <span className="text-[10px] font-bold opacity-65 hidden sm:inline">({c.tapSlotHint})</span>
        </span>

        <motion.span
          key={uniqueRecipesCount}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C084FC] text-[#111827] border-2 border-[#111827] text-[11px] font-heading font-black shadow-[1.5px_1.5px_0_#111827]"
        >
          <ChefHat className="h-3 w-3" />
          {uniqueRecipesCount} {c.uniqueRecipes}
        </motion.span>
      </div>

      {/* 3 Interactive Bento Plates for Active Day */}
      <div className="grid grid-cols-3 gap-2">
        {SLOT_STYLES.map(({ key, Icon, bg, emoji }) => {
          const dishes = filledDishes(currentDayObj, key);
          const isTargeted = slotType === key;
          const topDish = dishes[0]?.name;
          const extraCount = Math.max(0, dishes.length - 1);

          return (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectSlot && onSelectSlot(key)}
              className={`relative rounded-xl p-2.5 text-left border-2 border-[#111827] transition-all flex flex-col justify-between min-h-[72px] ${
                isTargeted
                  ? `${bg} shadow-[3px_3px_0_#111827] -translate-y-0.5`
                  : dishes.length > 0
                  ? "bg-[#F3F8E6] hover:bg-[#F3F8E6]/80 shadow-[1.5px_1.5px_0_#111827]"
                  : "bg-white/80 hover:bg-[#F3F8E6]/50 border-dashed"
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[10px] font-heading font-black uppercase tracking-tight flex items-center gap-1 truncate">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{slotLabels[key] || key}</span>
                </span>
                {isTargeted && (
                  <span className="h-2 w-2 rounded-full bg-[#FF3E7F] border border-[#111827] animate-ping shrink-0" />
                )}
              </div>

              <AnimatePresence mode="wait">
                {topDish ? (
                  <motion.div
                    key={topDish + dishes.length}
                    initial={{ scale: 0.75, opacity: 0, y: 6 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.75, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 20 }}
                    className="flex items-center gap-1 mt-1.5 min-w-0"
                  >
                    <span className="text-sm shrink-0">{emoji}</span>
                    <span className="text-[11px] font-heading font-extrabold truncate leading-tight">
                      {topDish}
                    </span>
                    {extraCount > 0 && (
                      <span className="shrink-0 text-[9px] font-heading font-black px-1 rounded bg-[#111827] text-white">
                        +{extraCount}
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <motion.span
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.55 }}
                    className="text-[10px] font-bold mt-1.5 flex items-center gap-1"
                  >
                    <Flame className="h-2.5 w-2.5" /> {c.emptyPlate}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}