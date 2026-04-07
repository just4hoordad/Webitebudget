import { Badge } from "@/components/ui/badge";
import { Clock, Euro, Flame } from "lucide-react";

export default function MealCard({ meal }) {
  return (
    <div className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge variant="outline" className="text-xs mb-2">
            {meal.type}
          </Badge>
          <h3 className="font-heading font-semibold text-foreground leading-tight">
            {meal.name}
          </h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {meal.description}
      </p>

      {/* Ingredients */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {meal.ingredients?.slice(0, 5).map((ing, i) => (
          <span
            key={i}
            className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg"
          >
            {ing}
          </span>
        ))}
        {meal.ingredients?.length > 5 && (
          <span className="text-xs text-muted-foreground px-2 py-1">
            +{meal.ingredients.length - 5} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Euro className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">€{meal.cost?.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-accent" />
          <span>{meal.calories} kcal</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{meal.prepTime} min</span>
        </div>
      </div>
    </div>
  );
}