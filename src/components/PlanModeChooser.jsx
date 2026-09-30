import { Link } from "react-router-dom";
import { Wallet, Dumbbell, ArrowRight, ChefHat } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";

export default function PlanModeChooser({ onBudget }) {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);
  const card = "text-left rounded-3xl border border-border bg-card p-6 flex flex-col gap-3 hover:border-primary transition-colors";
  const cta = "mt-auto inline-flex items-center gap-2 font-heading font-semibold text-sm bg-primary text-primary-foreground rounded-full px-4 py-2.5 self-start";

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold">{m.chooseHeading}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <button type="button" onClick={onBudget} className={card}>
          <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center"><Wallet className="h-5 w-5" /></div>
          <h3 className="font-heading text-lg font-bold">{m.budgetTitle}</h3>
          <p className="text-sm text-muted-foreground">{m.budgetDesc}</p>
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground"><ChefHat className="h-3.5 w-3.5" />{m.proNote}</p>
          <span className={cta}>{m.budgetCta} <ArrowRight className="h-4 w-4" /></span>
        </button>
        <Link to="/plan-builder" className={card}>
          <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center"><Dumbbell className="h-5 w-5" /></div>
          <h3 className="font-heading text-lg font-bold">{m.freeTitle}</h3>
          <p className="text-sm text-muted-foreground">{m.freeDesc}</p>
          <span className={cta}>{m.freeCta} <ArrowRight className="h-4 w-4" /></span>
        </Link>
      </div>
    </section>
  );
}