import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/aiClient";
import { useLanguage } from "@/lib/LanguageContext";
import { isAllowedStoreItem } from "@/lib/generateGroceries";
import { sanitizeItemCalories } from "@/lib/calorieSanity";

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
    const result = await invokeAI({
      prompt: `Find 3-4 real branded products for "${trimmed}" at these German stores: ${stores}. Diet: ${diet}. Use exact in-store product names with pack size (e.g. "Ja! Vollmilch 3,5% 1L") and 2024-2025 prices. Set calories_info to kcal/100g or kcal/100ml, total_kcal to total calories of the full quantity, and protein_g/carb_g/fat_g for that quantity. Category names in English.`,
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
                total_kcal: { type: "number" },
                protein_g: { type: "number" },
                carb_g: { type: "number" },
                fat_g: { type: "number" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });
    const alts = (result.alternatives || []).filter((a) => isAllowedStoreItem(a, stores)).map(sanitizeItemCalories);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-card text-card-foreground rounded-3xl border-[3px] border-[#111827] dark:border-[#78a71b] shadow-[6px_6px_0_#111827] dark:shadow-[6px_6px_0_#000] w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#78a71b] text-[#111827] border-b-[3px] border-[#111827]">
          <h3 className="font-heading font-black text-lg text-[#111827]">{t("addItemTitle")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827] hover:bg-[#FFB020] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4 border-b-2 border-[#111827]/15 dark:border-white/15 bg-[#F3F8E6] dark:bg-secondary">
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 border-2 border-[#111827] rounded-xl px-3.5 py-2 text-sm font-medium bg-white text-[#111827] focus:outline-none shadow-[2px_2px_0_#111827]"
              placeholder={t("addItemPlaceholder")}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
            />
            <button
              type="button"
              onClick={search}
              disabled={!query.trim() || loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FFB020] text-[#111827] border-2 border-[#111827] rounded-xl text-xs font-heading font-black shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("search")}
            </button>
          </div>
          <p className="text-xs font-medium text-[#111827]/75 dark:text-muted-foreground mt-2">{t("addItemHint")}</p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-heading font-bold text-muted-foreground animate-pulse">{t("search")} {stores}…</p>
            </div>
          )}
          {!loading && alternatives.length === 0 && query && (
            <p className="text-sm font-medium text-muted-foreground text-center py-8">{t("searchProductsHint")}</p>
          )}
          {alternatives.map((item, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => setSelected(item)}
              className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                selected?.name === item.name
                  ? "border-[#111827] bg-[#78a71b] text-[#111827] shadow-[3px_3px_0_#111827]"
                  : "border-[#111827]/25 dark:border-[#78a71b]/40 bg-background hover:border-[#111827]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-extrabold text-sm truncate">{item.name}</p>
                  <p className={`text-xs font-medium mt-0.5 ${selected?.name === item.name ? "text-[#111827]/80" : "text-muted-foreground"}`}>{item.quantity} · {item.calories_info}</p>
                  {item.store && <p className={`text-xs font-bold ${selected?.name === item.name ? "text-[#111827]" : "text-muted-foreground"}`}>{item.store}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading font-black text-sm">€{item.price?.toFixed(2)}</p>
                  {item.normal_price != null && item.normal_price > item.price && (
                    <p className={`text-[11px] font-bold ${selected?.name === item.name ? "text-[#111827]" : "text-primary"}`}>saves €{(item.normal_price - item.price).toFixed(2)}</p>
                  )}
                </div>
                {selected?.name === item.name && (
                  <span className="h-6 w-6 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-[#111827] stroke-[3]" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-[#111827]/15 dark:border-white/15 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-[#111827] bg-white text-[#111827] text-sm font-heading font-extrabold shadow-[2px_2px_0_#111827] hover:bg-[#F3F8E6] transition-all"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 px-4 py-2.5 rounded-full border-2 border-[#111827] bg-[#78a71b] text-[#111827] text-sm font-heading font-black shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-40"
          >
            {t("addToList")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}