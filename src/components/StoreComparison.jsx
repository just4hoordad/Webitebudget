import { Euro, TrendingDown } from "lucide-react";

const STORE_STYLES = {
  aldi: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  lidl: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  rewe: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  edeka: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  penny: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  netto: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700" },
};

export default function StoreComparison({ storeBreakdown }) {
  if (!storeBreakdown || storeBreakdown.length === 0) return null;

  const sorted = [...storeBreakdown].sort((a, b) => a.total - b.total);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-5 w-5 text-primary" />
        <h3 className="font-heading font-semibold">Store Cost Breakdown</h3>
      </div>
      <div className="space-y-3">
        {sorted.map((store, i) => {
          const style = STORE_STYLES[store.id?.toLowerCase()] || STORE_STYLES.netto;
          const maxTotal = sorted[sorted.length - 1]?.total || 1;
          const pct = (store.total / maxTotal) * 100;

          return (
            <div key={store.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${style.text}`}>
                    {store.name}
                  </span>
                  {i === 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Best Price
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Euro className="h-3.5 w-3.5" />
                  {store.total?.toFixed(2)}/week
                </div>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${style.bg} ${style.border} border`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}