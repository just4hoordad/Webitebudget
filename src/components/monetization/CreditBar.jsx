import { Leaf, Crown } from "lucide-react";
import { useMonetization } from "@/lib/MonetizationContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function CreditBar({ variant = "onLight", className = "" }) {
  const { credits, isPro, openWatchAd, openPricing } = useMonetization();
  const { t } = useLanguage();
  const onGlass = variant === "onGlass";

  const numColor = onGlass
    ? "text-white"
    : credits <= 0 && !isPro
    ? "text-destructive"
    : isPro
    ? "text-primary"
    : "text-foreground";
  const labelColor = onGlass ? "text-white/70" : "text-muted-foreground";
  const wrapClass = onGlass
    ? "flex items-center justify-between gap-2 flex-wrap"
    : "flex items-center justify-between gap-2 flex-wrap bg-card border border-border rounded-xl px-4 py-3";

  const btnBase = "h-7 inline-flex items-center px-2.5 rounded-full text-[11px] font-medium leading-none transition-colors";
  const adBtn = onGlass
    ? `${btnBase} border border-white/40 text-white hover:bg-white/15`
    : `${btnBase} border border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10`;
  const proBtn = onGlass
    ? `${btnBase} border border-white/40 text-white hover:bg-white/15`
    : `${btnBase} border border-border text-muted-foreground hover:text-primary hover:border-primary/40`;
  const proLabel = onGlass ? "text-white/80" : "text-muted-foreground";

  return (
    <div className={`${wrapClass} ${className}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        {isPro ? (
          <Crown className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Leaf className="h-4 w-4 text-primary shrink-0" />
        )}
        <span className={`font-heading ${onGlass ? "text-xl" : "text-2xl"} font-bold leading-none ${numColor}`}>
          {credits}
        </span>
        <span className={`text-[10px] font-heading font-bold uppercase tracking-wide ${labelColor} truncate`}>
          {isPro ? t("proLeft") : t("freeGen")}
        </span>
      </div>
      {isPro ? (
        <span className={`text-[11px] font-medium ${proLabel}`}>{t("adFree")}</span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={openWatchAd} className={adBtn}>
            +1
          </button>
          <button type="button" onClick={openPricing} className={proBtn}>
            Pro →
          </button>
        </div>
      )}
    </div>
  );
}