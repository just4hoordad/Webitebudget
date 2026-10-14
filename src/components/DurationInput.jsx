import { useState, useEffect } from "react";
import { CalendarDays, Crown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/lib/LanguageContext";

export default function DurationInput({ value, onChange, label, onCommit, maxDays = 30, isPro = true, onUpgrade }) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const atCap = value >= maxDays && !isPro;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <div className="ml-auto flex items-center gap-1 bg-primary/10 text-primary font-heading font-bold text-xl px-3 py-1 rounded-xl focus-within:ring-2 focus-within:ring-primary/40">
          <CalendarDays className="h-5 w-5 shrink-0" />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxDays}
            value={draft}
            onFocus={e => e.target.select()}
            onChange={e => {
              setDraft(e.target.value);
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1) onChange(Math.min(maxDays, val));
            }}
            onBlur={() => { setDraft(String(value)); if (value >= 1) onCommit?.(); }}
            onKeyDown={e => { if (onCommit && e.key === "Enter") e.currentTarget.blur(); }}
            className="w-12 bg-transparent text-primary font-heading font-bold text-xl focus:outline-none text-right"
          />
          <span className="text-sm">{t("days") || "days"}</span>
        </div>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} onValueCommit={() => onCommit?.()} min={1} max={maxDays} step={1} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>{maxDays}</span>
      </div>
      {atCap && (
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-xs">
          <Crown className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">{t("durationPremiumHint") || "Free plans are limited to 7 days. Upgrade to Pro for up to 30 days."}</span>
          {onUpgrade && (
            <button onClick={onUpgrade} className="text-primary font-medium underline ml-auto shrink-0">
              {t("upgrade") || "Upgrade"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}