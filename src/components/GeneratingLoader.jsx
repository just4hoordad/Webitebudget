import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GROCERY_STEPS = [
  { emoji: "🌐", text: "Connecting to live store price databases…" },
  { emoji: "🔍", text: "Searching Aldi, Lidl, REWE for current prices…" },
  { emoji: "📦", text: "Scanning protein & dairy sections…" },
  { emoji: "🥦", text: "Checking fresh produce & vegetables…" },
  { emoji: "🏷️", text: "Comparing unit prices across stores…" },
  { emoji: "🧮", text: "Calculating quantities for your monthly budget…" },
  { emoji: "⚖️", text: "Balancing calories & nutrition targets…" },
  { emoji: "💰", text: "Optimising total cost to match your budget…" },
  { emoji: "📋", text: "Building your personalised grocery list…" },
  { emoji: "✅", text: "Almost done — finalising prices & totals…" },
];

const PLAN_STEPS = [
  { emoji: "📦", text: "Reading your grocery list ingredients…" },
  { emoji: "📅", text: "Designing a 7-day rotating schedule…" },
  { emoji: "🍳", text: "Crafting breakfast recipes from your items…" },
  { emoji: "🥗", text: "Building balanced lunch combinations…" },
  { emoji: "🍝", text: "Planning satisfying dinner meals…" },
  { emoji: "⚖️", text: "Distributing calories across all 7 days…" },
  { emoji: "🔢", text: "Calculating exact ingredient quantities…" },
  { emoji: "♻️", text: "Making sure ingredients are used across 4 weeks…" },
  { emoji: "✅", text: "Wrapping up your personalised meal plan…" },
];

const GROCERY_GHOST_ITEMS = [
  "🥛 Milbona Vollmilch 3,5% · 4× 1L",
  "🥚 Gut & Günstig Eier 10er",
  "🍞 Aldi Toastbrot 500g",
  "🧀 Milbona Gouda Scheiben 400g",
  "🍌 Bananen lose · 1kg",
  "🥕 Karotten · 1kg Beutel",
  "🐔 Hähnchenbrust · 800g",
  "🛢️ Sonnenblumenöl 1L",
  "🍚 Reis Langkorn · 2kg",
  "🧻 Toilettenpapier 8-Rollen",
  "🥫 Kidneybohnen 400g Dose",
  "🍋 Zitronen · 500g Netz",
];

const PLAN_GHOST_ITEMS = [
  "Monday   Oats + Banana  |  Rice & Beans  |  Chicken & Veg",
  "Tuesday   Eggs & Toast  |  Salad Bowl  |  Pasta Primavera",
  "Wednesday   Yoghurt  |  Lentil Soup  |  Stir-fry & Rice",
  "Thursday   Muesli  |  Veggie Wrap  |  Baked Potato",
  "Friday   Smoothie  |  Rice Bowl  |  Fish & Salad",
  "Saturday   Pancakes  |  Soup & Bread  |  Curry & Rice",
  "Sunday   French Toast  |  Grain Bowl  |  Roast Veg",
];

export default function GeneratingLoader({ type = "grocery" }) {
  const steps = type === "plan" ? PLAN_STEPS : GROCERY_STEPS;
  const ghostItems = type === "plan" ? PLAN_GHOST_ITEMS : GROCERY_GHOST_ITEMS;

  const [visibleSteps, setVisibleSteps] = useState([steps[0]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    setVisibleSteps([steps[0]]);
    setCurrentIndex(0);
  }, [type]);

  useEffect(() => {
    if (currentIndex >= steps.length - 1) return;
    const timer = setTimeout(() => {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setVisibleSteps((prev) => [...prev, steps[next]]);
    }, 2600);
    return () => clearTimeout(timer);
  }, [currentIndex, steps]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  const progress = ((currentIndex + 1) / steps.length) * 100;

  // How many ghost rows to reveal based on progress
  const revealedCount = Math.ceil((progress / 100) * ghostItems.length);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <p className="text-xs font-mono text-primary font-semibold ml-2">
          {type === "plan" ? "meal-plan-ai" : "grocery-ai"} — generating{dots}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Left: Live feed */}
        <div className="px-5 py-4 space-y-2.5 font-mono text-sm">
          <AnimatePresence>
            {visibleSteps.map((step, i) => {
              const isLast = i === visibleSteps.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${isLast ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span className="text-base leading-none mt-0.5">{step.emoji}</span>
                  <span className={`leading-snug ${isLast ? "font-medium" : ""}`}>
                    {step.text}
                    {isLast && (
                      <span className="inline-block ml-1 text-primary font-bold animate-pulse">▍</span>
                    )}
                  </span>
                  {!isLast && (
                    <span className="ml-auto text-green-500 text-xs shrink-0">✓</span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right: Ghost preview — visually "drawing itself" */}
        <div className="px-5 py-4 space-y-2 overflow-hidden">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-3">
            {type === "plan" ? "Preview: 7-day plan" : "Preview: Grocery list"}
          </p>
          {ghostItems.map((item, i) => {
            const isRevealed = i < revealedCount;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: isRevealed ? 1 : 0, x: isRevealed ? 0 : 12 }}
                transition={{ duration: 0.5, delay: isRevealed ? 0.05 * i : 0 }}
                className="flex items-center gap-2"
              >
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${
                    isRevealed ? "bg-primary/20" : "bg-muted"
                  }`}
                  style={{ width: isRevealed ? "100%" : "30%" }}
                />
                <span
                  className={`text-xs font-mono whitespace-nowrap transition-all duration-500 ${
                    isRevealed ? "text-muted-foreground/70" : "text-transparent"
                  }`}
                >
                  {item}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4 pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-muted-foreground">Progress</p>
          <p className="text-xs font-semibold text-primary">{Math.round(progress)}%</p>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}