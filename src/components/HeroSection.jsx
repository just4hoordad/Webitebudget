import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Dices, Sparkles, Trophy } from "lucide-react";

const CART_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/bb9cbb17d_generated_50e6f515.jpg";

const STORE_LOOT = [
  { name: "Aldi", perk: "🔥 -22% Staple Basket!", bg: "bg-[#7DD3FC]" },
  { name: "Lidl", perk: "⚡ Milbona Protein Jackpot!", bg: "bg-[#FFB020]" },
  { name: "REWE", perk: "🎯 Ja! Value Combo Unlocked!", bg: "bg-[#FF8FB5]" },
  { name: "Edeka", perk: "🌿 Gut & Günstig Saver!", bg: "bg-[#78a71b]" },
  { name: "Penny", perk: "💥 Weekly Flyer Bonus!", bg: "bg-[#C084FC]" },
  { name: "Netto", perk: "🏆 Marken-Discount Crit!", bg: "bg-[#FACC15]" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 22 },
  },
};

export default function HeroSection({ onOpenIntro }) {
  const { t } = useLanguage();
  const heroRef = useRef(null);
  const [spinDeg, setSpinDeg] = useState(0);
  const [lootIndex, setLootIndex] = useState(null);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpinWheel = () => {
    const nextIdx = Math.floor(Math.random() * STORE_LOOT.length);
    const extraTurns = 360 * 2 + Math.floor(Math.random() * 180) + 90;
    setSpinDeg((prev) => prev + extraTurns);
    setSpinCount((c) => c + 1);
    setLootIndex(nextIdx);
  };

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  const cardScale = useTransform(smoothProgress, [0, 1], [1, 0.97]);
  const headlineY = useTransform(smoothProgress, [0, 1], [0, -10]);
  const badgeRotate = useTransform(smoothProgress, [0, 0.6, 1], [-2, 4, -4]);
  const wheelScrollRotate = useTransform(smoothProgress, [0, 1], [0, 140]);
  const chipLeftY = useTransform(smoothProgress, [0, 1], [0, -24]);
  const chipRightY = useTransform(smoothProgress, [0, 1], [0, 22]);

  const activeLoot = lootIndex !== null ? STORE_LOOT[lootIndex] : null;

  return (
    <motion.div
      ref={heroRef}
      style={{ scale: cardScale }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bba-t bba-hero relative overflow-hidden"
      aria-label="BudgetBite hero"
    >
      {/* Decorative subtle arcade corner sparkles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FFB020]/25 blur-xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-[#78a71b]/25 blur-xl" />

      {/* Top arcade intro sticker bar */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bba-sticker">
            <span className="inline-block h-2 w-2 rounded-full bg-[#78a71b] animate-pulse" />
            Smart Grocery Arcade
          </span>
          {spinCount > 0 && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-[#C084FC] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827]"
            >
              <Trophy className="h-3 w-3" /> +{spinCount * 10} XP
            </motion.span>
          )}
        </div>
        {onOpenIntro && (
          <motion.button
            whileHover={{ scale: 1.04, rotate: 1 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onOpenIntro}
            className="text-[11px] font-heading font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-[#111827] bg-[#FFB020] text-[#111827] shadow-[2px_2px_0_#111827] cursor-pointer"
          >
            ▶ How it works
          </motion.button>
        )}
      </motion.div>

      {/* Main 2-column Bento Hero body on desktop, punchy stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.95fr] gap-6 items-center pt-1">
        <div className="flex flex-col gap-4">
          <motion.h1 variants={itemVariants} style={{ y: headlineY }}>
            {t("heroHeadline") || "Eat well on"}{" "}
            <motion.span
              style={{ rotate: badgeRotate }}
              whileHover={{ scale: 1.06, rotate: 2 }}
              className="inline-block origin-center cursor-default"
            >
              {t("heroHeadline2") || "any budget"}
            </motion.span>
          </motion.h1>

          <motion.p variants={itemVariants} className="bba-lead">
            {t("heroLead") ||
              "Smart meal plans and grocery lists based on real German supermarket prices. Save money, eat healthy, stress less."}
          </motion.p>

          {/* Interactive mini power-up pills */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-xl bg-[#F3F8E6] dark:bg-secondary text-[#111827] dark:text-foreground border-2 border-[#111827] dark:border-[#78a71b] px-2.5 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0_#111827]">
              🛒 10+ Supermarkets
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-[#FF8FB5] text-[#111827] border-2 border-[#111827] px-2.5 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0_#111827]">
              🥗 8 Diet Classes
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl bg-[#7DD3FC] text-[#111827] border-2 border-[#111827] px-2.5 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0_#111827]">
              ⚡ Instant Loot List
            </span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="bba-acts sm:flex-row">
            <Link to="/budget" className="bba-btn bba-b1 flex-1 px-5">
              {t("startPlanning") || "Start planning"}{" "}
              <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link to="/community" className="bba-btn bba-b2 flex-1 px-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14.5c2.2.7 3.5 2.7 3.5 5.5" />
              </svg>
              {t("browseCommunity") || "Browse community"}
            </Link>
          </motion.div>
        </div>

        {/* Interactive Spin-the-Store Arcade Wheel */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <div className="bba-vis w-full" aria-label="Interactive store wheel">
            <motion.div
              style={{ y: chipLeftY }}
              className="absolute left-1 top-2 z-10 bg-[#78a71b] text-[#111827] border-2 border-[#111827] rounded-full px-2.5 py-1 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827] -rotate-6 pointer-events-none"
            >
              ⚡ Live Flyers
            </motion.div>

            <motion.div
              style={{ y: chipRightY }}
              className="absolute right-1 bottom-2 z-10 bg-[#FFB020] text-[#111827] border-2 border-[#111827] rounded-full px-2.5 py-1 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827] rotate-6 pointer-events-none"
            >
              🏷️ Best Deal
            </motion.div>

            <motion.div
              style={{ rotate: wheelScrollRotate }}
              className="flex items-center justify-center cursor-pointer"
              onClick={handleSpinWheel}
              title="Tap to spin the store wheel!"
            >
              <motion.div
                animate={{ rotate: spinDeg }}
                transition={{ type: "spring", stiffness: 65, damping: 14 }}
                className="flex items-center justify-center"
              >
                <div className="bba-wheel">
                  <span className="bba-s1">Aldi</span>
                  <span className="bba-s2">Lidl</span>
                  <span className="bba-s3">REWE</span>
                  <span className="bba-s4">Edeka</span>
                  <span className="bba-s5">Penny</span>
                  <span className="bba-s6">Netto</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.img
              whileHover={{ scale: 1.12, rotate: 6 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleSpinWheel}
              className="bba-cart cursor-pointer"
              src={CART_IMG}
              alt="Miniature shopping cart racing through fresh vegetables"
            />
          </div>

          {/* Interactive Spin button + loot reveal */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleSpinWheel}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-[#F3F8E6] dark:bg-[#FFB020] dark:text-[#111827] border-2 border-[#111827] px-3.5 py-1.5 text-xs font-heading font-black shadow-[2.5px_2.5px_0_#FF3E7F] cursor-pointer"
            >
              <Dices className="h-3.5 w-3.5" />
              Spin Store Wheel!
            </motion.button>

            <AnimatePresence mode="wait">
              {activeLoot && (
                <motion.span
                  key={`${activeLoot.name}-${spinCount}`}
                  initial={{ opacity: 0, y: 8, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 380, damping: 20 }}
                  className={`inline-flex items-center gap-1.5 rounded-full ${activeLoot.bg} text-[#111827] border-2 border-[#111827] px-3 py-1 text-xs font-heading font-black shadow-[2px_2px_0_#111827]`}
                >
                  <Sparkles className="h-3 w-3" />
                  {activeLoot.name}: {activeLoot.perk}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}