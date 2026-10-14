import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";
import LastResultButton from "@/components/LastResultButton";

export default function PlanModeChooser() {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold">{m.chooseHeading}</h2>
      <Link to="/budget" className="block">
        <div className="text-left rounded-3xl border border-border bg-card p-6 flex flex-col gap-3 hover:border-primary transition-colors">
          <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-heading text-lg font-bold">{m.budgetTitle}</h3>
          <p className="text-sm text-muted-foreground">{m.budgetDesc}</p>
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />{m.proNote}
          </p>
          <span className="mt-auto inline-flex items-center gap-2 font-heading font-semibold text-sm bg-primary text-primary-foreground rounded-full px-4 py-2.5 self-start">
            {m.budgetCta} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
      <div className="grid gap-2 md:grid-cols-2">
        <LastResultButton kind="budget" />
        <LastResultButton kind="plan" />
      </div>
    </section>
  );
}