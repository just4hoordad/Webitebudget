import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DURATION = 5;
const R = 34;
const C = 2 * Math.PI * R;

export default function AdInterstitial({ open, onComplete, onClose }) {
  const [count, setCount] = useState(DURATION);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCount(DURATION);
    setReady(false);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setReady(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  const pct = ready ? 1 : (DURATION - count) / DURATION;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6"
        >
          <div className="w-full max-w-sm space-y-6 text-center">
            <p className="text-xs font-heading font-semibold tracking-widest text-white/40 uppercase">
              Advertisement
            </p>
            <div className="aspect-video w-full rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-sm">Ad slot (Google AdSense placeholder)</span>
            </div>
            <div className="relative mx-auto h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r={R}
                  fill="none"
                  stroke="hsl(83 78% 55%)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - pct)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-heading font-bold text-white">
                  {ready ? "✓" : count}
                </span>
              </div>
            </div>
            {ready ? (
              <button
                onClick={onComplete}
                className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-heading font-semibold"
              >
                Continue
              </button>
            ) : (
              <p className="text-sm text-white/50">Your free generation unlocks in {count}s…</p>
            )}
            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}