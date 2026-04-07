import { useState } from "react";
import { CheckSquare, Square, ShoppingCart, ExternalLink, RotateCcw, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONLINE_STORES = [
  { name: "REWE", url: "https://shop.rewe.de", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  { name: "Edeka", url: "https://www.edeka24.de", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  { name: "Aldi", url: "https://www.aldi-sued.de/de/produkte.html", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { name: "Lidl", url: "https://www.lidl.de/de/specials/lieferservice", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
];

export default function GroceryList({ items = [] }) {
  const [checked, setChecked] = useState({});

  const toggleItem = (index) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const resetAll = () => setChecked({});

  // Group items by store
  const grouped = items.reduce((acc, item, i) => {
    const store = item.store || "Other";
    if (!acc[store]) acc[store] = [];
    acc[store].push({ ...item, index: i });
    return acc;
  }, {});

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const total = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const savedAmount = items
    .filter((_, i) => checked[i])
    .reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold">Grocery List</h3>
            <p className="text-sm text-muted-foreground">{checkedCount} of {items.length} items checked</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={resetAll}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Estimated total: <span className="font-semibold text-foreground">€{total.toFixed(2)}</span>
          </span>
          {savedAmount > 0 && (
            <span className="text-primary font-medium">
              ✅ €{savedAmount.toFixed(2)} in cart
            </span>
          )}
        </div>
      </div>

      {/* Items by store */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([store, storeItems]) => (
          <div key={store} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-secondary/40 border-b border-border">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="font-heading font-semibold text-sm">{store}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {storeItems.filter(item => checked[item.index]).length}/{storeItems.length} done
              </span>
            </div>
            <div className="divide-y divide-border">
              {storeItems.map((item) => (
                <button
                  key={item.index}
                  onClick={() => toggleItem(item.index)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/30 ${
                    checked[item.index] ? "opacity-50" : ""
                  }`}
                >
                  {checked[item.index]
                    ? <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                    : <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${checked[item.index] ? "line-through text-muted-foreground" : ""}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold shrink-0">
                    <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.price?.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Online store links */}
      <div className="bg-secondary/40 border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-heading font-semibold text-sm">🛒 Shop Online</h3>
        <p className="text-xs text-muted-foreground">Order your groceries online from these stores:</p>
        <div className="flex flex-wrap gap-2">
          {ONLINE_STORES.map((store) => (
            <a
              key={store.name}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${store.color}`}
            >
              {store.name}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}