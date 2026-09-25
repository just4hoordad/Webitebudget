import { motion, AnimatePresence } from "framer-motion";

// No forced countdown — the ad is skippable immediately. The user can press
// Continue (or close) without waiting. The credit grant still happens on
// Continue, preserving the reward-for-viewing flow without a lock-in timer.
export default function AdInterstitial({ open, onComplete, onClose }) {
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
            <button
              onClick={onComplete}
              className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-heading font-semibold"
            >
              Continue
            </button>
            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}