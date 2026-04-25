import { useState, useEffect } from "react";
import { X, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function MealSwapModal({ meal, mealType, dayIndex, availableIngredients, targetCalories, diet, onSwap, onClose }) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchAlternatives = async () => {
    setLoading(true);
    setAlternatives(null);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a meal planning assistant. Suggest exactly 3 alternative ${mealType} meals to replace: "${meal.name}".

CONSTRAINTS:
- Use ONLY ingredients from this list: ${availableIngredients.join(", ")}
- Target calories: ~${targetCalories} kcal (±50 kcal)
- Diet type: ${diet}
- Meals must be realistic and easy to prepare

For each alternative, provide:
- A short creative meal name
- Exact calorie count
- List of ingredients used (name + quantity)
- A one-line description`,
      response_json_schema: {
        type: "object",
        properties: {
          alternatives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "number" },
                description: { type: "string" },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "string" }
                    }
                  }
                }
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
    if (!selected && selected !== 0) return;
    onSwap(dayIndex, mealType, alternatives[selected]);
    onClose();
  };

  const mealTypeLabel = mealType === "breakfast" ? "🌅 Breakfast" : mealType === "lunch" ? "☀️ Lunch" : "🌙 Dinner";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: "70vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide">{mealTypeLabel} · AI Swap</p>
            <h2 className="font-heading font-bold text-foreground mt-0.5">Replace "{meal.name}"</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Finding alternatives with your ingredients…</p>
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-muted/50 rounded-xl p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : alternatives?.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Select an alternative meal:</p>
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
                      <p className="text-xs text-muted-foreground mt-0.5">{alt.description}</p>
                      {alt.ingredients?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alt.ingredients.map((ing, j) => (
                            <span key={j} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                              {ing.name} · {ing.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-primary">{alt.calories} kcal</span>
                      {selected === i && (
                        <div className="bg-primary rounded-full p-0.5">
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
            Use This Meal
          </Button>
        </div>
      </motion.div>
    </div>
  );
}