import { Leaf, Crown } from "lucide-react";
import { useMonetization } from "@/lib/MonetizationContext";

export default function CreditBar({ variant = "onLight", className = "" }) {
  const { credits, isPro, openWatchAd, openPricing } = useMonetization();
  const onGlass = variant === "onGlass";

  const wrapClass = onGlass
    ? "flex items-center justify-between gap-2 flex-wrap"
    : "flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-card text-[#111827] dark:text-foreground border-[2.5px] border-[#111827] dark:border-[#78a71b] shadow-[3px_3px_0_#111827] dark:shadow-[3px_3px_0_#000] rounded-2xl px-4 py-2.5";

  return (
    <div className={`${wrapClass} ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFB020] border-[1.5px] border-[#111827] text-[#111827] shrink-0">
          {isPro ? <Crown className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
        </span>
        <span
          className={`font-heading ${onGlass ? "text-xl text-white" : "text-2xl"} font-black leading-none ${
            !onGlass && credits <= 0 && !isPro ? "text-[#FF3E7F]" : ""
          }`}
        >
          {credits}
        </span>
        <span
          className={`text-[10px] font-heading font-black uppercase tracking-wider truncate ${
            onGlass ? "text-white/80" : "text-[#111827]/75 dark:text-muted-foreground"
          }`}
        >
          {isPro ? "PRO LEFT" : "FREE GEN"}
        </span>
      </div>
      {isPro ? (
        <span className="text-[11px] font-heading font-black bg-[#FFB020] text-[#111827] border-[1.5px] border-[#111827] px-2.5 py-0.5 rounded-full">
          Ad-free 👑
        </span>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={openWatchAd}
            className="h-7 inline-flex items-center px-2.5 rounded-full text-[11px] font-heading font-black bg-[#FFB020] text-[#111827] border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
          >
            +1 Free
          </button>
          <button
            type="button"
            onClick={openPricing}
            className="h-7 inline-flex items-center px-3 rounded-full text-[11px] font-heading font-black bg-[#78a71b] text-[#111827] border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
          >
            Pro →
          </button>
        </div>
      )}
    </div>
  );
}