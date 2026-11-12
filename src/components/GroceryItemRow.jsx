import { Loader2, ArrowLeftRight, X, Check } from "lucide-react";
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

  return (
    <div
      className={`flex items-start px-4 sm:px-5 py-3.5 gap-3 transition-colors ${
        bought ? "bg-[#F3F8E6]/60 dark:bg-secondary/40" : "hover:bg-[#F3F8E6]/50 dark:hover:bg-secondary/30"
      }`}
    >
      {!readOnly && (
        <button
          type="button"
          onClick={onToggleBought}
          className={`h-6 w-6 rounded-lg border-2 border-[#111827] dark:border-[#78a71b] flex items-center justify-center shrink-0 mt-0.5 transition-all ${
            bought
              ? "bg-[#78a71b] text-[#111827] shadow-none translate-x-[1px] translate-y-[1px]"
              : "bg-white dark:bg-card shadow-[2px_2px_0_#111827] dark:shadow-[2px_2px_0_#000] hover:bg-[#F3F8E6]"
          }`}
          title={t(bought ? "markUnbought" : "markBought")}
          aria-label={t(bought ? "markUnbought" : "markBought")}
        >
          {bought && <Check className="h-4 w-4 stroke-[3]" />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <p className={`font-heading font-extrabold text-[15px] leading-snug break-words ${nameCls}`}>
          {item.name}
          {item._loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary inline ml-2 align-middle" />}
        </p>
        {item._loading ? (
          <p className="text-xs font-bold text-primary animate-pulse mt-1">{t("searchingPrices", { stores })}</p>
        ) : (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {item.store && <StoreBadge store={item.store} />}
            {item.quantity && (
              <span className="text-[11px] font-heading font-bold px-2 py-0.5 rounded-lg bg-[#F3F8E6] dark:bg-secondary text-[#111827] dark:text-foreground border border-[#111827]/30 dark:border-[#78a71b]/40">
                {item.quantity}
              </span>
            )}
            {kcalShort && (
              <span className={`text-[11px] font-bold text-muted-foreground ${bought ? "line-through opacity-60" : ""}`}>
                {kcalShort}
              </span>
            )}
            {item.price_verified ? (
              <span className="text-[10px] font-heading font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#78a71b] text-[#111827] border-[1.5px] border-[#111827]">
                ✓ {t("verifiedTag") === "verifiedTag" ? "Verified" : t("verifiedTag")}
              </span>
            ) : (
              <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-[#111827]/20 dark:border-white/15">
                {t("estimatedTag") || "Estimated"}
              </span>
            )}
          </div>
        )}
      </div>

      {!item._loading && (
        <div className="text-right shrink-0 ml-2 flex flex-col items-end gap-1.5">
          <span
            className={`inline-block font-heading text-lg sm:text-xl font-black tabular-nums leading-none px-2.5 py-1 rounded-xl border-2 border-[#111827] ${
              bought
                ? "bg-muted text-muted-foreground line-through opacity-60 shadow-none"
                : "bg-[#F3F8E6] text-[#111827] shadow-[2px_2px_0_#111827]"
            }`}
          >
            €{displayPrice?.toFixed(2)}
          </span>
          {hasMultiplier && (
            <div className="flex items-center gap-1.5 justify-end">
              <span className="bg-[#FFB020] text-[#111827] border-[1.5px] border-[#111827] text-[11px] font-heading font-black px-2 py-0.5 rounded-full leading-none shadow-[1.5px_1.5px_0_#111827]">
                ×{qty}
              </span>
              <span className={`font-heading text-xs sm:text-sm font-black tabular-nums ${bought ? "text-muted-foreground/50 line-through" : "text-foreground"}`}>
                = €{item.price?.toFixed(2)}
              </span>
            </div>
          )}
          {savings > 0 && (
            <span className="inline-flex items-center bg-[#78a71b]/25 dark:bg-[#78a71b]/30 border-[1.5px] border-[#111827] dark:border-[#78a71b] text-[#111827] dark:text-foreground text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-full">
              {t("savingsAmount", { amount: savings.toFixed(2) })}
            </span>
          )}
          {!readOnly && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => onSwap(item, categoryName)}
                className="h-7 w-7 rounded-lg bg-white dark:bg-secondary text-[#111827] dark:text-foreground border-[1.5px] border-[#111827] dark:border-[#78a71b] shadow-[1.5px_1.5px_0_#111827] hover:bg-[#FFB020] hover:text-[#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center"
                title={t("findAlternative")}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(categoryName, item.name)}
                className="h-7 w-7 rounded-lg bg-white dark:bg-secondary text-[#111827] dark:text-foreground border-[1.5px] border-[#111827] dark:border-[#78a71b] shadow-[1.5px_1.5px_0_#111827] hover:bg-[#FF3E7F] hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center"
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