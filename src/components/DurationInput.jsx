import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/lib/LanguageContext";

export default function DurationInput({ value, onChange, label, onCommit, max = 30 }) {
  const { t } = useLanguage();
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
        <div className="ml-auto flex items-center gap-1 bg-primary/10 text-primary font-heading font-bold text-xl px-3 py-1 rounded-xl focus-within:ring-2 focus-within:ring-primary/40">
          <CalendarDays className="h-5 w-5 shrink-0" />
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
            className="w-12 bg-transparent text-primary font-heading font-bold text-xl focus:outline-none text-right"
          />
          <span className="text-sm">{t("days") || "days"}</span>
        </div>
      </div>
      <Slider value={[Math.min(value, max)]} onValueChange={([v]) => onChange(v)} onValueCommit={() => onCommit?.()} min={1} max={max} step={1} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span>
        <span>{max}</span>
      </div>
    </div>
  );
}