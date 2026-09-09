import { useState } from "react";
import { MEAL_LIBRARY } from "@/lib/mealLibrary";
import { DISH_IMAGES } from "@/lib/dishImages";

const ALL_MEALS = Object.values(MEAL_LIBRARY).flat();

export function mealMeta(name) {
  const n = (name || "").trim();
  if (!n) return null;
  if (DISH_IMAGES[n]) return { img: DISH_IMAGES[n], emoji: "🍽️", color: "from-muted to-muted-foreground/30" };
  const found = ALL_MEALS.find((m) => m.name.toLowerCase() === n.toLowerCase());
  if (found) return { img: found.img, emoji: found.emoji, color: found.color };
  return { img: null, emoji: "🍽️", color: "from-muted to-muted-foreground/30" };
}

export default function MealThumb({ name, size = "h-9 w-9" }) {
  const meta = mealMeta(name);
  const [broken, setBroken] = useState(false);
  if (!name) return null;
  const img = meta?.img;
  if (img && !broken) {
    return (
      <img
        src={img}
        alt={name}
        loading="lazy"
        onError={() => setBroken(true)}
        className={`${size} rounded-full object-cover border border-border shrink-0 bg-muted`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${meta?.color || "from-muted to-muted"} flex items-center justify-center border border-border shrink-0`}>
      <span className="text-sm">{meta?.emoji || "🍽️"}</span>
    </div>
  );
}