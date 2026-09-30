import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";

export default function AddItemModal({ stores, diet, onAdd, onClose }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [selected, setSelected] = useState(null);

  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const addKey = JSON.stringify({ q: trimmed, stores, diet });
    try {
      const raw = localStorage.getItem("bb_additem_swaps");
      if (raw) {
        const map = JSON.parse(raw);
        const entry = map[addKey];
        if (entry && Date.now() - entry.ts < 24 * 60 * 60 * 1000) {
          setAlternatives(entry.alternatives);
          setSelected(null);
          return;
        }
      }
    } catch { /* ignore */ }
    setLoading(true);
    setAlternatives([]);
    setSelected(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `The user wants to add "${trimmed}" to their German grocery list.
Search these stores: ${stores}.
Find 3-4 real branded product alternatives available at those stores with real 2024-2025 German prices.
Use exact branded product names as sold in-store (e.g. "Ja! Vollmilch 3,5% 1L").
Diet preference: ${diet}.
Return category name always in English (e.g. "Dairy", "Snacks", "Vegetables").`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
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
                unit_price: { type: "number" },
                price: { type: "number" },
                normal_price: { type: "number" },
                store: { type: "string" },
                calories_info: { type: "string" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });
    const alts = result.alternatives || [];
    setAlternatives(alts);
    try {
      const raw = localStorage.getItem("bb_additem_swaps");
      const map = raw ? JSON.parse(raw) : {};
      map[addKey] = { ts: Date.now(), alternatives: alts };
      localStorage.setItem("bb_additem_swaps", JSON.stringify(map));
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onAdd(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-foreground">{t("addItemTitle")}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={t("addItemPlaceholder")}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <button
              onClick={search}
              disabled={!query.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("search")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t("addItemHint")}</p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">{t("search")} {stores}…</p>
            </div>
          )}
          {!loading && alternatives.length === 0 && query && (
            <p className="text-sm text-muted-foreground text-center py-8">{t("searchProductsHint")}</p>
          )}
          {alternatives.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(item)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                selected?.name === item.name
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} · {item.calories_info}</p>
                  {item.store && <p className="text-xs text-muted-foreground">{item.store}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-foreground">€{item.price?.toFixed(2)}</p>
                  {item.normal_price != null && item.normal_price > item.price && (
                    <p className="text-xs text-green-600">saves €{(item.normal_price - item.price).toFixed(2)}</p>
                  )}
                </div>
                {selected?.name === item.name && (
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors">
            {t("cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {t("addToList")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}