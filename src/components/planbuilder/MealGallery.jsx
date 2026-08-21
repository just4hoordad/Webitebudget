import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { MEAL_LIBRARY, FALLBACK_MEALS } from "@/lib/mealLibrary";

function MealCard({ meal, onPick }) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-transform active:scale-95"
    >
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
          <span className="text-2xl drop-shadow-sm">{meal.emoji}</span>
        </div>
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-1.5">
        <span className="block text-[10px] font-medium text-white leading-tight line-clamp-2">
          {meal.name}
        </span>
      </span>
    </button>
  );
}

export default function MealGallery({ diet, onPick }) {
  const { t } = useLanguage();
  const meals = MEAL_LIBRARY[diet] || FALLBACK_MEALS;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">
        {t("mealGalleryTitle") || "Tap a meal picture to add it"}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {meals.map((m, i) => (
          <MealCard key={`${m.name}-${i}`} meal={m} onPick={() => onPick(m.name)} />
        ))}
      </div>
    </div>
  );
}