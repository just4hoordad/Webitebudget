import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Search, Package, Leaf, Tag, Calculator, Scale, Wallet,
  ClipboardList, CheckCircle2, CalendarDays, Sun, Salad, Utensils,
  Flame, RefreshCw, ShoppingCart, Loader2,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const GROCERY_STEPS = [
  { icon: Database, key: "gen_step_g1" },
  { icon: Search, key: "gen_step_g2" },
  { icon: Package, key: "gen_step_g3" },
  { icon: Leaf, key: "gen_step_g4" },
  { icon: Tag, key: "gen_step_g5" },
  { icon: Calculator, key: "gen_step_g6" },
  { icon: Scale, key: "gen_step_g7" },
  { icon: Wallet, key: "gen_step_g8" },
  { icon: ClipboardList, key: "gen_step_g9" },
  { icon: CheckCircle2, key: "gen_step_g10" },
];

const PLAN_STEPS = [
  { icon: ClipboardList, key: "gen_step_p1" },
  { icon: CalendarDays, key: "gen_step_p2" },
  { icon: Sun, key: "gen_step_p3" },
  { icon: Salad, key: "gen_step_p4" },
  { icon: Utensils, key: "gen_step_p5" },
  { icon: Flame, key: "gen_step_p6" },
  { icon: Scale, key: "gen_step_p7" },
  { icon: RefreshCw, key: "gen_step_p8" },
  { icon: CheckCircle2, key: "gen_step_p9" },
];

export default function GeneratingLoader({ type = "grocery", stores }) {
  const { t } = useLanguage();
  const storeText = (Array.isArray(stores) ? stores : String(stores || "").split(","))
    .map((s) => s.trim()).filter(Boolean)
    .map((s) => (s === s.toLowerCase() && s.length > 2 ? s[0].toUpperCase() + s.slice(1) : s))
    .join(", ");
  const steps = (type === "plan" ? PLAN_STEPS : GROCERY_STEPS).map((s) => ({
    ...s,
    text: storeText ? t(s.key).replace("Aldi, Lidl, REWE", storeText) : t(s.key),
  }));
  const [visibleSteps, setVisibleSteps] = useState([steps[0]]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [creep, setCreep] = useState(0);

  useEffect(() => {
    setVisibleSteps([steps[0]]);
    setCurrentIndex(0);
    setCreep(0);
  }, [type]);

  useEffect(() => {
    if (currentIndex >= steps.length - 1) return;
    const timer = setTimeout(() => {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setVisibleSteps((prev) => [...prev, steps[next]]);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentIndex, steps]);

  // Once the step feed is done, creep slowly toward 99% so the bar keeps
  // moving instead of freezing at 90% while the generation completes.
  useEffect(() => {
    if (currentIndex < steps.length - 1) return;
    const delay = 1500 + creep * 350;
    const timer = setTimeout(() => setCreep((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [currentIndex, steps.length, creep]);

  const baseProgress = Math.min(((currentIndex + 1) / steps.length) * 100, 90);
  const progress = Math.min(baseProgress + creep, 99);
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleSteps]);

  const isPlan = type === "plan";
  const title = isPlan ? t("gen_title_plan") : t("gen_title_grocery");
  const subtitle = isPlan ? t("gen_sub_plan") : t("gen_sub_grocery");

  return (
    <div className="bba-t bg-card text-card-foreground p-0 overflow-hidden">
      {/* Header */}
      <div
        className={`${
          isPlan ? "bg-[#FFB020]" : "bg-[#78a71b]"
        } text-[#111827] border-b-[3px] border-[#111827] px-5 py-4 flex items-center gap-3.5`}
      >
        <div className="relative h-11 w-11 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
          <ShoppingCart className="h-5 w-5 text-[#111827]" />
          <motion.span
            className="absolute inset-0 rounded-2xl border-2 border-[#111827]"
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-black text-base text-[#111827] leading-tight">{title}</p>
          <p className="text-xs font-semibold text-[#111827]/80 truncate">{subtitle}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center shrink-0">
          <Loader2 className="h-4 w-4 text-[#111827] animate-spin" />
        </div>
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
                <div
                  className={`h-8 w-8 rounded-xl border-2 border-[#111827] flex items-center justify-center shrink-0 ${
                    isLast
                      ? "bg-[#FFB020] text-[#111827] shadow-[2px_2px_0_#111827]"
                      : "bg-[#F3F8E6] text-[#111827]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className={`text-sm leading-snug pt-1 ${isLast ? "text-foreground font-heading font-extrabold" : "text-muted-foreground font-medium"}`}>
                  {step.text}
                  {isLast && <span className="inline-block ml-1 text-[#FF3E7F] font-black animate-pulse">▍</span>}
                </p>
                {!isLast && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-[#78a71b] border-[1.5px] border-[#111827] flex items-center justify-center shrink-0 mt-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#111827]" />
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5 pt-3.5 border-t-[2.5px] border-[#111827] dark:border-[#78a71b] bg-[#F3F8E6] dark:bg-secondary">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-heading font-black uppercase tracking-wider text-[#111827] dark:text-foreground">
            ⚡ {isPlan ? t("gen_progress_plan") : t("gen_progress_grocery")}
          </p>
          <span className="text-xs font-heading font-black bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0_#111827]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="relative w-full h-3.5 bg-white border-2 border-[#111827] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[#78a71b] bba-progress-stripes rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}