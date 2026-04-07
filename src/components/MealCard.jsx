import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Euro, Flame, ChevronDown, ChevronUp } from "lucide-react";

const MACRO_COLORS = {
  protein: "bg-green-100 text-green-700",
  carbs: "bg-blue-100 text-blue-700",
  fat: "bg-amber-100 text-amber-700",
  fiber: "bg-purple-100 text-purple-700",
};

export default function MealCard({ meal }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      {/* Main content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-xs mb-2">{meal.type}</Badge>
            <h3 className="font-heading font-semibold text-foreground leading-tight">{meal.name}</h3>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{meal.description}</p>

        {/* Top 4 ingredients */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {meal.ingredients?.slice(0, 4).map((ing, i) => (
            <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg">{ing}</span>
          ))}
          {meal.ingredients?.length > 4 && (
            <span className="text-xs text-muted-foreground px-2 py-1">+{meal.ingredients.length - 4} more</span>
          )}
        </div>

        {/* Stats row */}
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
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            {expanded ? "Less" : "Details"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4 bg-secondary/20">
          {/* All ingredients */}
          {meal.ingredients?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ingredients</h4>
              <ul className="space-y-1.5">
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step-by-step instructions */}
          {meal.instructions?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Instructions</h4>
              <ol className="space-y-2">
                {meal.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Nutrition */}
          {meal.nutrition && Object.keys(meal.nutrition).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Nutrition per serving</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(meal.nutrition).map(([key, val]) => (
                  <span key={key} className={`text-xs font-medium px-2.5 py-1 rounded-full ${MACRO_COLORS[key] || "bg-gray-100 text-gray-700"}`}>
                    {key}: {val}g
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}