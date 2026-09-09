// Date helpers for the Plan Builder week/month views.
// The plan is index-based (day 0..n); we map each index to a real calendar
// date starting "today" so the calendar views show real weekdays/dates.

export const WD = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function planStartDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateForIndex(start, i) {
  const d = new Date(start);
  d.setDate(d.getDate() + i);
  return d;
}