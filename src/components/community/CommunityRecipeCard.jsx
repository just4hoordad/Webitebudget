import { Clock, Users, ChefHat, ListOrdered } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function CommunityRecipeCard({ entry }) {
  const { t } = useLanguage();
  const recipe = entry?.recipe || {};
  const title = recipe.title || entry?.mealName || (t("recipe") || "Recipe");

  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  return (
    <div className="bba-t bg-card p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-lg bg-[#78a71b] border-2 border-[#111827] flex items-center justify-center shrink-0">
          <ChefHat className="h-4 w-4 text-[#111827]" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-heading font-bold text-sm text-foreground leading-tight">{title}</h4>
          <div className="flex gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
            {recipe.prep_time != null && (
              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{recipe.prep_time}m {t("prepTime") || "prep"}</span>
            )}
            {recipe.cook_time != null && (
              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{recipe.cook_time}m {t("cookTime") || "cook"}</span>
            )}
            {recipe.servings != null && (
              <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{recipe.servings}</span>
            )}
          </div>
        </div>
      </div>

      {ingredients.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-heading font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <ListOrdered className="h-3 w-3" />{t("ingredients") || "Ingredients"}
          </p>
          <ul className="space-y-1">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-xs text-foreground flex gap-1.5">
                <span className="text-primary shrink-0">•</span>
                <span><span className="font-medium">{ing.name}</span>{ing.quantity ? <span className="text-muted-foreground"> — {ing.quantity}</span> : null}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {steps.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-heading font-bold uppercase tracking-wide text-muted-foreground">{t("steps") || "Steps"}</p>
          <ol className="space-y-1.5">
            {steps.map((step, i) => (
              <li key={i} className="text-xs text-foreground flex gap-2">
                <span className="flex-none h-4 w-4 rounded-full bg-[#78a71b] border border-[#111827] text-[9px] font-bold text-[#111827] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-snug">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {ingredients.length === 0 && steps.length === 0 && (
        <p className="text-xs text-muted-foreground italic">{t("recipeIncomplete") || "Recipe details not available."}</p>
      )}
    </div>
  );
}