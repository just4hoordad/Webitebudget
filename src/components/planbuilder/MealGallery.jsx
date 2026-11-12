import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { MEAL_LIBRARY, FALLBACK_MEALS } from "@/lib/mealLibrary";
import { DISH_IMAGES } from "@/lib/dishImages";
import { Search, Plus, ArrowRight } from "lucide-react";

function MealCard({ meal, onPick }) {
  const { t } = useLanguage();
  const [broken, setBroken] = useState(false);
  const photo = DISH_IMAGES[meal.name] || meal.img;
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.94 }}
      onClick={onPick}
      className="group relative rounded-2xl overflow-hidden border-[2.5px] border-[#111827] dark:border-[#78a71b] bg-card shadow-[3px_3px_0_#111827] focus:outline-none text-left"
    >
      <div className="relative aspect-[4/3]">
        {photo && !broken ? (
          <img
            src={photo}
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
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        {/* Arcade + Add sticker */}
        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-[#78a71b] text-[#111827] border-2 border-[#111827] px-2 py-0.5 text-[10px] font-heading font-black shadow-[2px_2px_0_#111827] group-hover:bg-[#FFB020] transition-colors">
          <Plus className="h-2.5 w-2.5" /> {t("add") || "Add"}
        </span>
        <span className="absolute left-2.5 right-2.5 bottom-2">
          <span className="block text-xs font-heading font-extrabold text-white leading-tight line-clamp-2 drop-shadow">
            {meal.name}
          </span>
        </span>
      </div>
    </motion.button>
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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-heading font-black text-foreground">
          🃏 {slotLabel ? `${slotLabel} ${t("meals") || "meals"}` : (t("addMealTitle") || "Tap a meal card to deal it")}
        </p>
        {targetLabel && (
          <span className="inline-flex items-center gap-1 text-[11px] font-heading font-black text-[#111827] bg-[#FFB020] border-2 border-[#111827] rounded-full px-2.5 py-0.5 shadow-[2px_2px_0_#111827] whitespace-nowrap">
            <ArrowRight className="h-3 w-3" /> {targetLabel}
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchMeals") || "Search meals…"}
          className="w-full pl-9 pr-3 py-2.5 text-sm font-medium rounded-xl border-2 border-[#111827] dark:border-[#78a71b] bg-[#F3F8E6]/60 dark:bg-secondary focus:outline-none focus:bg-card transition-colors placeholder:text-muted-foreground/70"
        />
      </div>

      {meals.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {meals.map((m, i) => (
            <MealCard key={`${m.name}-${i}`} meal={m} onPick={() => onPick(m.name)} />
          ))}
        </div>
      ) : (
        <p className="text-xs font-heading font-bold text-muted-foreground text-center py-5">
          {t("noMealsFound") || "No meals match your search."}
        </p>
      )}
    </div>
  );
}