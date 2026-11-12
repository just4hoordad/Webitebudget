import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useMonetization } from "@/lib/MonetizationContext";

const PRO_BENEFITS = [
  "15 generations per month",
  "On-demand recipes for every meal",
  "100% ad-free experience",
  "Pro badge next to your name",
  "Support independent development",
];

const PRO_PLUS_BENEFITS = [
  "30 generations per month",
  "Everything in Pro, plus:",
  "Priority AI — faster generation",
  "Advanced macro controls",
  "Unlimited recipe generations",
  "Priority support",
];

export default function ProPricingModal({ open, onClose }) {
  const [loading, setLoading] = useState(null);
  const { tier: currentTier } = useMonetization();

  const handleSubscribe = async (tier) => {
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open("", "_blank") : null;
    if (isFramed && !checkoutTab) {
      toast.error("Allow popups to continue to checkout.");
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setLoading(tier);
    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        origin: window.location.origin,
        tier,
      });
      const url = res.data?.url;
      if (!url) throw new Error("No checkout URL returned");
      if (checkoutTab) {
        checkoutTab.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (e) {
      console.error(e);
      checkoutTab?.close();
      toast.error("Could not start checkout. Please try again.");
      setLoading(null);
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
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border-[3px] border-[#111827] dark:border-[#78a71b] shadow-[6px_6px_0_#111827] dark:shadow-[6px_6px_0_#000] rounded-3xl p-6 space-y-5"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827] z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FFB020] border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center">
                <Crown className="h-7 w-7 text-[#111827]" />
              </div>
              <span className="bba-sticker">Power-Up Shop</span>
              <h2 className="font-heading text-2xl font-black text-foreground">Choose your plan</h2>
              <p className="text-sm font-medium text-muted-foreground">
                Pick the plan that fits your meal planning needs. Cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pro tier */}
              <div className={`relative rounded-2xl border-[2.5px] border-[#111827] dark:border-[#78a71b] shadow-[4px_4px_0_#111827] p-5 space-y-4 ${
                currentTier === "pro" ? "bg-[#F3F8E6] dark:bg-secondary" : "bg-card"
              }`}>
                {currentTier === "pro" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-heading font-black bg-[#78a71b] text-[#111827] border-2 border-[#111827] whitespace-nowrap">
                    CURRENT
                  </span>
                )}
                <div className="text-center space-y-1">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-[#78a71b] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center">
                    <Crown className="h-5 w-5 text-[#111827]" />
                  </div>
                  <h3 className="font-heading text-lg font-black text-foreground">Pro</h3>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="font-heading text-3xl font-black text-foreground">€3.99</span>
                    <span className="text-sm font-bold text-muted-foreground">/mo</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {PRO_BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs font-medium text-foreground">
                      <span className="h-4 w-4 rounded-full bg-[#78a71b] border border-[#111827] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-[#111827] stroke-[3]" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe("pro")}
                  disabled={loading !== null || currentTier === "pro"}
                  className="w-full gap-2"
                  variant={currentTier === "pro" ? "outline" : "default"}
                >
                  {loading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  {currentTier === "pro" ? "Current Plan" : "Get Pro"}
                </Button>
              </div>

              {/* Pro+ tier */}
              <div className="relative rounded-2xl border-[2.5px] border-[#111827] shadow-[4px_4px_0_#111827] p-5 space-y-4 bg-[#FFB020] text-[#111827]">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-heading font-black bg-[#FF3E7F] text-white border-2 border-[#111827] whitespace-nowrap">
                  {currentTier === "pro_plus" ? "CURRENT" : "BEST VALUE"}
                </span>
                <div className="text-center space-y-1">
                  <div className="mx-auto h-10 w-10 rounded-xl bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#111827]" />
                  </div>
                  <h3 className="font-heading text-lg font-black text-[#111827]">Pro+</h3>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="font-heading text-3xl font-black text-[#111827]">€9.99</span>
                    <span className="text-sm font-bold text-[#111827]/75">/mo</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {PRO_PLUS_BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs font-semibold text-[#111827]">
                      <span className="h-4 w-4 rounded-full bg-white border border-[#111827] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-[#111827] stroke-[3]" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe("pro_plus")}
                  disabled={loading !== null || currentTier === "pro_plus"}
                  className="w-full gap-2"
                  variant={currentTier === "pro_plus" ? "outline" : "destructive"}
                >
                  {loading === "pro_plus" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {currentTier === "pro_plus" ? "Current Plan" : "Get Pro+"}
                </Button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Cancel anytime. Secured by Stripe.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}