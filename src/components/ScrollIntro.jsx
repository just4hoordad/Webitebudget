import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Wallet, Sparkles, ShoppingBasket, ArrowRight, CheckCircle2, ChevronDown, X, Flame, Leaf } from "lucide-react";

const COPY = {
  en: {
    skip: "Skip intro",
    scrollHint: "Scroll to see how it works",
    step1Badge: "STEP 01 · YOUR RULES",
    step1Title: "Set your budget & pick your stores",
    step1Desc: "Slide to your weekly or monthly food budget and tap the German supermarkets near you — Aldi, Lidl, REWE, Edeka, Penny, or Netto.",
    step2Badge: "STEP 02 · AI MEAL ARCHITECT",
    step2Title: "Get a meal plan built for your diet",
    step2Desc: "Balanced, High-Protein, Vegan, Vegetarian, or Halal — our AI builds a complete daily menu with exact calories, macros, and step-by-step recipes.",
    step3Badge: "STEP 03 · SMARTEST BASKET",
    step3Title: "Shop the cheapest store for every item",
    step3Desc: "We match every ingredient to real German shelf prices and weekly flyers so you never overpay at the checkout.",
    readyBadge: "YOU'RE READY!",
    startBtn: "Start Planning Now",
    exploreBtn: "Enter BudgetBite",
    savedTag: "Avg. savings: €64/month",
  },
  de: {
    skip: "Intro überspringen",
    scrollHint: "Scrollen & entdecken, wie es funktioniert",
    step1Badge: "SCHRITT 01 · DEINE REGELN",
    step1Title: "Budget festlegen & Märkte wählen",
    step1Desc: "Wähle dein Budget und deine Lieblingsmärkte in deiner Nähe — Aldi, Lidl, REWE, Edeka, Penny oder Netto.",
    step2Badge: "SCHRITT 02 · KI-ERNÄHRUNGSPLAN",
    step2Title: "Dein Ernährungsplan nach Maß",
    step2Desc: "Ausgewogen, High-Protein, Vegan, Vegetarisch oder Halal — inklusive Kalorien, Makros und einfachen Kochrezepten.",
    step3Badge: "SCHRITT 03 · CLEVER EINKAUFEN",
    step3Title: "Jedes Produkt zum besten Supermarktpreis",
    step3Desc: "Wir vergleichen echte deutsche Supermarktpreise und aktuelle Angebote für deine komplette Einkaufsliste.",
    readyBadge: "STARTKLAR!",
    startBtn: "Jetzt Plan erstellen",
    exploreBtn: "Zur Startseite",
    savedTag: "Ø Ersparnis: 64 €/Monat",
  },
};

const STORES = [
  { name: "Aldi", bg: "#7DD3FC", deal: "-22%" },
  { name: "Lidl", bg: "#FFB020", deal: "-19%" },
  { name: "REWE", bg: "#FF8FB5", deal: "Flyer" },
  { name: "Edeka", bg: "#A3E635", deal: "Fresh" },
  { name: "Penny", bg: "#fff", deal: "-15%" },
  { name: "Netto", bg: "#F3F8E6", deal: "-17%" },
];

const SAMPLE_ITEMS = [
  { name: "Ja! Haferflocken 500g", store: "REWE", price: "€0.79", old: "€1.19" },
  { name: "Milbona Skyr Natur 500g", store: "Lidl", price: "€1.39", old: "€1.89" },
  { name: "Aldi Bio Freiland Eier 10er", store: "Aldi", price: "€2.69", old: "€3.29" },
];

