export default function StepProgress({ steps }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="text-[11px] font-heading font-semibold text-foreground whitespace-nowrap">
              {s.label}
            </span>
          </span>
          {i < steps.length - 1 && <span className="h-px w-3 bg-border shrink-0" />}
        </div>
      ))}
    </div>
  );
}