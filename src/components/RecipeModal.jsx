import { X, Clock, Flame, Euro, ChefHat, ArrowRight, Heart, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MACRO_COLORS = {
  protein: "bg-green-100 text-green-700",
  carbs: "bg-blue-100 text-blue-700",
  fat: "bg-amber-100 text-amber-700",
  fiber: "bg-purple-100 text-purple-700",
};

export default function RecipeModal({ recipe, onClose, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate();
  const [addedToGrocery, setAddedToGrocery] = useState(false);

  if (!recipe) return null;

  const primaryDiet = Array.isArray(recipe.diet) ? recipe.diet[0] : recipe.diet;

  const handleAddToMealPlan = () => {
    const params = new URLSearchParams({
      budget: "150",
      stores: "aldi,lidl",
      diet: primaryDiet || "balanced",
      people: "1",
      calories: recipe.calories || 2000,
    });
    navigate(`/meal-plan?${params.toString()}`);
    onClose();
  };

  const handleAddToGrocery = () => {
    const existing = JSON.parse(localStorage.getItem("bb_pinned_groceries") || "[]");
    const newItems = (recipe.ingredients || []).map((ing) => ({
      name: ing,
      quantity: "1x",
      price: parseFloat((recipe.cost / (recipe.ingredients?.length || 1)).toFixed(2)),
      store: "Any",
      fromRecipe: recipe.name,
    }));
    const merged = [...existing, ...newItems];
    localStorage.setItem("bb_pinned_groceries", JSON.stringify(merged));
    setAddedToGrocery(true);
    setTimeout(() => setAddedToGrocery(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 sticky top-0 bg-background border-b border-border z-10">
          <div className="pr-4 flex-1">
            <h2 className="font-heading font-bold text-xl">{recipe.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{recipe.description}</p>
            {Array.isArray(recipe.diet) && recipe.diet.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.diet.map((d) => (
                  <span key={d} className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">{d}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleFavorite && (
              <button onClick={onToggleFavorite} className={`p-2 rounded-xl transition-colors ${isFavorite ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"}`}>
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-rose-500" : ""}`} />
              </button>
            )}
            <button onClick={onClose} className="rounded-xl p-2 hover:bg-secondary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Clock, label: "Prep Time", value: `${recipe.prepTime} min` },
              { icon: Flame, label: "Calories", value: `${recipe.calories} kcal` },
              { icon: Euro, label: "Cost", value: `€${recipe.cost?.toFixed(2)}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-3 text-center">
                <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <div className="font-heading font-bold text-sm">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Macros */}
          {recipe.nutrition && (
            <div>
              <h3 className="font-heading font-semibold mb-3">Nutrition per serving</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(recipe.nutrition).map(([key, val]) => (
                  <span key={key} className={`text-xs font-medium px-3 py-1.5 rounded-full ${MACRO_COLORS[key] || "bg-gray-100 text-gray-700"}`}>
                    {key}: {val}g
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h3 className="font-heading font-semibold mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">{i + 1}</span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div>
              <h3 className="font-heading font-semibold mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAddToGrocery}
              variant="outline"
              className="w-full rounded-xl gap-2 font-heading font-semibold"
            >
              {addedToGrocery ? <Check className="h-4 w-4 text-green-600" /> : <ShoppingCart className="h-4 w-4" />}
              {addedToGrocery ? "Added to grocery list!" : "Add ingredients to grocery list"}
            </Button>
            <Button onClick={handleAddToMealPlan} className="w-full rounded-xl gap-2 font-heading font-semibold">
              <ChefHat className="h-4 w-4" />
              Generate Meal Plan with this Diet
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}