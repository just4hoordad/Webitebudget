import { useState, useEffect } from "react";
import { X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function GrocerySwapModal({ item, category, diet, budget, onSwap, onClose }) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchAlternatives = async () => {
    setLoading(true);
    setAlternatives(null);
    setSelected(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a budget grocery assistant for German supermarkets. Suggest exactly 3 alternative products to replace: "${item.name}" (${item.quantity}, €${item.price?.toFixed(2)}, from ${item.store || "unknown store"}).

CONSTRAINTS:
- Same category: ${category}
- Diet type: ${diet}
- Similar or lower price to the original (€${item.price?.toFixed(2)})
- Must be real products available in German supermarkets (Aldi, Lidl, REWE, Edeka, etc.)
- Use real 2024-2025 German supermarket prices
- CRITICAL: Product name MUST include full brand name as sold in store (e.g. "Ja! Vollmilch 3,5% 1L", "Milbona Naturjoghurt 500g")

For each alternative, provide:
- Full branded product name
- Quantity/size
- Price (same quantity as original: ${item.quantity})
- Store where it's available
- A one-line reason why it's a good swap`,
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
    setAlternatives(result.alternatives || []);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-16 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: "70vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide">🛒 {category} · AI Swap</p>
            <h2 className="font-heading font-bold text-foreground mt-0.5">Replace "{item.name}"</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} · €{item.price?.toFixed(2)} · {item.store}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Finding alternative products…</p>
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-muted/50 rounded-xl p-4 animate-pulse h-20" />
              ))}
            </div>
          ) : alternatives?.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Select an alternative product:</p>
              {alternatives.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    selected === i
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-foreground">{alt.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alt.quantity} · {alt.store}</p>
                      {alt.reason && <p className="text-xs text-primary/80 mt-1 italic">{alt.reason}</p>}
                      {alt.calories_info && <p className="text-xs text-muted-foreground mt-0.5">{alt.calories_info}</p>}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-primary">€{alt.price?.toFixed(2)}</span>
                      {alt.price < item.price && (
                        <span className="text-xs text-green-600 font-medium">saves €{(item.price - alt.price).toFixed(2)}</span>
                      )}
                      {selected === i && (
                        <div className="bg-primary rounded-full p-0.5 mt-1">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No alternatives found.</p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border px-5 py-4 pb-6 flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={fetchAlternatives} disabled={loading} className="gap-2">
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