import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const presets = [1, 3, 5];

export default function DonationModal({ open, onClose }) {
  const [selected, setSelected] = useState(3);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDonate = async () => {
    const amt = custom ? parseFloat(custom) : selected;
    if (isNaN(amt) || amt < 1 || amt > 500) {
      toast.error("Enter an amount between €1 and €500.");
      return;
    }
    if (window.top !== window.self) {
      toast.error("Checkout only works from the published app.");
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createDonationSession", {
        amount: amt,
        origin: window.location.origin,
      });
      const url = res.data?.url;
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (e) {
      console.error(e);
      toast.error("Could not start donation. Please try again.");
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
              <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-100 flex items-center justify-center">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Support BudgetBite</h2>
              <p className="text-sm text-muted-foreground">
                A one-time tip to keep the app running. No extra features — just gratitude. ❤️
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelected(p);
                    setCustom("");
                  }}
                  className={`py-3 rounded-xl border font-heading font-bold text-lg transition-colors ${
                    !custom && selected === p
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-secondary border-border text-foreground hover:bg-muted"
                  }`}
                >
                  €{p}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Or custom amount (€1–€500)</label>
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. 10"
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Button
              onClick={handleDonate}
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white border-0 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              {loading ? "Redirecting…" : "Donate"}
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}