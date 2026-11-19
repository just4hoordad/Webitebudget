import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBasket, Store, Sparkles, Tag, Leaf, Utensils, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getDietVisual, getBudgetTier, REACTOR_COPY } from "@/lib/reactiveVisualData";

export default function BudgetLiveReactor({
  budget = 0,
  days = 1,
  people = 1,
  diet = "balanced",
  storeNames = [],
  saleHunt = false,
  bio = false,
  canGenerate = false,
}) {
  const { currentLanguage } = useLanguage();
  const isDe = currentLanguage?.code === "de";
  const c = REACTOR_COPY[isDe ? "de" : "en"];
  const safeDays = Math.max(1, Number(days) || 1);
  const safePeople = Math.max(1, Number(people) || 1);
  const totalMeals = safeDays * safePeople * 3;
  const hasBudget = budget > 0;
  const perPersonDay = hasBudget ? budget / (safeDays * safePeople) : 0;
  const perMeal = hasBudget ? budget / totalMeals : 0;

  const dietVis = getDietVisual(diet);
  const tier = getBudgetTier(perPersonDay, hasBudget, isDe);
  const visibleFoods = dietVis.foods.slice(0, tier.fillCount);

  return (
    <motion.div
      layout
      className="bba-t bg-card relative overflow-hidden space-y-3.5"
      aria-live="polite"
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="bba-sticker">
          <ShoppingBasket className="h-3.5 w-3.5 text-[#FFB020]" />
          {c.livePreview}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          <AnimatePresence>
            {saleHunt && (
              <motion.span
                key="sale"
                initial={{ scale: 0, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-black bg-[#FFB020] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827]"
              >
                <Tag className="h-3 w-3" /> {c.saleRadar}
              </motion.span>
            )}
            {bio && (
              <motion.span
                key="bio"
                initial={{ scale: 0, rotate: 8 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-black bg-[#78a71b] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827]"
              >
                <Leaf className="h-3 w-3" /> {c.bioBoost}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.span
            key={canGenerate ? "ready" : "tuning"}
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-black border-2 border-[#111827] shadow-[2px_2px_0_#111827] ${
              canGenerate ? "bg-[#78a71b] text-[#111827]" : "bg-[#F3F8E6] text-[#111827]"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            {canGenerate ? c.readyBadge : c.configuringBadge}
          </motion.span>
        </div>
      </div>

      {/* Main 2-column reactive stage */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_0.85fr] gap-3.5 items-stretch">
        {/* Left: Live math + Comfort Gauge */}
        <div
          className="rounded-2xl border-[2.5px] border-[#111827] p-3.5 flex flex-col justify-between gap-3 shadow-[3px_3px_0_#111827] text-[#111827]"
          style={{ backgroundColor: dietVis.tint }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <motion.div
                key={Math.round(perPersonDay * 10)}
                initial={{ y: -6, opacity: 0.6 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 20 }}
                className="font-heading font-black text-2xl sm:text-3xl leading-none tabular-nums"
              >
                €{perPersonDay.toFixed(2)}
                <span className="text-xs font-bold opacity-75 ml-1">{c.perDayPerson}</span>
              </motion.div>
              <p className="text-xs font-heading font-extrabold mt-1 opacity-85">
                {tier.label}
              </p>
            </div>
            <motion.span
              key={diet}
              initial={{ scale: 0.75, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              style={{ backgroundColor: dietVis.accent }}
              className="px-2.5 py-1 rounded-xl border-2 border-[#111827] font-heading font-black text-[11px] shadow-[2px_2px_0_#111827] shrink-0"
            >
              {isDe ? dietVis.badgeDe : dietVis.badge}
            </motion.span>
          </div>

          {/* Animated Arcade Power Gauge */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded-full bg-white border-2 border-[#111827] overflow-hidden p-0.5">
              <motion.div
                animate={{ width: `${tier.pct}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                style={{ backgroundColor: tier.color }}
                className="h-full rounded-full bba-progress-stripes border border-[#111827]/40"
              />
            </div>
            <p className="text-[11px] font-semibold opacity-80 leading-snug">{tier.sub}</p>
          </div>

          {/* Stat chips row */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 bg-white border-2 border-[#111827] rounded-lg px-2 py-0.5 text-[11px] font-heading font-black tabular-nums">
              <Utensils className="h-3 w-3" /> {totalMeals} {c.mealsTotal}
            </span>
            {hasBudget && (
              <span className="inline-flex items-center gap-1 bg-[#FFB020] border-2 border-[#111827] rounded-lg px-2 py-0.5 text-[11px] font-heading font-black tabular-nums">
                ~€{perMeal.toFixed(2)} {c.perMeal}
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-white border-2 border-[#111827] rounded-lg px-2 py-0.5 text-[11px] font-heading font-black">
              <Users className="h-3 w-3" /> {safePeople}p · {safeDays}d
            </span>
          </div>
        </div>

        {/* Right: Animated Shopping Basket + Store Crates */}
        <div className="rounded-2xl bg-[#161e2e] text-[#F3F8E6] border-[2.5px] border-[#111827] p-3.5 flex flex-col justify-between gap-2.5 shadow-[3px_3px_0_#111827]">
          <div className="flex items-center justify-between text-[11px] font-heading font-black uppercase tracking-wider text-[#FFB020]">
            <span>🛒 Loot Basket</span>
            <span className="text-[#7DD3FC]">€{budget || 0}</span>
          </div>

          {/* Bouncing items inside basket */}
          <div className="min-h-[54px] rounded-xl bg-white/10 border-2 border-dashed border-white/25 px-2.5 py-2 flex items-center justify-center gap-1.5 flex-wrap">
            <AnimatePresence mode="popLayout">
              {visibleFoods.length > 0 ? (
                visibleFoods.map((emoji, idx) => (
                  <motion.span
                    key={`${diet}-${emoji}-${idx}`}
                    initial={{ scale: 0, y: -18, rotate: -15 }}
                    animate={{ scale: 1, y: 0, rotate: idx % 2 === 0 ? -4 : 4 }}
                    exit={{ scale: 0, y: 12 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18, delay: idx * 0.04 }}
                    className="h-9 w-9 rounded-xl bg-white text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#78a71b] flex items-center justify-center text-lg select-none"
                  >
                    {emoji}
                  </motion.span>
                ))
              ) : (
                <motion.span
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  className="text-xs font-heading font-bold text-center text-[#F3F8E6]/70"
                >
                  🪙 €0 → 🧺
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Store Radar Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Store className="h-3.5 w-3.5 text-[#78a71b] shrink-0" />
            <AnimatePresence mode="popLayout">
              {storeNames.length > 0 ? (
                storeNames.slice(0, 4).map((name) => (
                  <motion.span
                    key={name}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="px-2 py-0.5 rounded-full bg-[#78a71b] text-[#111827] border border-[#111827] text-[10px] font-heading font-black"
                  >
                    {name}
                  </motion.span>
                ))
              ) : (
                <span className="text-[11px] font-semibold text-[#F3F8E6]/65">
                  {c.pickStorePrompt}
                </span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}