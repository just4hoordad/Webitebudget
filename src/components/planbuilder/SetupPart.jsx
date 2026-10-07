import { Switch } from "@/components/ui/switch";

export default function SetupPart({ part, icon: Icon, label, active, onToggle, children }) {
  return (
    <section id={`pb-${part}`} className="scroll-mt-24 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          {label}
        </h3>
        {onToggle && <Switch checked={active} onCheckedChange={onToggle} aria-label={label} />}
      </div>
      {children}
    </section>
  );
}