import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { FREE_GROCERY_DAY_CAP } from "@/lib/freeTier";
import { Lock, Sparkles } from "lucide-react";

const COPY = {
  en: {
    badge: "FREE TIER",
    title: "Your grocery list covers the first {cap} days",
    desc: "Your full {planDays}-day meal plan is ready, but the free grocery list stops at {cap} days. Upgrade to Premium to generate a single shopping list for all {planDays} days.",
    cta: "Unlock full grocery lists",
  },
  de: {
    badge: "KOSTENLOS",
    title: "Deine Einkaufsliste deckt die ersten {cap} Tage ab",
    desc: "Dein kompletter {planDays}-Tage-Ernährungsplan ist fertig, aber die kostenlose Einkaufsliste endet nach {cap} Tagen. Upgrade auf Premium für eine einzige Einkaufsliste für alle {planDays} Tage.",
    cta: "Vollständige Einkaufslisten freischalten",
  },
};

export default function FreeGroceryCapNotice({ planDays }) {
  const { currentLanguage } = useLanguage();
  const { isPro, openPricing } = useMonetization();
  if (isPro) return null;
  const cap = FREE_GROCERY_DAY_CAP;
  if (!(Number(planDays) > cap)) return null;
  const c = COPY[currentLanguage?.code] || COPY.en;
  const fill = (s) => s.replace(/\{cap\}/g, cap).replace(/\{planDays\}/g, planDays);

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3.5 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Lock className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="inline-block text-[10px] font-heading font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
          {c.badge}
        </span>
        <p className="font-heading font-bold text-sm text-foreground leading-snug">{fill(c.title)}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{fill(c.desc)}</p>
        <button
          type="button"
          onClick={() => openPricing?.()}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-heading font-bold hover:opacity-90 transition-opacity"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {c.cta}
        </button>
      </div>
    </div>
  );
}