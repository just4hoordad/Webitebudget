import { motion } from "framer-motion";
import { X, Zap, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

const PRICE = "$2.99/month";

const FEATURES = [
  "Unlimited custom meal plan generation",
  "AI-powered meal swaps & alternatives",
  "Unique month-long meal plans",
  "Priority access to new features",
];

export default function ProPaywall({ featureName, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    // Block inside iframes (e.g. Base44 preview)
    if (window.self !== window.top) {
      alert("Checkout is only available from the published app. Please open the app directly.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {});
      if (res?.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e) {
      alert("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80">BudgetBite Pro</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-foreground">
            Unlock {featureName}
          </h2>
          <p className="text-sm text-primary-foreground/80 mt-1">
            This feature requires a Pro subscription.
          </p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Redirecting…" : `Upgrade for ${PRICE}`}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </div>
  );
}