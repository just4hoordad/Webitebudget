import { Lock } from "lucide-react";

/**
 * Arcade-style "locked on Free tier" badge (gold coin pill on dark cabinet).
 * Pass `onClick` to make it an interactive button that opens the Pro modal.
 */
export default function ProLockBadge({
  label = "PRO",
  size = "xs",
  onClick,
  className = "",
}) {
  const sizeCls =
    size === "sm"
      ? "px-2.5 py-0.5 text-[10px] gap-1"
      : "px-1.5 py-0.5 text-[9px] gap-0.5";

  const baseCls = `inline-flex items-center font-heading font-black uppercase tracking-wider rounded-full bg-[#FFB020] text-[#111827] border-[1.5px] border-[#111827] shadow-[1.5px_1.5px_0_#111827] leading-none shrink-0 select-none ${sizeCls} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`${baseCls} hover:bg-[#ffd166] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer`}
      >
        <Lock className={size === "sm" ? "h-3 w-3 stroke-[2.6]" : "h-2.5 w-2.5 stroke-[2.8]"} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span className={baseCls}>
      <Lock className={size === "sm" ? "h-3 w-3 stroke-[2.6]" : "h-2.5 w-2.5 stroke-[2.8]"} />
      <span>{label}</span>
    </span>
  );
}