import { Loader2, ArrowLeftRight, X, CheckCircle2, Circle } from "lucide-react";
import StoreBadge from "@/components/StoreBadge";
import { useLanguage } from "@/lib/LanguageContext";

export default function GroceryItemRow({ item, categoryName, stores, onSwap, onRemove, bought = false, onToggleBought, readOnly = false }) {
  const { t } = useLanguage();
  const kcalMatch = item.calories_info?.match(/(\d[\d.]*)\s*kcal/i);
  const kcalShort = kcalMatch ? `${kcalMatch[1]} kcal` : null;

  const hasMultiplier = item.unit_price != null && item.unit_price !== item.price && item.unit_price > 0;
  const qty = hasMultiplier ? Math.round(item.price / item.unit_price) : null;
  const displayPrice = hasMultiplier ? item.unit_price : item.price;
  const savings = item.normal_price != null && item.normal_price > item.price ? item.normal_price - item.price : 0;

  const nameCls = bought ? "text-muted-foreground line-through opacity-60" : "text-foreground";
  const subCls = bought ? "text-muted-foreground/50" : "text-muted-foreground";

  return (
    <div className="flex items-start px-5 py-3.5 gap-3 hover:bg-muted/30 transition-colors">
      {!readOnly && (
        <button
          onClick={onToggleBought}
          className="shrink-0 mt-0.5"
          title={t(bought ? "markUnbought" : "markBought")}
          aria-label={t(bought ? "markUnbought" : "markBought")}
        >
          {bought
            ? <CheckCircle2 className="h-5 w-5 text-primary" />
            : <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-primary transition-colors" />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-[15px] leading-snug break-words ${nameCls}`}>
          {item.name}
          {item._loading && <Loader2 className="h-3 w-3 animate-spin text-primary inline ml-2 align-middle" />}
        </p>
        {item._loading ? (
          <p className="text-xs text-primary animate-pulse mt-1">{t("searchingPrices", { stores })}</p>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {item.store && <StoreBadge store={item.store} />}
            {item.quantity && <span className={`text-xs ${subCls}`}>· {item.quantity}</span>}
            {kcalShort && <span className={`text-xs ${subCls} ${bought ? "line-through" : ""}`}>· {kcalShort}</span>}
            {item.price_verified
              ? <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">✓ {t("verifiedTag") === "verifiedTag" ? "Verified" : t("verifiedTag")}</span>
              : <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t("estimatedTag") || "Estimated"}</span>}
          </div>
        )}
      </div>

      {!item._loading && (
        <div className="text-right shrink-0 ml-2 flex flex-col items-end gap-1.5">
          <p className={`font-heading text-2xl font-bold leading-none ${bought ? "text-muted-foreground/50 line-through" : "text-primary"}`}>
            €{displayPrice?.toFixed(2)}
          </p>
          {hasMultiplier && (
            <div className="flex items-center gap-1.5 justify-end">
              <span className="bg-primary text-primary-foreground text-xs font-heading font-bold px-2 py-0.5 rounded-full leading-none">
                ×{qty}
              </span>
              <span className={`font-heading text-sm font-bold ${bought ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>
                €{item.price?.toFixed(2)}
              </span>
            </div>
          )}
          {savings > 0 && (
            <span className="inline-flex items-center border border-primary/50 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full">
              {t("savingsAmount", { amount: savings.toFixed(2) })}
            </span>
          )}
          {!readOnly && (
            <div className="flex items-center gap-0.5 mt-0.5">
              <button
                onClick={() => onSwap(item, categoryName)}
                className="text-muted-foreground/60 hover:text-primary transition-colors p-1"
                title={t("findAlternative")}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onRemove(categoryName, item.name)}
                className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
                title={t("removeItem")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}