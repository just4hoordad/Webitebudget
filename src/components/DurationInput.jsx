import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { FREE_GROCERY_DAY_CAP } from "@/lib/freeTier";
import ProLockBadge from "@/components/monetization/ProLockBadge";

export default function DurationInput({ value, onChange, label, onCommit, max = 30 }) {
  const { t } = useLanguage();
  const { isPro, openPricing } = useMonetization();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  // Clamp the value when the allowed maximum shrinks (e.g. free tier capped at 7 days).
  useEffect(() => {
    if (value > max) onChange(max);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <div className="ml-auto flex items-center gap-1.5 bg-[#7DD3FC] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] font-heading font-black text-xl px-3 py-1 rounded-xl">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={draft}
            onFocus={e => e.target.select()}
            onChange={e => {
              setDraft(e.target.value);
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) onChange(Math.min(max, val));
            }}
            onBlur={() => { setDraft(String(value)); if (value >= 1) onCommit?.(); }}
            onKeyDown={e => { if (onCommit && e.key === "Enter") e.currentTarget.blur(); }}
            className="w-12 bg-transparent text-[#111827] font-heading font-black text-xl focus:outline-none text-right"
          />
          <span className="text-xs font-extrabold uppercase">{t("days") || "days"}</span>
        </div>
      </div>
      <Slider value={[Math.min(value, max)]} onValueChange={([v]) => onChange(v)} onValueCommit={() => onCommit?.()} min={1} max={max} step={1} className="w-full" />
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>1</span>
        {!isPro && max > FREE_GROCERY_DAY_CAP && (
          <span className="text-[10px] font-heading font-bold text-muted-foreground">
            {FREE_GROCERY_DAY_CAP}d free list
          </span>
        )}
        <span>{max}</span>
      </div>
      {!isPro && max > FREE_GROCERY_DAY_CAP && (
        <button
          type="button"
          onClick={openPricing}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bba-locked-arcade border transition-all text-left ${
            value > FREE_GROCERY_DAY_CAP
              ? "border-[#FFB020] shadow-[2px_2px_0_#FFB020]"
              : "border-[#111827] opacity-85 hover:opacity-100"
          }`}
        >
          <span className="text-[11px] font-heading font-bold text-[#F3F8E6]/85 leading-snug">
            {value > FREE_GROCERY_DAY_CAP
              ? `${value}d meal plan · Grocery list capped at ${FREE_GROCERY_DAY_CAP}d`
              : `8–${max}d full grocery lists unlock on Premium`}
          </span>
          <ProLockBadge label="PRO" size="xs" />
        </button>
      )}
    </div>
  );
}