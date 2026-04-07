import { X, Clock, Flame, Euro, Users, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MACRO_COLORS = {
  protein: "bg-green-100 text-green-700",
  carbs: "bg-blue-100 text-blue-700",
  fat: "bg-amber-100 text-amber-700",
  fiber: "bg-purple-100 text-purple-700",
};

export default function RecipeModal({ recipe, onClose }) {
  const navigate = useNavigate();

  if (!recipe) return null;

  const handleAddToPlan = () => {
    const params = new URLSearchParams({
      budget: "150",
      stores: "aldi,lidl",
      diet: recipe.diet || "balanced",
      people: "1",
      calories: recipe.calories || 2000,
    });
    navigate(`/meal-plan?${params.toString()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 sticky top-0 bg-background border-b border-border z-10">
          <div className="pr-8">
            <h2 className="font-heading font-bold text-xl">{recipe.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{recipe.description}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-secondary transition-colors shrink-0">
            <X className="h-5 w-5" />
          </button>
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

          {/* CTA */}
          <Button onClick={handleAddToPlan} className="w-full rounded-xl gap-2 font-heading font-semibold">
            <ChefHat className="h-4 w-4" />
            Generate Meal Plan with this Diet
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}