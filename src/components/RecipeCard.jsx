import { Clock, Flame, Euro, ChefHat } from "lucide-react";

const DIET_COLORS = {
  vegan: "bg-green-100 text-green-700",
  vegetarian: "bg-lime-100 text-lime-700",
  "high-protein": "bg-blue-100 text-blue-700",
  halal: "bg-purple-100 text-purple-700",
  "gluten-free": "bg-orange-100 text-orange-700",
  balanced: "bg-gray-100 text-gray-700",
};

export default function RecipeCard({ recipe, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 hover:shadow-md transition-all duration-200 space-y-3 w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading font-semibold text-base leading-tight">{recipe.name}</h3>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${DIET_COLORS[recipe.diet] || DIET_COLORS.balanced}`}>
          {recipe.diet}
        </span>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {recipe.prepTime} min
        </span>
        <span className="flex items-center gap-1">
          <Flame className="h-3.5 w-3.5" /> {recipe.calories} kcal
        </span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          <Euro className="h-3.5 w-3.5" />{recipe.cost?.toFixed(2)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {recipe.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}