import { Clock, Users, Trash2, Edit2, Sparkles, ChefHat, Utensils, Sun, Moon, Coffee } from "lucide-react";

const TYPE_ICONS = {
  breakfast: Sun,
  lunch: Utensils,
  dinner: Moon,
  snack: Coffee,
};

export default function RecipeCard({ recipe, onEdit, onRemix, onDelete, onCook, L }) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const TypeIcon = TYPE_ICONS[recipe.mealType] || ChefHat;
  const isQuick = totalTime > 0 && totalTime <= 30;

  return (
    <div className="bba-t bg-card p-4 space-y-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TypeIcon className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {recipe.mealType ? L(recipe.mealType) : L("custom")}
            </span>
            {isQuick && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                ⚡ {L("under30min")}
              </span>
            )}
          </div>
          <h3 className="font-heading font-bold text-foreground leading-tight line-clamp-2">{recipe.title || L("untitledRecipe")}</h3>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {totalTime > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {totalTime} min
          </span>
        )}
        {recipe.servings > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {recipe.servings}
          </span>
        )}
        {recipe.diet && recipe.diet !== "custom" && (
          <span className="text-primary font-medium">{L(recipe.diet) || recipe.diet}</span>
        )}
      </div>

      {/* Ingredient preview */}
      {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {recipe.ingredients.slice(0, 4).map(i => i.name).join(", ")}
          {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4}`}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/60">
        <button
          onClick={onCook}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <ChefHat className="h-3.5 w-3.5" />
          {L("cookNow")}
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          title={L("editRecipe")}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemix}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          title={L("remixRecipe")}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-muted-foreground hover:text-destructive px-2 py-1.5 rounded-lg hover:bg-destructive/5 transition-colors ml-auto"
          title={L("deleteRecipe")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}