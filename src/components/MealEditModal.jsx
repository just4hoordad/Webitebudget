import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function MealEditModal({ meal, mealType, dayIndex, groceryItems, onSave, onClose }) {
  const { t } = useLanguage();
  const [mealName, setMealName] = useState(meal.name || "");
  const [ingredients, setIngredients] = useState(meal.ingredients || []);

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  };

  const handleSave = () => {
    onSave(dayIndex, mealType, {
      name: mealName,
      calories: meal.calories,
      ingredients: ingredients.filter(i => i.name && i.quantity),
    });
    onClose();
  };

  const mealTypeLabel = t(mealType);

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
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-primary uppercase tracking-wide">{mealTypeLabel} · {t("editMeal")}</p>
            <h2 className="font-heading font-bold text-foreground mt-0.5">{t("editMeal")}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Meal name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">{t("mealName")}</label>
            <Input
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder={t("mealName")}
              className="w-full"
            />
          </div>

          {/* Calories */}
          <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
            {t("calories")}: {meal.calories} kcal
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">{t("ingredients")}</label>
            <div className="space-y-2">
              <AnimatePresence>
                {ingredients.map((ing, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
                        placeholder={t("ingredientName")}
                        className="text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(i, "quantity", e.target.value)}
                        placeholder="200 g"
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveIngredient(i)}
                      className="text-destructive hover:text-destructive/80 p-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button onClick={handleAddIngredient} variant="outline" size="sm" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                {t("addIngredient")}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border px-5 py-4 pb-6 flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            {t("cancel")}
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            {t("saveChanges")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}