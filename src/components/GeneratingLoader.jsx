import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Search, Package, Leaf, Tag, Calculator, Scale, Wallet,
  ClipboardList, CheckCircle2, CalendarDays, Sun, Salad, Utensils,
  Flame, RefreshCw, ShoppingCart, Loader2,
} from "lucide-react";

const GROCERY_STEPS = [
  { icon: Database, text: "Connecting to live store price databases" },
  { icon: Search, text: "Searching Aldi, Lidl, REWE for current prices" },
  { icon: Package, text: "Scanning protein & dairy sections" },
  { icon: Leaf, text: "Checking fresh produce & vegetables" },
  { icon: Tag, text: "Comparing unit prices across stores" },
  { icon: Calculator, text: "Calculating quantities for your budget" },
  { icon: Scale, text: "Balancing calories & nutrition targets" },
  { icon: Wallet, text: "Optimising total cost to match your budget" },
  { icon: ClipboardList, text: "Building your personalised grocery list" },
  { icon: CheckCircle2, text: "Finalising prices & totals" },
];

const PLAN_STEPS = [
  { icon: ClipboardList, text: "Reading your grocery list ingredients" },
  { icon: CalendarDays, text: "Designing a 7-day rotating schedule" },
  { icon: Sun, text: "Crafting breakfast recipes from your items" },
  { icon: Salad, text: "Building balanced lunch combinations" },
  { icon: Utensils, text: "Planning satisfying dinner meals" },
  { icon: Flame, text: "Distributing calories across all 7 days" },
  { icon: Scale, text: "Calculating exact ingredient quantities" },
  { icon: RefreshCw, text: "Ensuring ingredients are used across 4 weeks" },
  { icon: CheckCircle2, text: "Wrapping up your personalised meal plan" },
];

export default function GeneratingLoader({ type = "grocery" }) {
  const steps = type === "plan" ? PLAN_STEPS : GROCERY_STEPS;
  const [visibleSteps, setVisibleSteps] = useState([steps[0]]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const progress = Math.min(((currentIndex + 1) / steps.length) * 100, 90);
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleSteps]);

  const isPlan = type === "plan";
  const title = isPlan ? "Building your meal plan" : "Generating your grocery list";
  const subtitle = isPlan ? "Preparing your weekly schedule" : "Browsing real store prices";

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-5 py-4 flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
          <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          <motion.span
            className="absolute inset-0 rounded-xl border-2 border-primary"
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.25, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-sm text-foreground leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
      </div>

      {/* Live feed */}
      <div ref={feedRef} className="px-5 py-4 space-y-3 h-[220px] overflow-y-auto scrollbar-hide scroll-smooth">
        <AnimatePresence>
          {visibleSteps.map((step, i) => {
            const isLast = i === visibleSteps.length - 1;
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isLast ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className={`text-sm leading-snug pt-1 ${isLast ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step.text}
                  {isLast && <span className="inline-block ml-1 text-primary font-bold animate-pulse">▍</span>}
                </p>
                {!isLast && <CheckCircle2 className="ml-auto h-4 w-4 text-primary shrink-0 mt-1.5" />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">{isPlan ? "Plan progress" : "Grocery progress"}</p>
          <p className="text-xs font-heading font-bold text-primary">{Math.round(progress)}%</p>
        </div>
        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}