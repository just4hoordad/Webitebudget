import { Loader2, ArrowLeftRight, X, CheckCircle2, Circle } from "lucide-react";
import StoreBadge from "@/components/StoreBadge";

export default function GroceryItemRow({ item, categoryName, stores, onSwap, onRemove, bought = false, onToggleBought }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onToggleBought}
          className="shrink-0"
          title="Mark as bought"
          aria-label="Mark as bought"
        >
          {bought
            ? <CheckCircle2 className="h-5 w-5 text-primary" />
            : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium flex items-center gap-2 flex-wrap ${bought ? "text-muted-foreground line-through opacity-60" : "text-foreground"}`}>
            {item.name}
            {item.store && !item._loading && <StoreBadge store={item.store} />}
            {item._loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </p>
          {item._loading ? (
            <p className="text-xs text-primary animate-pulse">Searching {stores} for best price…</p>
          ) : (
            <p className={`text-xs ${bought ? "text-muted-foreground/60 line-through" : "text-muted-foreground"}`}>{item.quantity} · {item.calories_info}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        {!item._loading && (
          <div className="text-right">
            {item.unit_price != null && item.unit_price !== item.price ? (
              <>
                <p className={`font-heading text-xl font-bold leading-none ${bought ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>€{item.unit_price?.toFixed(2)}</p>
                <div className="mt-1.5 flex items-center justify-end gap-1.5">
                  <span className="inline-flex items-center bg-primary/15 text-primary text-xs font-heading font-bold px-2 py-0.5 rounded-full">
                    × {Math.round(item.price / item.unit_price)}
                  </span>
                  <span className={`font-heading text-sm font-bold ${bought ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>= €{item.price?.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <p className={`font-heading text-xl font-bold leading-none ${bought ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>€{item.price?.toFixed(2)}</p>
            )}
            {item.normal_price != null && item.normal_price > item.price && (
              <p className="text-xs font-medium text-green-600">
                saves €{(item.normal_price - item.price).toFixed(2)}
              </p>
            )}
          </div>
        )}
        <button
          onClick={() => onSwap(item, categoryName)}
          className="text-muted-foreground hover:text-primary transition-colors"
          title="Find alternative"
          disabled={!!item._loading}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(categoryName, item.name)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Remove item"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}