export default function ScrollIntro({ open, onComplete }) {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const scrollerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const c = COPY[currentLanguage?.code] || COPY.en;

  const { scrollYProgress } = useScroll({ container: scrollerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  // Track which stage (0, 1, 2, 3) is active based on scroll progress
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (v < 0.22) setActiveStage(0);
      else if (v < 0.52) setActiveStage(1);
      else if (v < 0.82) setActiveStage(2);
      else setActiveStage(3);
    });
    return () => unsub();
  }, [scrollYProgress]);

  // Prevent body scroll while fullscreen intro is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const progressWidth = useTransform(smoothProgress, [0, 1], ["8%", "100%"]);
  const cardRotate = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [-2, 2, -1.5, 0]);
  const floatY = useTransform(smoothProgress, [0, 0.5, 1], [0, -10, 0]);

  const scrollToStage = (idx) => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const targets = [0, 0.35, 0.68, 1];
    el.scrollTo({ top: maxScroll * targets[idx], behavior: "smooth" });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#F3F8E6] dark:bg-background text-[#111827] dark:text-foreground flex flex-col"
      >
        {/* Top sticky bar: progress + step pills + Skip button */}
        <div className="relative z-20 px-4 pt-3 pb-2.5 border-b-[3px] border-[#111827] dark:border-[#A3E635] bg-white/95 dark:bg-card/95 backdrop-blur-md">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#A3E635] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center font-heading font-black text-xs text-[#111827]">
                {activeStage + 1}/4
              </div>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToStage(idx)}
                    aria-label={`Step ${idx + 1}`}
                    className={`h-2.5 rounded-full border border-[#111827] transition-all ${
                      activeStage === idx
                        ? "w-7 bg-[#FF3E7F]"
                        : idx < activeStage
                        ? "w-2.5 bg-[#A3E635]"
                        : "w-2.5 bg-[#F3F8E6]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onComplete()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading font-extrabold bg-[#F3F8E6] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] active:translate-x-[1px] active:translate-y-[1px]"
            >
              {c.skip}
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Continuous scroll progress bar */}
          <div className="max-w-lg mx-auto mt-2 h-2 rounded-full bg-[#F3F8E6] border-2 border-[#111827] overflow-hidden">
            <motion.div
              style={{ width: progressWidth }}
              className="h-full bg-gradient-to-r from-[#A3E635] via-[#FFB020] to-[#FF3E7F]"
            />
          </div>
        </div>

        {/* Scrollable narrative container */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          {/* SCENE 1: Step 1 — Budget & Supermarkets */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div
              style={{ rotate: cardRotate, y: floatY }}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bba-t bg-white dark:bg-card space-y-4"
            >
              <span className="bba-sticker">{c.step1Badge}</span>
              <h2 className="font-heading text-3xl font-black tracking-tight leading-[1.05]">
                {c.step1Title}
              </h2>
              <p className="text-sm font-medium opacity-85 leading-relaxed">
                {c.step1Desc}
              </p>

              {/* Animated Interactive Budget Demo Tile */}
              <div className="rounded-2xl bg-[#A3E635] text-[#111827] border-[3px] border-[#111827] shadow-[4px_4px_0_#111827] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" /> Weekly Budget
                  </span>
                  <motion.span
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="font-heading text-2xl font-black bg-white px-3 py-0.5 rounded-full border-2 border-[#111827]"
                  >
                    €45 / wk
                  </motion.span>
                </div>
                <div className="h-3 rounded-full bg-white border-2 border-[#111827] overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: "20%" }}
                    animate={{ width: ["30%", "72%", "55%"] }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse" }}
                    className="h-full rounded-full bg-[#FF3E7F]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {STORES.map((s, i) => (
                    <motion.div
                      key={s.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.07, type: "spring" }}
                      style={{ backgroundColor: s.bg }}
                      className="border-2 border-[#111827] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[#111827] shadow-[2px_2px_0_#111827]"
                    >
                      <span className="font-heading font-black text-xs">{s.name}</span>
                      <span className="text-[10px] font-bold bg-white/90 px-1 rounded border border-[#111827]">
                        {s.deal}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollToStage(1)}
                className="w-full pt-2 flex flex-col items-center gap-1 text-xs font-heading font-extrabold opacity-80 hover:opacity-100"
              >
                <span>{c.scrollHint}</span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-7 w-7 rounded-full bg-[#FFB020] text-[#111827] border-2 border-[#111827] flex items-center justify-center shadow-[2px_2px_0_#111827]"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            </motion.div>
          </section>

          {/* SCENE 2: Step 2 — AI Meal Plan & Macros */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bba-t bg-[#FF8FB5] text-[#111827] space-y-4"
            >
              <span className="bba-sticker">{c.step2Badge}</span>
              <h2 className="font-heading text-3xl font-black tracking-tight leading-[1.05] text-[#111827]">
                {c.step2Title}
              </h2>
              <p className="text-sm font-medium text-[#111827]/90 leading-relaxed">
                {c.step2Desc}
              </p>

              {/* Animated Meal Day Cards */}
              <div className="space-y-2.5">
                {[
                  { slot: "Breakfast", dish: "Skyr Berry Bowl & Haferflocken", kcal: "480 kcal", p: "34g P", bg: "#fff" },
                  { slot: "Lunch", dish: "Mediterranean Chickpea Couscous", kcal: "640 kcal", p: "26g P", bg: "#F3F8E6" },
                  { slot: "Dinner", dish: "Crispy Salmon & Oven Potatoes", kcal: "720 kcal", p: "45g P", bg: "#A3E635" },
                ].map((m, idx) => (
                  <motion.div
                    key={m.slot}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -24 : 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 280, damping: 22 }}
                    style={{ backgroundColor: m.bg }}
                    className="border-[2.5px] border-[#111827] rounded-2xl p-3 shadow-[3px_3px_0_#111827] flex items-center justify-between gap-2 text-[#111827]"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-heading font-black uppercase tracking-wider bg-[#111827] text-[#F3F8E6] px-2 py-0.5 rounded-md">
                        {m.slot}
                      </span>
                      <p className="font-heading font-black text-sm mt-1 truncate">{m.dish}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-heading font-black flex items-center gap-0.5 justify-end">
                        <Flame className="h-3.5 w-3.5 text-[#FF3E7F]" /> {m.kcal}
                      </span>
                      <span className="inline-block text-[10px] font-bold bg-white border border-[#111827] px-1.5 py-0.5 rounded-full mt-0.5">
                        💪 {m.p}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollToStage(2)}
                className="w-full pt-1 flex flex-col items-center gap-1 text-xs font-heading font-extrabold text-[#111827]"
              >
                <span>{c.scrollHint}</span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-7 w-7 rounded-full bg-white text-[#111827] border-2 border-[#111827] flex items-center justify-center shadow-[2px_2px_0_#111827]"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            </motion.div>
          </section>

          {/* SCENE 3: Step 3 — Smart Grocery List & Real Prices */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bba-t bg-[#7DD3FC] text-[#111827] space-y-4"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="bba-sticker">{c.step3Badge}</span>
                <span className="text-xs font-heading font-black bg-[#A3E635] text-[#111827] border-2 border-[#111827] px-2.5 py-1 rounded-full shadow-[2px_2px_0_#111827]">
                  {c.savedTag}
                </span>
              </div>

              <h2 className="font-heading text-3xl font-black tracking-tight leading-[1.05] text-[#111827]">
                {c.step3Title}
              </h2>
              <p className="text-sm font-medium text-[#111827]/90 leading-relaxed">
                {c.step3Desc}
              </p>

              {/* Animated Grocery Checklist */}
              <div className="rounded-2xl bg-white border-[3px] border-[#111827] shadow-[4px_4px_0_#111827] divide-y-2 divide-[#111827] overflow-hidden">
                {SAMPLE_ITEMS.map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ delay: idx * 0.12, type: "spring" }}
                    className="p-3 flex items-center justify-between gap-2 text-[#111827]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="h-5 w-5 text-[#111827] fill-[#A3E635] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-xs sm:text-sm truncate">{item.name}</p>
                        <span className="inline-block text-[10px] font-black uppercase bg-[#FFB020] px-1.5 py-0.2 rounded border border-[#111827]">
                          {item.store}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] line-through opacity-50 mr-1.5">{item.old}</span>
                      <span className="font-heading font-black text-sm bg-[#A3E635] px-2 py-0.5 rounded-lg border-2 border-[#111827]">
                        {item.price}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollToStage(3)}
                className="w-full pt-1 flex flex-col items-center gap-1 text-xs font-heading font-extrabold text-[#111827]"
              >
                <span>Final step ↓</span>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-7 w-7 rounded-full bg-[#A3E635] text-[#111827] border-2 border-[#111827] flex items-center justify-center shadow-[2px_2px_0_#111827]"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            </motion.div>
          </section>

          {/* SCENE 4: Final Call-to-Action Finale */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.45 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="bba-t bg-[#FFB020] text-[#111827] space-y-5 text-center py-7"
            >
              <span className="bba-sticker mx-auto">
                <Sparkles className="h-3.5 w-3.5" /> {c.readyBadge}
              </span>

              <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight leading-none text-[#111827]">
                Ready to slash your grocery bill?
              </h2>

              <p className="text-sm font-bold text-[#111827]/85 max-w-xs mx-auto">
                No sign-up needed to try. Build your first German supermarket meal plan in under 30 seconds.
              </p>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onComplete();
                    navigate("/budget");
                  }}
                  className="w-full min-h-[52px] rounded-full bg-[#A3E635] text-[#111827] border-[3px] border-[#111827] shadow-[4px_4px_0_#111827] font-heading font-black text-base flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111827] transition-all"
                >
                  <ShoppingBasket className="h-5 w-5" />
                  {c.startBtn}
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => onComplete()}
                  className="w-full min-h-[46px] rounded-full bg-white text-[#111827] border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] font-heading font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#F3F8E6] transition-all"
                >
                  <Leaf className="h-4 w-4" />
                  {c.exploreBtn}
                </button>
              </div>
            </motion.div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}