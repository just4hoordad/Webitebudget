// Coerce a meal slot's stored value into a list of dish objects { name, side }.
// Handles legacy string values and the new array format used by the Plan Builder.
export function toDishes(val) {
  if (Array.isArray(val)) {
    return val.map((d) =>
      typeof d === "string"
        ? { name: d, side: false }
        : { name: (d && d.name) || "", side: !!(d && d.side) }
    );
  }
  const s = (val || "").trim();
  return s ? [{ name: s, side: false }] : [];
}

export function dishList(day, key) {
  return toDishes(day ? day[key] : undefined);
}

export function filledDishes(day, key) {
  return dishList(day, key).filter((d) => d.name.trim());
}

export function mealFilled(day, key) {
  return filledDishes(day, key).length > 0;
}