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

const GROCERY_SEGMENTS = [
  { label: "Dairy", emoji: "🥛" },
  { label: "Produce", emoji: "🥦" },
  { label: "Protein", emoji: "🥩" },
  { label: "Grains", emoji: "🍞" },
  { label: "Pantry", emoji: "🫙" },
  { label: "Extras", emoji: "🧴" },
];

const PLAN_SEGMENTS = [
  { label: "Mon", emoji: "1️⃣" },
  { label: "Tue", emoji: "2️⃣" },
  { label: "Wed", emoji: "3️⃣" },
  { label: "Thu", emoji: "4️⃣" },
  { label: "Fri", emoji: "5️⃣" },
  { label: "Sat", emoji: "6️⃣" },
  { label: "Sun", emoji: "7️⃣" },
];

export default function GeneratingLoader({ type = "grocery" }) {
  const steps = type === "plan" ? PLAN_STEPS : GROCERY_STEPS;
  const segments = type === "plan" ? PLAN_SEGMENTS : GROCERY_SEGMENTS;

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

  // How many segments are "lit" based on progress
  const litCount = Math.ceil((progress / 100) * segments.length);

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

      {/* Live feed */}
      <div className="px-5 py-4 space-y-2.5 min-h-[200px] font-mono text-sm">
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

      {/* Multi-segment progress */}
      <div className="px-5 pb-5 pt-2 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            {type === "plan" ? "Days planned" : "Categories built"}
          </p>
          <p className="text-xs font-semibold text-primary font-mono">{Math.round(progress)}%</p>
        </div>

        {/* Segments */}
        <div className="flex gap-1.5">
          {segments.map((seg, i) => {
            const isLit = i < litCount;
            const isActive = i === litCount - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-full h-3 rounded-full transition-colors duration-500 ${
                    isLit ? "bg-primary" : "bg-muted"
                  } ${isActive ? "ring-2 ring-primary/40 ring-offset-1" : ""}`}
                  animate={isActive ? { opacity: [1, 0.6, 1] } : {}}
                  transition={isActive ? { repeat: Infinity, duration: 1 } : {}}
                />
                <span className="text-[9px] text-muted-foreground font-mono leading-none">
                  {isLit ? seg.emoji : seg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}