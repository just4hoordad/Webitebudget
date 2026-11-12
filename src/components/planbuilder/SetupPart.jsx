import { Switch } from "@/components/ui/switch";

const PART_BADGE = {
  diet: "bg-[#78a71b]",
  people: "bg-[#FFB020]",
  days: "bg-[#7DD3FC]",
  stores: "bg-[#FF8FB5]",
  macros: "bg-[#C084FC]",
};

export default function SetupPart({ part, icon: Icon, label, active, onToggle, children }) {
  const badgeBg = PART_BADGE[part] || "bg-[#78a71b]";
  return (
    <section id={`pb-${part}`} className="scroll-mt-24 bba-t bg-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-heading font-black text-base text-foreground">
          <span className={`h-8 w-8 rounded-xl ${badgeBg} border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]`}>
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </h3>
        {onToggle && <Switch checked={active} onCheckedChange={onToggle} aria-label={label} />}
      </div>
      {children}
    </section>
  );
}