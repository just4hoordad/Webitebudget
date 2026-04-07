import { Euro, TrendingDown, Calendar, Utensils } from "lucide-react";

export default function BudgetBreakdown({ summary, budget }) {
  const savings = budget - (summary.totalCost || 0);
  const pct = Math.round(((budget - summary.totalCost) / budget) * 100);

  const cards = [
    { icon: Euro, label: "Total Monthly Cost", value: `€${summary.totalCost?.toFixed(2)}`, sub: `Budget: €${budget}`, highlight: true },
    { icon: Calendar, label: "Cost Per Day", value: `€${summary.costPerDay?.toFixed(2)}`, sub: "all meals included" },
    { icon: Utensils, label: "Cost Per Meal", value: `€${summary.costPerMeal?.toFixed(2)}`, sub: "average per meal" },
    { icon: TrendingDown, label: "Savings", value: savings > 0 ? `€${savings.toFixed(2)}` : "On budget", sub: savings > 0 ? `${pct}% under budget` : "fully utilized" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-2xl p-4 border space-y-1 ${c.highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
            >
              <Icon className={`h-4 w-4 ${c.highlight ? "text-primary-foreground/70" : "text-primary"}`} />
              <div className={`font-heading font-bold text-xl ${c.highlight ? "text-primary-foreground" : "text-foreground"}`}>{c.value}</div>
              <div className={`text-xs ${c.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{c.label}</div>
              <div className={`text-xs ${c.highlight ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>{c.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Store breakdown */}
      {summary.stores && summary.stores.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-medium mb-3">Store Distribution</p>
          <div className="flex flex-wrap gap-3">
            {summary.stores.map((s) => (
              <div key={s.name} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.percentage}%</span>
                {s.savings && <span className="text-xs text-primary font-medium">💰 {s.savings}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}