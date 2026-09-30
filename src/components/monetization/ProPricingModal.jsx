import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const benefits = [
  "Unlock all Pro-only options & settings",
  "30 generations per month",
  "100% ad-free — no banners, no wait ads",
  "Pro badge next to your name",
  "Support independent development",
];

export default function ProPricingModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (window.top !== window.self) {
      toast.error("Checkout only works from the published app.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        origin: window.location.origin,
      });
      const url = res.data?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (e) {
      console.error(e);
      toast.error("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-5"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center space-y-2 pt-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Crown className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground">BudgetBite Pro</h2>
              <p className="text-sm text-muted-foreground">
                I've helped you plan a lot of meals — now you have the chance to <span className="font-semibold text-foreground">buy me a coffee</span> and keep me refreshed. ☕
              </p>
            </div>
            <div className="text-center">
              <span className="font-heading text-4xl font-bold text-foreground">€3.99</span>
              <span className="text-muted-foreground">/month</span>
              <p className="mt-1 text-xs text-primary font-medium">Buy me a coffee to keep me refreshed ☕</p>
            </div>
            <ul className="space-y-2.5">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
                  <span className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Button onClick={handleSubscribe} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {loading ? "Redirecting…" : "Buy me a coffee ☕"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Cancel anytime. Secured by Stripe.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}