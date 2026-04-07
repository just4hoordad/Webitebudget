import { useState, useEffect } from "react";
import { CheckSquare, Square, ShoppingCart, ExternalLink, RotateCcw, Euro, CalendarDays, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ONLINE_STORES = [
  { name: "REWE", url: "https://shop.rewe.de", color: "bg-red-100 text-red-700 hover:bg-red-200" },
  { name: "Edeka", url: "https://www.edeka24.de", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  { name: "Aldi", url: "https://www.aldi-sued.de/de/produkte.html", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { name: "Lidl", url: "https://www.lidl.de/de/specials/lieferservice", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
];

export default function GroceryList({ items = [] }) {
  const [checked, setChecked] = useState({});
  const [pinnedItems, setPinnedItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bb_pinned_groceries") || "[]");
    setPinnedItems(stored);
  }, []);

  const clearPinned = () => {
    localStorage.removeItem("bb_pinned_groceries");
    setPinnedItems([]);
  };

  const toggleItem = (index) => setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  const resetAll = () => setChecked({});

  const allItems = [...items, ...pinnedItems];
  const checkedCount = Object.values(checked).filter(Boolean).length;

  // Group items by store
  const grouped = allItems.reduce((acc, item, i) => {
    const store = item.store || "Other";
    if (!acc[store]) acc[store] = [];
    acc[store].push({ ...item, index: i });
    return acc;
  }, {});
  const total = allItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const savedAmount = allItems
    .filter((_, i) => checked[i])
    .reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold">Grocery List</h3>
            <p className="text-sm text-muted-foreground">{checkedCount} of {allItems.length} items checked</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={resetAll}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${allItems.length ? (checkedCount / allItems.length) * 100 : 0}%` }}
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

      {/* Pinned from recipes */}
      {pinnedItems.length > 0 && (
        <div className="bg-secondary/30 border border-border rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{pinnedItems.length} ingredients</span> added from recipes
          </p>
          <button onClick={clearPinned} className="text-xs text-destructive hover:underline">Clear</button>
        </div>
      )}

      {/* Generate Meal Plan from selected items */}
      {checkedCount > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
          <div>
            <h3 className="font-heading font-semibold text-sm">🍽️ Generate a Meal Plan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Based on your {checkedCount} selected ingredient{checkedCount > 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const selected = allItems.filter((_, i) => checked[i]).map(item => item.name).join(",");
                navigate(`/meal-plan?planType=weekly&ingredients=${encodeURIComponent(selected)}`);
              }}
              className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 border-primary/30 bg-card hover:bg-primary/5 transition-colors text-left"
            >
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="font-heading font-semibold text-sm">Weekly Plan</span>
              <span className="text-xs text-muted-foreground text-center">Repeat meals 4× — budget-friendly</span>
            </button>
            <button
              onClick={() => {
                const selected = allItems.filter((_, i) => checked[i]).map(item => item.name).join(",");
                navigate(`/meal-plan?planType=monthly&ingredients=${encodeURIComponent(selected)}`);
              }}
              className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 border-border bg-card hover:bg-secondary/50 transition-colors text-left"
            >
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-heading font-semibold text-sm">Monthly Plan</span>
              <span className="text-xs text-muted-foreground text-center">Full variety over 4 weeks</span>
            </button>
          </div>
        </div>
      )}

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