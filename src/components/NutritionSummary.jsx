import { Progress } from "@/components/ui/progress";
import { Flame, Beef, Droplets, Wheat } from "lucide-react";

export default function NutritionSummary({ nutrition }) {
  const items = [
    { label: "Calories", value: nutrition.calories, target: nutrition.caloriesTarget, unit: "kcal", icon: Flame, color: "text-orange-500" },
    { label: "Protein", value: nutrition.protein, target: nutrition.proteinTarget, unit: "g", icon: Beef, color: "text-red-500" },
    { label: "Carbs", value: nutrition.carbs, target: nutrition.carbsTarget, unit: "g", icon: Wheat, color: "text-amber-500" },
    { label: "Fat", value: nutrition.fat, target: nutrition.fatTarget, unit: "g", icon: Droplets, color: "text-blue-500" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-heading font-semibold mb-4">Daily Nutrition (avg.)</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          const pct = Math.min(100, Math.round((item.value / item.target) * 100));
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-muted-foreground">
                  {item.value}{item.unit} / {item.target}{item.unit}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}