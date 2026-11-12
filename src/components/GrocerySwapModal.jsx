import { useState, useEffect } from "react";
import { X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/aiClient";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { isAllowedStoreItem } from "@/lib/generateGroceries";

export default function GrocerySwapModal({ item, category, diet, budget, stores, onSwap, onClose }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchAlternatives = async (force = false) => {
    const swapKey = JSON.stringify({ name: item.name, quantity: item.quantity, price: item.price, category, diet });
    if (!force) {
      try {
        const raw = localStorage.getItem("bb_grocery_swaps");
        if (raw) {
          const map = JSON.parse(raw);
          const entry = map[swapKey];
          if (entry && Date.now() - entry.ts < 24 * 60 * 60 * 1000) {
            setAlternatives(entry.alternatives);
            setSelected(null);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }
    }
    setLoading(true);
    setAlternatives(null);
    setSelected(null);
    const result = await invokeAI({
      prompt: `Suggest 3 alternatives for "${item.name}" (${item.quantity}, €${item.price?.toFixed(2)}, ${item.store || "unknown"}) at German supermarkets.
Category: ${category}. Diet: ${diet}. Price ≤ €${item.price?.toFixed(2)}. ${stores ? `Only products from: ${stores}.` : "Any German supermarket."} Use real branded names (e.g. "Milbona Naturjoghurt 500g") with 2024-2025 prices. Each: name, quantity, price (for ${item.quantity}), store, reason (one line).`,
      response_json_schema: {
        type: "object",
        properties: {
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "string" },
                price: { type: "number" },
                unit_price: { type: "number" },
                store: { type: "string" },
                reason: { type: "string" },
                calories_info: { type: "string" }
              }
            }
          }
        }
      }
    });
    const alts = (result.alternatives || []).filter((a) => isAllowedStoreItem(a, stores));
    setAlternatives(alts);
    try {
      const raw = localStorage.getItem("bb_grocery_swaps");
      const map = raw ? JSON.parse(raw) : {};
      map[swapKey] = { ts: Date.now(), alternatives: alts };
      localStorage.setItem("bb_grocery_swaps", JSON.stringify(map));
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlternatives();
  }, []);

  const handleConfirm = () => {
    if (selected === null) return;
    onSwap(category, item, alternatives[selected]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card text-card-foreground border-[3px] border-[#111827] dark:border-[#78a71b] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg flex flex-col shadow-[6px_6px_0_#111827] dark:shadow-[6px_6px_0_#000] overflow-hidden"
        style={{ maxHeight: "75vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#FFB020] text-[#111827] border-b-[3px] border-[#111827] px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="bba-sticker mb-1">🛒 {category} · AI Swap</span>
            <h2 className="font-heading font-black text-lg text-[#111827] mt-0.5 leading-snug">Replace "{item.name}"</h2>
            <p className="text-xs font-bold text-[#111827]/80 mt-0.5">{item.quantity} · €{item.price?.toFixed(2)} · {item.store}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827] shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-3">
              <p className="text-sm font-heading font-bold text-muted-foreground text-center">Finding alternative products…</p>
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-muted/50 border-2 border-[#111827]/15 rounded-2xl p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : alternatives?.length > 0 ? (
            <>
              <p className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Select an alternative product:</p>
              {alternatives.map((alt, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                    selected === i
                      ? "border-[#111827] bg-[#78a71b] text-[#111827] shadow-[3px_3px_0_#111827]"
                      : "border-[#111827]/25 dark:border-[#78a71b]/40 bg-background hover:border-[#111827]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-extrabold text-sm">{alt.name}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${selected === i ? "text-[#111827]/80" : "text-muted-foreground"}`}>{alt.quantity} · {alt.store}</p>
                      {alt.reason && <p className={`text-xs font-medium mt-1 italic ${selected === i ? "text-[#111827]" : "text-primary"}`}>{alt.reason}</p>}
                      {alt.calories_info && <p className={`text-xs mt-0.5 ${selected === i ? "text-[#111827]/75" : "text-muted-foreground"}`}>{alt.calories_info}</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-sm font-heading font-black bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-xl">
                        €{alt.price?.toFixed(2)}
                      </span>
                      {alt.price < item.price && (
                        <span className={`text-[11px] font-heading font-black ${selected === i ? "text-[#111827]" : "text-primary"}`}>
                          saves €{(item.price - alt.price).toFixed(2)}
                        </span>
                      )}
                      {selected === i && (
                        <div className="bg-white border-2 border-[#111827] rounded-full p-1 mt-0.5">
                          <Check className="h-3 w-3 text-[#111827] stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <p className="text-sm font-medium text-muted-foreground text-center py-4">{t("noAlternatives")}</p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-card border-t-2 border-[#111827]/15 dark:border-white/15 px-5 py-4 pb-6 flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => fetchAlternatives(true)} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={selected === null || loading}
            onClick={handleConfirm}
          >
            <Check className="h-4 w-4" />
            Use This Product
          </Button>
        </div>
      </motion.div>
    </div>
  );
}