import { Loader2, ArrowLeftRight, X, CheckCircle2, Circle } from "lucide-react";

export default function GroceryItemRow({ item, categoryName, stores, onSwap, onRemove, bought = false, onToggleBought }) {
  const kcalMatch = item.calories_info?.match(/(\d[\d.]*)\s*kcal/i);
  const kcalShort = kcalMatch ? `${kcalMatch[1]} kcal` : null;

  const hasMultiplier = item.unit_price != null && item.unit_price !== item.price && item.unit_price > 0;
  const qty = hasMultiplier ? Math.round(item.price / item.unit_price) : null;
  const displayPrice = hasMultiplier ? item.unit_price : item.price;
  const savings = item.normal_price != null && item.normal_price > item.price ? item.normal_price - item.price : 0;

  const subParts = [item.store, item.quantity, kcalShort].filter(Boolean);

  const nameCls = bought ? "text-muted-foreground line-through opacity-60" : "text-foreground";

  return (
    <div className="flex items-center px-5 py-3.5 gap-3 hover:bg-muted/30 transition-colors">
      <button
        onClick={onToggleBought}
        className="shrink-0"
        title="Mark as bought"
        aria-label="Mark as bought"
      >
        {bought
          ? <CheckCircle2 className="h-5 w-5 text-primary" />
          : <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition-colors" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-[15px] leading-tight truncate ${nameCls}`}>
          {item.name}
          {item._loading && <Loader2 className="h-3 w-3 animate-spin text-primary inline ml-2 align-middle" />}
        </p>
        {item._loading ? (
          <p className="text-xs text-primary animate-pulse mt-1">Searching {stores} for best price…</p>
        ) : (
          <p className={`text-xs mt-1 truncate ${bought ? "text-muted-foreground/50 line-through" : "text-muted-foreground"}`}>
            {subParts.map((p, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5 opacity-40">·</span>}
                {p}
              </span>
            ))}
          </p>
        )}
      </div>

      {!item._loading && (
        <div className="text-right shrink-0 ml-2">
          <p className={`font-heading text-2xl font-bold leading-none ${bought ? "text-muted-foreground/50 line-through" : "text-primary"}`}>
            €{displayPrice?.toFixed(2)}
          </p>
          {savings > 0 && (
            <span className="mt-1.5 inline-flex items-center border border-primary/50 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full">
              saves €{savings.toFixed(2)}
            </span>
          )}
          {hasMultiplier && (
            <p className={`mt-1 text-xs font-heading ${bought ? "text-muted-foreground/40 line-through" : "text-muted-foreground"}`}>
              ×{qty} = €{item.price?.toFixed(2)}
            </p>
          )}
          <div className="mt-1.5 flex items-center justify-end gap-0.5">
            <button
              onClick={() => onSwap(item, categoryName)}
              className="text-muted-foreground/60 hover:text-primary transition-colors p-1"
              title="Find alternative"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onRemove(categoryName, item.name)}
              className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
              title="Remove item"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}