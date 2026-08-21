import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { MEAL_LIBRARY, FALLBACK_MEALS } from "@/lib/mealLibrary";

function MealCard({ meal, onPick }) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative rounded-xl overflow-hidden border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all active:scale-95 hover:shadow-lg hover:border-primary/40"
    >
      <div className="relative aspect-[4/3]">
        {meal.img && !broken ? (
          <img
            src={meal.img}
            alt={meal.name}
            loading="lazy"
            onError={() => setBroken(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${meal.color} flex items-center justify-center`}>
            <span className="text-3xl drop-shadow-sm">{meal.emoji}</span>
          </div>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <span className="absolute left-2 right-2 bottom-1.5">
          <span className="block text-xs font-medium text-white leading-tight line-clamp-2">
            {meal.name}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function MealGallery({ diet, onPick }) {
  const { t } = useLanguage();
  const meals = MEAL_LIBRARY[diet] || FALLBACK_MEALS;

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-foreground">
        {t("addMealTitle") || "Tap a meal to add it"}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {meals.map((m, i) => (
          <MealCard key={`${m.name}-${i}`} meal={m} onPick={() => onPick(m.name)} />
        ))}
      </div>
    </div>
  );
}