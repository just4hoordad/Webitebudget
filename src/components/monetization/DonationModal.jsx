import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useLanguage } from "@/lib/LanguageContext";

const presets = [1, 3, 5];

export default function DonationModal({ open, onClose }) {
  const { t } = useLanguage();
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
            className="relative w-full max-w-md bg-card border-[3px] border-[#111827] dark:border-[#78a71b] shadow-[6px_6px_0_#111827] rounded-3xl p-6 space-y-5"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827]"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-2 pt-2">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#FF8FB5] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center text-[#111827]">
                <Heart className="h-7 w-7 fill-[#FF3E7F] text-[#111827]" />
              </div>
              <h2 className="font-heading text-2xl font-black text-foreground">{t("supportTitle")}</h2>
              <p className="text-sm font-medium text-muted-foreground">
                {t("supportBody")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSelected(p);
                    setCustom("");
                  }}
                  className={`py-3 text-lg bba-chip ${!custom && selected === p ? "bba-chip-active" : ""}`}
                >
                  €{p}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-heading font-bold text-muted-foreground">{t("customAmount")}</label>
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. 10"
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-card border-2 border-[#111827] dark:border-[#78a71b] shadow-[2px_2px_0_#111827] font-heading font-bold text-foreground focus:outline-none"
              />
            </div>
            <Button
              onClick={handleDonate}
              disabled={loading}
              variant="destructive"
              className="w-full gap-2"
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