import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Store, Sparkles, CalendarDays, Users, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getDietVisual, REACTOR_COPY } from "@/lib/reactiveVisualData";

export default function PlanSetupReactor({
  diet = "",
  days = 0,
  people = 0,
  storeNames = [],
  macros = { protein: 30, carbs: 40, fats: 30 },
  showMacros = false,
  ready = false,
}) {
  const { currentLanguage } = useLanguage();
  const isDe = currentLanguage?.code === "de";
  const c = REACTOR_COPY[isDe ? "de" : "en"];

  const dietVis = getDietVisual(diet || "balanced");
  const safeDays = Math.max(0, Number(days) || 0);
  const safePeople = Math.max(0, Number(people) || 0);
  const mealSlots = safeDays * 3;

  return (
    <motion.div
      layout
      className="bba-t bg-card space-y-3.5 overflow-hidden"
      aria-live="polite"
    >
      {/* Header sticker + Readiness Pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="bba-sticker">
          <ChefHat className="h-3.5 w-3.5 text-[#78a71b]" />
          {c.loadoutTitle}
        </span>

        <motion.span
          key={ready ? "ready" : "wait"}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-black border-2 border-[#111827] shadow-[2px_2px_0_#111827] ${
            ready ? "bg-[#78a71b] text-[#111827]" : "bg-[#FFB020] text-[#111827]"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          {ready ? c.readyBadge : c.configuringBadge}
        </motion.span>
      </div>

      {/* 3 Interactive Bento Tiles: Diet Pot · Table & Days · Store Conveyor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tile 1: Diet Flavor Pot */}
        <div
          className="rounded-2xl border-[2.5px] border-[#111827] p-3 shadow-[3px_3px_0_#111827] text-[#111827] flex flex-col justify-between gap-2"
          style={{ backgroundColor: diet ? dietVis.accent : "#F3F8E6" }}
        >
          <span className="text-[10px] font-heading font-black uppercase tracking-wider opacity-80">
            01 · Menu Style
          </span>
          <div className="flex items-center gap-1.5 flex-wrap min-h-[36px]">
            <AnimatePresence mode="popLayout">
              {diet ? (
                dietVis.foods.slice(0, 4).map((f, i) => (
                  <motion.span
                    key={`${diet}-${f}`}
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18, delay: i * 0.04 }}
                    className="h-8 w-8 rounded-xl bg-white border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] flex items-center justify-center text-base"
                  >
                    {f}
                  </motion.span>
                ))
              ) : (
                <span className="text-xs font-heading font-extrabold opacity-70">
                  🍽️ {c.pickDietHint}
                </span>
              )}
            </AnimatePresence>
          </div>
          <span className="text-xs font-heading font-black truncate">
            {diet ? (isDe ? dietVis.badgeDe : dietVis.badge) : "—"}
          </span>
        </div>

        {/* Tile 2: Animated Table Setting & Calendar Stack */}
        <div className="rounded-2xl bg-[#7DD3FC] text-[#111827] border-[2.5px] border-[#111827] p-3 shadow-[3px_3px_0_#111827] flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-[10px] font-heading font-black uppercase tracking-wider">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.tableFor} {safePeople || "?"}</span>
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {safeDays || "?"}d</span>
          </div>

          {/* Animated plates around the table */}
          <div className="flex items-center gap-1.5 min-h-[36px]">
            <AnimatePresence mode="popLayout">
              {safePeople > 0 ? (
                Array.from({ length: Math.min(safePeople, 4) }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] flex items-center justify-center text-sm"
                    title={`Person ${idx + 1}`}
                  >
                    🍽️
                  </motion.div>
                ))
              ) : (
                <span className="text-xs font-heading font-bold opacity-75">1–4 👥</span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-1 text-[11px] font-heading font-black">
            <span>{mealSlots} {c.PlannedSlots}</span>
            <span className="inline-flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded-md border border-[#111827] text-[10px]">
              <BookOpen className="h-2.5 w-2.5" /> {c.recipesUnlocked}
            </span>
          </div>
        </div>

        {/* Tile 3: Store Crates */}
        <div className="rounded-2xl bg-[#161e2e] text-[#F3F8E6] border-[2.5px] border-[#111827] p-3 shadow-[3px_3px_0_#111827] flex flex-col justify-between gap-2">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-[#FFB020] flex items-center gap-1">
            <Store className="h-3 w-3" /> 03 · Store Radar ({storeNames.length})
          </span>

          <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
            <AnimatePresence mode="popLayout">
              {storeNames.length > 0 ? (
                storeNames.slice(0, 4).map((s) => (
                  <motion.span
                    key={s}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="px-2.5 py-1 rounded-xl bg-[#FFB020] text-[#111827] border-2 border-[#111827] text-[11px] font-heading font-black shadow-[1.5px_1.5px_0_#78a71b]"
                  >
                    {s}
                  </motion.span>
                ))
              ) : (
                <span className="text-xs font-heading font-bold text-[#F3F8E6]/65">
                  🏪 {c.pickStoreHint}
                </span>
              )}
            </AnimatePresence>
          </div>

          <span className="text-[10px] font-bold text-[#7DD3FC] truncate">
            {storeNames.length > 0 ? "✓ Cheapest item match active" : "Aldi · Lidl · REWE · Edeka…"}
          </span>
        </div>
      </div>

      {/* Live Macro Split Bar when Detailed Mode macros are active */}
      {showMacros && (
        <div className="rounded-xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] p-2.5 space-y-1.5">
          <div className="flex justify-between text-[10px] font-heading font-black uppercase text-[#111827] dark:text-foreground">
            <span>🥩 P {macros.protein}%</span>
            <span>🌾 C {macros.carbs}%</span>
            <span>🥑 F {macros.fats}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white border border-[#111827] overflow-hidden flex">
            <motion.div animate={{ width: `${macros.protein}%` }} className="bg-[#FF3E7F] h-full" />
            <motion.div animate={{ width: `${macros.carbs}%` }} className="bg-[#FFB020] h-full" />
            <motion.div animate={{ width: `${macros.fats}%` }} className="bg-[#78a71b] h-full" />
          </div>
        </div>
      )}
    </motion.div>
  );
}