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
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="h-7 w-7 rounded-lg bg-[#FF8FB5] border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]">
              <TypeIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground">
              {recipe.mealType ? L(recipe.mealType) : L("custom")}
            </span>
            {isQuick && (
              <span className="text-[10px] font-heading font-black text-[#111827] bg-[#FFB020] border border-[#111827] px-2 py-0.5 rounded-full">
                ⚡ {L("under30min")}
              </span>
            )}
          </div>
          <h3 className="font-heading font-black text-foreground leading-tight line-clamp-2">{recipe.title || L("untitledRecipe")}</h3>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground flex-wrap">
        {totalTime > 0 && (
          <span className="flex items-center gap-1 bg-[#F3F8E6] dark:bg-secondary text-[#111827] dark:text-foreground border border-[#111827] px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" />
            {totalTime} min
          </span>
        )}
        {recipe.servings > 0 && (
          <span className="flex items-center gap-1 bg-[#F3F8E6] dark:bg-secondary text-[#111827] dark:text-foreground border border-[#111827] px-2 py-0.5 rounded-full">
            <Users className="h-3 w-3" />
            {recipe.servings}
          </span>
        )}
        {recipe.diet && recipe.diet !== "custom" && (
          <span className="bg-[#78a71b] text-[#111827] border border-[#111827] px-2 py-0.5 rounded-full font-heading font-extrabold">{L(recipe.diet) || recipe.diet}</span>
        )}
      </div>

      {/* Ingredient preview */}
      {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
        <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
          {recipe.ingredients.slice(0, 4).map(i => i.name).join(", ")}
          {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4}`}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t-2 border-[#111827]/12 dark:border-white/15">
        <button
          type="button"
          onClick={onCook}
          className="flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#111827] bg-[#78a71b] border-[1.5px] border-[#111827] shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] px-3 py-1.5 rounded-full transition-all"
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