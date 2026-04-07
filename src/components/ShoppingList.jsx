import { useState } from "react";
import { ShoppingCart, ChevronDown, ChevronUp, Lightbulb, Euro } from "lucide-react";

const STORE_COLORS = {
  aldi: "bg-blue-50 border-blue-200",
  lidl: "bg-yellow-50 border-yellow-200",
  rewe: "bg-red-50 border-red-200",
  edeka: "bg-amber-50 border-amber-200",
  penny: "bg-orange-50 border-orange-200",
  netto: "bg-gray-50 border-gray-200",
};

const CATEGORY_ICONS = {
  produce: "🥦",
  dairy: "🧀",
  meat: "🥩",
  bread: "🍞",
  grains: "🌾",
  pantry: "🫙",
  frozen: "❄️",
  drinks: "🥤",
  snacks: "🍪",
  default: "🛒",
};

function StoreCard({ store }) {
  const [open, setOpen] = useState(true);
  const storeKey = store.store?.toLowerCase();
  const colorClass = STORE_COLORS[storeKey] || "bg-secondary border-border";

  const grouped = (store.items || []).reduce((acc, item) => {
    const cat = item.category?.toLowerCase() || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className={`rounded-2xl border overflow-hidden ${colorClass}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-4 w-4" />
          <span className="font-heading font-bold text-base">{store.store}</span>
          <span className="text-xs text-muted-foreground">{store.items?.length} items</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-lg flex items-center gap-1">
            <Euro className="h-4 w-4" />{store.totalCost?.toFixed(2)}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {CATEGORY_ICONS[category] || CATEGORY_ICONS.default} {category}
              </div>
              <div className="space-y-1.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/70 rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{item.quantity}</span>
                    </div>
                    <span className="text-sm font-semibold shrink-0">€{item.price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShoppingList({ shoppingList, tips }) {
  const total = shoppingList.reduce((sum, s) => sum + (s.totalCost || 0), 0);

  return (
    <div className="space-y-5">
      {/* Total */}
      <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-2xl px-5 py-4">
        <span className="font-heading font-semibold">Total Shopping Cost</span>
        <span className="font-heading font-bold text-2xl">€{total.toFixed(2)}</span>
      </div>

      {/* Store cards */}
      <div className="space-y-4">
        {shoppingList.map((store, i) => (
          <StoreCard key={i} store={store} />
        ))}
      </div>

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="bg-accent/20 border border-accent/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-heading font-semibold text-sm">
            <Lightbulb className="h-4 w-4 text-accent-foreground" />
            Money-Saving Tips for Students
          </div>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                <span className="text-accent-foreground font-bold shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}