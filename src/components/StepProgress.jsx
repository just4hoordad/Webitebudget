import { Check, AlertCircle } from "lucide-react";

// steps: [{ key, label, done, required }]
export default function StepProgress({ steps, onStepClick, activeStep }) {
  const currentIdx = steps.findIndex((s) => !s.done);
  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-card border-[2.5px] border-[#111827] dark:border-[#78a71b] shadow-[3px_3px_0_#111827]">
      {steps.map((s, i) => {
        const isCurrent = activeStep === undefined ? i === currentIdx : s.key === activeStep;
        const missing = s.required && !s.done && (currentIdx === -1 || i < currentIdx || steps.slice(i + 1).some((x) => x.done));
        const cls = missing
          ? "bg-[#FF3E7F] text-white border-[#111827] shadow-[2px_2px_0_#111827]"
          : s.done
          ? "bg-[#78a71b] text-[#111827] border-[#111827] shadow-[2px_2px_0_#111827]"
          : isCurrent
          ? "bg-[#FFB020] text-[#111827] border-[#111827] shadow-[2px_2px_0_#111827]"
          : "bg-secondary text-muted-foreground border-[#111827]/40";
        return (
          <div key={s.key} className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => onStepClick?.(s.key)}
              title={s.label}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 min-w-0 transition-transform hover:-translate-y-0.5 ${cls}`}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[#111827] border border-[#111827] text-[10px] font-heading font-black">
                {missing ? <AlertCircle className="h-3 w-3 text-[#FF3E7F]" /> : s.done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="text-[11px] font-heading font-extrabold truncate">{s.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}