import { useState, useEffect } from "react";
import { X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MEAL_LIBRARY, FALLBACK_MEALS } from "@/lib/mealLibrary";
import { useLanguage } from "@/lib/LanguageContext";

export default function MealSwapModal({ meal, mealType, dayIndex, availableIngredients, targetCalories, diet, onSwap, onClose }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchAlternatives = () => {
    const lib = MEAL_LIBRARY[diet] || FALLBACK_MEALS;
    const pool = lib.filter((m) => m.type === mealType && m.name !== meal.name);
    if (!pool.length) {
      setAlternatives([]);
      return;
    }
    // Fisher–Yates shuffle, take 3 distinct picks (instant, no LLM call).
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setAlternatives(
      shuffled.slice(0, 3).map((m) => ({
        name: m.name,
        calories: Math.round(targetCalories),
        description: "A simple pick from your meal library.",
        ingredients: [],
      }))
    );
  };

  useEffect(() => {
    fetchAlternatives();
  }, []);

  const handleConfirm = () => {
    if (!selected && selected !== 0) return;
    onSwap(dayIndex, mealType, alternatives[selected]);
    onClose();
  };

  const mealTypeLabel = `${mealType === "breakfast" ? "🌅" : mealType === "lunch" ? "☀️" : "🌙"} ${t(mealType)}`;

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
        <div className="sticky top-0 bg-[#7DD3FC] text-[#111827] border-b-[3px] border-[#111827] px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="bba-sticker mb-1">{mealTypeLabel} · AI Swap</span>
            <h2 className="font-heading font-black text-lg text-[#111827] mt-0.5 leading-snug">Replace "{meal.name}"</h2>
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
              <p className="text-sm font-heading font-bold text-muted-foreground text-center">Finding alternatives with your ingredients…</p>
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-muted/50 rounded-2xl p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : alternatives?.length > 0 ? (
            <>
              <p className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Select an alternative meal:</p>
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
                      <p className={`text-xs font-medium mt-0.5 ${selected === i ? "text-[#111827]/80" : "text-muted-foreground"}`}>{alt.description}</p>
                      {alt.ingredients?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alt.ingredients.map((ing, j) => (
                            <span key={j} className="text-xs font-bold bg-white text-[#111827] border border-[#111827] px-2 py-0.5 rounded-full">
                              {ing.name} · {ing.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-xs font-heading font-black bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full">
                        {alt.calories} kcal
                      </span>
                      {selected === i && (
                        <div className="bg-white border-2 border-[#111827] rounded-full p-1">
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
            Use This Meal
          </Button>
        </div>
      </motion.div>
    </div>
  );
}