import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WD_MON = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function MonthView({ plan, slots, selectCell, activeDay, monthAnchor, setMonthAnchor, startDate, days, currentLanguage }) {
  const cells = useMemo(() => {
    const m = new Date(monthAnchor);
    m.setDate(1);
    const firstWeekday = (m.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const date = new Date(m.getFullYear(), m.getMonth(), dd);
      const idx = Math.round((date - startDate) / 86400000);
      out.push({ date, idx });
    }
    return out;
  }, [monthAnchor, startDate]);

  const monthLabel = monthAnchor.toLocaleDateString(currentLanguage?.code || "en", { month: "long", year: "numeric" });
  const shift = (n) => {
    const m = new Date(monthAnchor);
    m.setMonth(m.getMonth() + n);
    setMonthAnchor(m);
  };
  const initials = (name) => (name || "").trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-heading font-semibold capitalize">{monthLabel}</span>
        <button type="button" onClick={() => shift(1)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WD_MON.map((w) => (
          <div key={w} className="text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground py-1">{w}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="aspect-square rounded-lg" />;
          const { date, idx } = cell;
          const inRange = idx >= 0 && idx < days;
          const day = inRange ? plan[idx] : null;
          const filledCount = day ? slots.filter((s) => (day[s.key] || "").trim()).length : 0;
          const selected = idx === activeDay && inRange;
          return (
            <button
              key={i}
              type="button"
              disabled={!inRange}
              onClick={() => inRange && selectCell(idx, slots[0].key)}
              className={`aspect-square rounded-lg border p-1 flex flex-col items-center justify-start text-center transition-colors ${
                selected ? "border-primary bg-primary/10"
                : inRange ? "border-border bg-card hover:bg-muted/40"
                : "border-transparent text-muted-foreground/40"
              }`}
            >
              <span className={`text-xs font-semibold ${inRange ? "text-foreground" : ""}`}>{date.getDate()}</span>
              {inRange && filledCount > 0 && (
                <span className="mt-auto text-[8px] font-medium text-muted-foreground leading-none">
                  {slots.map((s) => initials(day[s.key])).filter(Boolean).slice(0, 3).join(" ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}