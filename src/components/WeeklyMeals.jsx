import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Euro, ChevronDown, ChevronUp } from "lucide-react";

const MEAL_COLORS = {
  breakfast: "bg-yellow-50 border-yellow-200 text-yellow-800",
  lunch: "bg-green-50 border-green-200 text-green-800",
  dinner: "bg-blue-50 border-blue-200 text-blue-800",
  snack: "bg-purple-50 border-purple-200 text-purple-800",
};

const MEAL_ICONS = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

function MealCard({ type, meal }) {
  const [expanded, setExpanded] = useState(false);
  if (!meal) return null;
  return (
    <div className={`rounded-xl border p-3 space-y-1.5 ${MEAL_COLORS[type]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm leading-tight">
          {MEAL_ICONS[type]} {meal.name}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs opacity-80">
        <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{meal.cost?.toFixed(2)}</span>
        <span>{meal.calories} kcal</span>
        {meal.prepTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{meal.prepTime}</span>}
      </div>
      {expanded && meal.ingredients?.length > 0 && (
        <div className="pt-1.5 border-t border-current/20">
          <p className="text-xs font-medium mb-1">Ingredients:</p>
          <div className="flex flex-wrap gap-1">
            {meal.ingredients.map((ing, i) => (
              <span key={i} className="text-xs bg-white/60 rounded-md px-2 py-0.5">{ing}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DayRow({ day }) {
  const [open, setOpen] = useState(false);
  const dayTotal = Object.values(day.meals || {}).reduce((sum, m) => sum + (m?.cost || 0), 0);
  const dayCalories = Object.values(day.meals || {}).reduce((sum, m) => sum + (m?.calories || 0), 0);

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-heading font-semibold text-sm w-24 text-left">{day.day}</span>
          <div className="flex gap-1">
            {Object.keys(day.meals || {}).map((type) => (
              <span key={type} className="text-xs">{MEAL_ICONS[type]}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>€{dayTotal.toFixed(2)}</span>
          <span>{dayCalories} kcal</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {open && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-secondary/20">
          {Object.entries(day.meals || {}).map(([type, meal]) => (
            <MealCard key={type} type={type} meal={meal} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeeklyMeals({ weeks }) {
  const [selectedWeek, setSelectedWeek] = useState(0);

  return (
    <div className="space-y-4">
      {/* Week tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weeks.map((week, i) => (
          <button
            key={i}
            onClick={() => setSelectedWeek(i)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              selectedWeek === i
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Week {week.weekNumber}
          </button>
        ))}
      </div>

      {/* Days */}
      <div className="space-y-2">
        {(weeks[selectedWeek]?.days || []).map((day, i) => (
          <DayRow key={i} day={day} />
        ))}
      </div>
    </div>
  );
}