import { Crown, Sparkles } from "lucide-react";

export default function UpgradeBanner({ onClick, variant = "sidebar" }) {
  if (variant === "sheet") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bba-locked-arcade border-[2.5px] border-[#111827] dark:border-[#FFB020] shadow-[3px_3px_0_#FFB020] active:translate-x-[1px] active:translate-y-[1px] transition-all text-left"
      >
        <span className="flex items-center gap-2 text-xs font-heading font-black text-[#F3F8E6]">
          <Crown className="h-4 w-4 text-[#FFB020] shrink-0" />
          Unlock Pro Arcade · 15/mo
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-[#FFB020] text-[#111827] text-[11px] font-heading font-black border border-[#111827] shrink-0">
          €3.99/mo
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bba-locked-arcade border-2 border-[#111827] dark:border-[#FFB020] shadow-[3px_3px_0_#FFB020] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#FFB020] transition-all text-left"
    >
      <span className="flex items-center gap-1.5 text-xs font-heading font-black text-[#F3F8E6] truncate">
        <Sparkles className="h-3.5 w-3.5 text-[#FFB020] shrink-0" />
        <span className="truncate">Unlock Pro</span>
      </span>
      <span className="px-2 py-0.5 rounded-full bg-[#FFB020] text-[#111827] text-[10px] font-heading font-black border border-[#111827] shrink-0">
        €3.99/mo
      </span>
    </button>
  );
}