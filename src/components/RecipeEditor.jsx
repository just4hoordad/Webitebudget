import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2, Clock, Users, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

const DIET_OPTIONS = ["balanced", "vegetarian", "vegan", "high-protein", "pescatarian", "gluten-free", "halal", "frozen", "custom"];
const TYPE_OPTIONS = ["breakfast", "lunch", "dinner", "snack"];

export default function RecipeEditor({ recipe, onSave, onClose, L }) {
  const [title, setTitle] = useState(recipe?.title || "");
  const [mealType, setMealType] = useState(recipe?.mealType || "dinner");
  const [diet, setDiet] = useState(recipe?.diet || "custom");
  const [servings, setServings] = useState(recipe?.servings || 2);
  const [prepTime, setPrepTime] = useState(recipe?.prepTime || 0);
  const [cookTime, setCookTime] = useState(recipe?.cookTime || 0);
  const [ingredients, setIngredients] = useState(
    Array.isArray(recipe?.ingredients) && recipe.ingredients.length > 0
      ? recipe.ingredients
      : [{ name: "", quantity: "" }]
  );
  const [steps, setSteps] = useState(
    Array.isArray(recipe?.steps) && recipe.steps.length > 0
      ? recipe.steps
      : [""]
  );
  const [notes, setNotes] = useState(recipe?.notes || "");
  const [saving, setSaving] = useState(false);

  const updateIngredient = (i, field, val) =>
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing));
  const addIngredient = () => setIngredients(prev => [...prev, { name: "", quantity: "" }]);
  const removeIngredient = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  const updateStep = (i, val) => setSteps(prev => prev.map((s, idx) => idx === i ? val : s));
  const addStep = () => setSteps(prev => [...prev, ""]);
  const removeStep = (i) => setSteps(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const cleanIngredients = ingredients.filter(i => i.name && i.name.trim());
    const cleanSteps = steps.filter(s => s && s.trim());
    if (cleanIngredients.length === 0) {
      alert(L("ingredientEmpty"));
      return;
    }
    if (cleanSteps.length === 0) {
      alert(L("stepsEmpty"));
      return;
    }
    setSaving(true);
    onSave({
      title: title.trim() || L("untitledRecipe"),
      mealType,
      diet,
      servings: Number(servings) || 1,
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      ingredients: cleanIngredients.map(i => ({ name: i.name.trim(), quantity: (i.quantity || "").trim() })),
      steps: cleanSteps.map(s => s.trim()),
      notes: notes.trim(),
      source: recipe?.source || "custom",
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-0 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            {recipe?.id ? L("editRecipe") : L("addRecipe")}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{L("title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={L("untitledRecipe")}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            />
          </div>

          {/* Type + Diet */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{L("mealType")}</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{L(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{L("diet")}</label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {DIET_OPTIONS.map(d => <option key={d} value={d}>{L(d)}</option>)}
              </select>
            </div>
          </div>

          {/* Times + Servings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block flex items-center gap-1"><Clock className="h-3 w-3" />{L("prepTime")}</label>
              <input
                type="number"
                min="0"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block flex items-center gap-1"><Clock className="h-3 w-3" />{L("cookTime")}</label>
              <input
                type="number"
                min="0"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block flex items-center gap-1"><Users className="h-3 w-3" />{L("servings")}</label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{L("ingredients")}</label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder={L("ingredientName")}
                    className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                    placeholder={L("quantity")}
                    className="w-24 px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(i)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/5 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addIngredient}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> {L("addIngredient")}
            </button>
          </div>

          {/* Steps */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{L("steps")}</label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-1.5">
                    {i + 1}
                  </span>
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`${L("step")} ${i + 1}`}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(i)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/5 transition-colors mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> {L("addStep")}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">{L("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={L("notesPlaceholder")}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-3 flex items-center gap-3 shrink-0">
          <Button onClick={onClose} variant="ghost" className="flex-1">{L("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
            {saving ? L("saving") : L("save")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}