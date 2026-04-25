import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GROCERY_STEPS = [
  { emoji: "🔍", text: "Scanning store prices online…" },
  { emoji: "🛒", text: "Picking the cheapest options…" },
  { emoji: "🥦", text: "Balancing nutrition & budget…" },
  { emoji: "🏷️", text: "Finding best deals per store…" },
  { emoji: "📊", text: "Calculating monthly totals…" },
  { emoji: "✅", text: "Finalising your grocery list…" },
];

const PLAN_STEPS = [
  { emoji: "📅", text: "Planning your 7-day schedule…" },
  { emoji: "🍳", text: "Crafting breakfast ideas…" },
  { emoji: "🥗", text: "Building balanced lunches…" },
  { emoji: "🍝", text: "Designing satisfying dinners…" },
  { emoji: "⚖️", text: "Balancing calories across days…" },
  { emoji: "✅", text: "Wrapping up your meal plan…" },
];

export default function GeneratingLoader({ type = "grocery" }) {
  const steps = type === "plan" ? PLAN_STEPS : GROCERY_STEPS;
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 2800);
    return () => clearInterval(stepTimer);
  }, [steps.length]);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(dotTimer);
  }, []);

  const step = steps[stepIndex];

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center px-6">
      {/* Animated emoji */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="text-6xl"
        >
          {step.emoji}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step text */}
      <div className="space-y-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-foreground font-semibold text-lg"
          >
            {step.text}
          </motion.p>
        </AnimatePresence>
        <p className="text-muted-foreground text-sm">
          This usually takes 15–30 seconds{dots}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === stepIndex ? "bg-primary scale-125" : i < stepIndex ? "bg-primary/40" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}