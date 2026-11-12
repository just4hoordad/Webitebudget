import { Crown, PlayCircle } from "lucide-react";
import { useMonetization } from "@/lib/MonetizationContext";

export default function CreditPill({ credits, isPro }) {
  const { openPricing, openWatchAd, tier } = useMonetization();
  const empty = credits <= 0;

  const accent = isPro
    ? "text-primary"
    : empty
    ? "text-destructive"
    : "text-green-600";

  const label = isPro ? (tier === "pro_plus" ? "PRO+ LEFT" : "PRO LEFT") : "FREE GENERATIONS";

  return (
    <div className="inline-flex flex-col w-[126px] rounded-2xl border-[2.5px] border-[#111827] bg-white text-[#111827] shadow-[3px_3px_0_#111827] overflow-hidden shrink-0 select-none">
      <div className="flex flex-col items-center justify-center py-2.5 px-2">
        <div className="flex items-center gap-1">
          {isPro && <Crown className="h-4 w-4 text-[#FFB020]" />}
          <span className={`font-heading text-2xl font-black leading-none ${empty ? "text-[#FF3E7F]" : "text-[#111827]"}`}>
            {credits}
          </span>
        </div>
        <span className="text-[9px] font-heading font-black uppercase tracking-wider text-[#111827]/70 mt-1">
          {label}
        </span>
      </div>
      {isPro ? (
        <div className="border-t-2 border-[#111827] bg-[#FFB020] py-1 text-center text-[10px] font-heading font-black text-[#111827]">
          Ad-free 👑
        </div>
      ) : (
        <div className="grid grid-cols-2 border-t-2 border-[#111827]">
          <button
            type="button"
            onClick={openWatchAd}
            className="flex items-center justify-center gap-1 py-1.5 bg-[#FFB020] text-[10px] font-heading font-black text-[#111827] hover:brightness-95 transition-all"
            title="Watch a short ad to earn 1 free generation"
          >
            <PlayCircle className="h-3 w-3" /> +1
          </button>
          <button
            type="button"
            onClick={openPricing}
            className="flex items-center justify-center py-1.5 bg-[#F3F8E6] text-[10px] font-heading font-black text-[#111827] hover:bg-[#78a71b] transition-colors border-l-2 border-[#111827]"
          >
            Pro →
          </button>
        </div>
      )}
    </div>
  );
}