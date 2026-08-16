import { Crown } from "lucide-react";
import { useMonetization } from "@/lib/MonetizationContext";

export default function CreditPill({ credits, isPro }) {
  const { openPricing } = useMonetization();
  const empty = credits <= 0;

  const accent = isPro
    ? "text-primary"
    : empty
    ? "text-destructive"
    : "text-green-600";

  const label = isPro ? "PRO LEFT" : "FREE GENERATIONS";

  return (
    <div className="inline-flex flex-col w-[120px] rounded-xl border border-border bg-card overflow-hidden shrink-0 select-none">
      <div className="flex flex-col items-center justify-center py-3">
        <div className="flex items-center gap-1">
          {isPro && <Crown className="h-4 w-4 text-primary" />}
          <span className={`font-heading text-2xl font-bold leading-none ${accent}`}>
            {credits}
          </span>
        </div>
        <span className="text-[9px] font-heading font-bold uppercase tracking-wide text-muted-foreground mt-1.5">
          {label}
        </span>
      </div>
      {!isPro && (
        <>
          <div className="border-t border-border" />
          <button
            type="button"
            onClick={openPricing}
            className="flex items-center justify-center py-1.5 bg-muted/40 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Go Pro →
          </button>
        </>
      )}
    </div>
  );
}