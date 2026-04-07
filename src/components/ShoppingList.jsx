import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Euro } from "lucide-react";

const STORE_COLORS = {
  aldi: "bg-blue-100 text-blue-700",
  lidl: "bg-yellow-100 text-yellow-700",
  rewe: "bg-red-100 text-red-700",
  edeka: "bg-amber-100 text-amber-700",
  penny: "bg-orange-100 text-orange-700",
  netto: "bg-gray-100 text-gray-700",
};

export default function ShoppingList({ items }) {
  const [checkedItems, setCheckedItems] = useState(new Set());

  const toggleItem = (index) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const totalCost = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const checkedCost = items
    .filter((_, i) => checkedItems.has(i))
    .reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-semibold">Weekly Shopping List</h3>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Euro className="h-4 w-4 text-primary" />
            <span className="text-primary">{checkedCost.toFixed(2)}</span>
            <span className="text-muted-foreground">/ {totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-5 py-3 transition-colors ${
              checkedItems.has(index) ? "bg-muted/50" : ""
            }`}
          >
            <Checkbox
              checked={checkedItems.has(index)}
              onCheckedChange={() => toggleItem(index)}
            />
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${
                  checkedItems.has(index)
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {item.name}
              </span>
              {item.quantity && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({item.quantity})
                </span>
              )}
            </div>
            {item.store && (
              <Badge
                variant="outline"
                className={`text-xs ${STORE_COLORS[item.store?.toLowerCase()] || ""}`}
              >
                {item.store}
              </Badge>
            )}
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              €{item.price?.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}