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
        <div className="sticky top-0 bg-[#C084FC] text-[#111827] border-b-[3px] border-[#111827] px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <span className="bba-sticker mb-1">{mealTypeLabel}</span>
            <h2 className="font-heading font-black text-lg text-[#111827] mt-0.5">{t("editMeal")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827] shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Meal name */}
          <div>
            <label className="text-xs font-heading font-black uppercase tracking-wider text-foreground mb-2 block">{t("mealName")}</label>
            <Input
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder={t("mealName")}
              className="w-full border-2 border-[#111827] rounded-xl font-medium"
            />
          </div>

          {/* Calories */}
          <div className="text-sm font-heading font-extrabold text-[#111827] bg-[#FFB020] border-2 border-[#111827] px-3.5 py-2 rounded-xl shadow-[2px_2px_0_#111827]">
            🔥 {t("calories")}: {meal.calories} kcal
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-xs font-heading font-black uppercase tracking-wider text-foreground mb-2 block">{t("ingredients")}</label>
            <div className="space-y-2">
              <AnimatePresence>
                {ingredients.map((ing, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        value={ing.name}
                        onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
                        placeholder={t("ingredientName")}
                        className="text-sm border-2 border-[#111827] rounded-xl"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(i, "quantity", e.target.value)}
                        placeholder="200 g"
                        className="text-sm border-2 border-[#111827] rounded-xl"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(i)}
                      className="h-9 w-9 rounded-xl bg-white border-2 border-[#111827] text-[#FF3E7F] hover:bg-[#FF3E7F] hover:text-white flex items-center justify-center transition-colors shrink-0"
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
        <div className="bg-card border-t-2 border-[#111827]/15 dark:border-white/15 px-5 py-4 pb-6 flex gap-3 shrink-0">
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