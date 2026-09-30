import { Check, AlertCircle } from "lucide-react";

// steps: [{ key, label, done, required }]
export default function StepProgress({ steps, onStepClick }) {
  const currentIdx = steps.findIndex((s) => !s.done);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => {
        const isCurrent = i === currentIdx;
        const missing = s.required && !s.done && (currentIdx === -1 || i < currentIdx || steps.slice(i + 1).some((x) => x.done));
        const showLabel = isCurrent || missing;
        const cls = missing
          ? "border-destructive bg-destructive/10 text-destructive"
          : s.done
          ? "border-primary/40 bg-primary/10 text-primary"
          : isCurrent
          ? "border-primary bg-card text-foreground"
          : "border-border bg-card text-muted-foreground opacity-60";
        return (
          <div key={s.key} className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => onStepClick?.(s.key)}
              title={s.label}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 min-w-0 transition-colors ${cls}`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${missing ? "bg-destructive text-destructive-foreground" : s.done || isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {missing ? <AlertCircle className="h-3 w-3" /> : s.done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {showLabel && <span className="text-[11px] font-heading font-semibold truncate">{s.label}</span>}
            </button>
            {i < steps.length - 1 && <span className="h-px w-3 bg-border shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}