// Friendly macro split: coloured bar + per-macro % and grams per day.
export default function MacroBreakdown({ macros, dailyKcal, L }) {
  const items = [
    { key: "protein", label: L("protein", "Protein"), hint: L("proteinHint", "muscles & fullness"), kcalPerG: 4, bar: "bg-sky-500", dot: "bg-sky-500" },
    { key: "carbs", label: L("carbs", "Carbs"), hint: L("carbsHint", "energy"), kcalPerG: 4, bar: "bg-amber-500", dot: "bg-amber-500" },
    { key: "fats", label: L("fats", "Fats"), hint: L("fatsHint", "hormones & taste"), kcalPerG: 9, bar: "bg-rose-500", dot: "bg-rose-500" },
  ];
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <h3 className="font-heading font-semibold text-xs uppercase tracking-wide text-muted-foreground">{L("macros", "Macros")}</h3>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {items.map((m) => <div key={m.key} className={m.bar} style={{ width: `${macros[m.key]}%` }} />)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((m) => (
          <div key={m.key} className="rounded-xl bg-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              <span className="text-xs font-medium text-foreground">{m.label}</span>
            </div>
            <p className="font-heading text-lg font-bold text-foreground mt-1">{macros[m.key]}%</p>
            <p className="text-[11px] text-muted-foreground">
              ≈ {Math.round((dailyKcal * macros[m.key]) / 100 / m.kcalPerG)} g / {L("day", "day")}
            </p>
            <p className="text-[11px] text-muted-foreground">{m.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}