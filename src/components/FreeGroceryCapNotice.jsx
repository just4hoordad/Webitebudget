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
    <div className="bba-t bba-locked-arcade border-[#111827] dark:border-[#FFB020] flex items-start gap-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFB020] border-[2.5px] border-[#111827] shadow-[2px_2px_0_#000] text-[#111827]">
        <Lock className="h-5 w-5 stroke-[2.5]" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB020] text-[#111827] border-[1.5px] border-[#111827] px-2.5 py-0.5 text-[10px] font-heading font-black uppercase tracking-wider mb-1.5">
          <Lock className="h-2.5 w-2.5 stroke-[2.8]" /> {c.badge} · PRO UNLOCK
        </span>
        <p className="font-heading font-black text-base text-[#F3F8E6] leading-snug">{fill(c.title)}</p>
        <p className="text-xs font-medium text-[#F3F8E6]/75 leading-relaxed mt-1">{fill(c.desc)}</p>
        <button
          type="button"
          onClick={() => openPricing?.()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-4 py-1.5 text-xs font-heading font-black shadow-[2px_2px_0_#FF3E7F] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#111827]" />
          {c.cta}
        </button>
      </div>
    </div>
  );
}