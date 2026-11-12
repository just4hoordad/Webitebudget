import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

const CART_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/bb9cbb17d_generated_50e6f515.jpg";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.05,
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

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 26,
    restDelta: 0.001,
  });

  // Scroll-driven transforms
  const cardScale = useTransform(smoothProgress, [0, 1], [1, 0.95]);
  const cardY = useTransform(smoothProgress, [0, 1], [0, 22]);
  const headlineY = useTransform(smoothProgress, [0, 1], [0, -16]);
  const badgeRotate = useTransform(smoothProgress, [0, 0.6, 1], [-2, 5, -6]);
  const badgeScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.08, 0.98]);
  const wheelScrollRotate = useTransform(smoothProgress, [0, 1], [0, 160]);
  const wheelScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.06, 0.92]);
  const cartScale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.16, 1.04]);
  const cartY = useTransform(smoothProgress, [0, 1], [0, -18]);
  const chipLeftY = useTransform(smoothProgress, [0, 1], [0, -36]);
  const chipRightY = useTransform(smoothProgress, [0, 1], [0, 30]);
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0]);

  return (
    <motion.div
      ref={heroRef}
      style={{ scale: cardScale, y: cardY }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bba-t bba-hero relative overflow-hidden"
      aria-label="BudgetBite hero"
    >
      {/* Top arcade intro sticker */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-2">
        <span className="bba-sticker">
          <span className="inline-block h-2 w-2 rounded-full bg-[#78a71b] animate-pulse" />
          Smart Grocery Arcade
        </span>
        {onOpenIntro && (
          <button
            type="button"
            onClick={onOpenIntro}
            className="text-[11px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border-2 border-[#111827] bg-[#FFB020] text-[#111827] shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
          >
            ▶ How it works
          </button>
        )}
      </motion.div>

      {/* Scroll-reactive headline */}
      <motion.h1 variants={itemVariants} style={{ y: headlineY }}>
        {t("heroHeadline") || "Eat well on"}{" "}
        <motion.span
          style={{ rotate: badgeRotate, scale: badgeScale }}
          className="inline-block origin-center"
        >
          {t("heroHeadline2") || "any budget"}
        </motion.span>
      </motion.h1>

      <motion.p variants={itemVariants} className="bba-lead">
        {t("heroLead") ||
          "Smart meal plans and grocery lists based on real German supermarket prices. Save money, eat healthy, stress less."}
      </motion.p>

      {/* CTA Buttons */}
      <motion.div variants={itemVariants} className="bba-acts">
        <Link to="/budget" className="bba-btn bba-b1">
          {t("startPlanning") || "Start planning"}{" "}
          <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <Link to="/community" className="bba-btn bba-b2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14.5c2.2.7 3.5 2.7 3.5 5.5" />
          </svg>
          {t("browseCommunity") || "Browse community"}
        </Link>
      </motion.div>

      {/* Scroll-accelerated wheel & parallax floating badges */}
      <motion.div
        variants={itemVariants}
        style={{ scale: wheelScale }}
        className="bba-vis"
        aria-label="Supported stores"
      >
        {/* Floating parallax chips that react to scroll */}
        <motion.div
          style={{ y: chipLeftY }}
          className="absolute left-1 top-3 z-10 bg-[#78a71b] text-[#111827] border-2 border-[#111827] rounded-full px-2.5 py-1 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827] -rotate-6 pointer-events-none"
        >
          ⚡ Live Flyers
        </motion.div>

        <motion.div
          style={{ y: chipRightY }}
          className="absolute right-1 bottom-3 z-10 bg-[#FFB020] text-[#111827] border-2 border-[#111827] rounded-full px-2.5 py-1 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827] rotate-6 pointer-events-none"
        >
          🏷️ Best Deal
        </motion.div>

        <motion.div style={{ rotate: wheelScrollRotate }} className=" flex items-center justify-center">
          <div className="bba-wheel">
            <span className="bba-s1">Aldi</span>
            <span className="bba-s2">Lidl</span>
            <span className="bba-s3">REWE</span>
            <span className="bba-s4">Edeka</span>
            <span className="bba-s5">Penny</span>
            <span className="bba-s6">Netto</span>
          </div>
        </motion.div>

        <motion.img
          style={{ scale: cartScale, y: cartY }}
          className="bba-cart"
          src={CART_IMG}
          alt="Miniature shopping cart racing through fresh vegetables"
        />
      </motion.div>
    </motion.div>
  );
}