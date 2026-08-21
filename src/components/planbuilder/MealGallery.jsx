import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { MEAL_LIBRARY, FALLBACK_MEALS } from "@/lib/mealLibrary";
import { Search, Plus, ArrowRight } from "lucide-react";

function MealCard({ meal, onPick }) {
  const { t } = useLanguage();
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative rounded-xl overflow-hidden border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all active:scale-95 hover:shadow-xl hover:border-primary/50 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3]">
        {meal.img && !broken ? (
          <img
            src={meal.img}
            alt={meal.name}
            loading="lazy"
            onError={() => setBroken(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${meal.color} flex items-center justify-center`}>
            <span className="text-3xl drop-shadow-sm">{meal.emoji}</span>
          </div>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* Add badge */}
        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-semibold opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-md">
          <Plus className="h-2.5 w-2.5" /> {t("add") || "Add"}
        </span>
        <span className="absolute left-2 right-2 bottom-1.5">
          <span className="block text-xs font-medium text-white leading-tight line-clamp-2 drop-shadow-sm">
            {meal.name}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function MealGallery({ diet, onPick, targetLabel, activeType }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const all = MEAL_LIBRARY[diet] || FALLBACK_MEALS;

  const meals = useMemo(() => {
    let list = all;
    if (activeType) list = list.filter((m) => m.type === activeType);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q));
    return list;
  }, [all, activeType, query]);

  const slotLabel = activeType ? (t(activeType) || activeType) : "";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {slotLabel ? `${slotLabel} ${t("meals") || "meals"}` : (t("addMealTitle") || "Tap a meal to add it")}
        </p>
        {targetLabel && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-1 whitespace-nowrap">
            <ArrowRight className="h-3 w-3" /> {targetLabel}
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchMeals") || "Search meals…"}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow placeholder:text-muted-foreground/60"
        />
      </div>

      {meals.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {meals.map((m, i) => (
            <MealCard key={`${m.name}-${i}`} meal={m} onPick={() => onPick(m.name)} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t("noMealsFound") || "No meals match your search."}
        </p>
      )}
    </div>
  );
}