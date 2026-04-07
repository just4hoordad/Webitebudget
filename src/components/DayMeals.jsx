import MealCard from "./MealCard";

export default function DayMeals({ day, meals }) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold text-lg sticky top-16 bg-background/90 backdrop-blur-sm py-2 z-10">
        {day}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {meals.map((meal, i) => (
          <MealCard key={i} meal={meal} />
        ))}
      </div>
    </div>
  );
}