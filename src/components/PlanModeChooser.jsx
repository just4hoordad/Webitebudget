import { Link } from "react-router-dom";
import { Wallet, Dumbbell, ArrowRight, ChefHat } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";

export default function PlanModeChooser() {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);
  const items = [
    { to: "/budget", Icon: Wallet, title: m.budgetTitle, desc: m.budgetDesc, cta: m.budgetCta, delay: ".9s" },
    { to: "/plan-builder", Icon: Dumbbell, title: m.freeTitle, desc: m.freeDesc, cta: m.freeCta, delay: "1.05s" },
  ];

  return (
    <section>
      <h2 className="font-heading text-[22px] font-extrabold tracking-[-.02em] leading-[1.1] mt-10 mb-3.5">{m.chooseHeading}</h2>
      <div className="grid md:grid-cols-2 md:gap-4">
        {items.map(({ to, Icon, title, desc, cta, delay }) => (
          <Link
            key={to}
            to={to}
            style={{ animationDelay: delay }}
            className="rise group block bg-card border border-[#d9dccf] rounded-[10px] px-4 py-[18px] mb-3.5 shadow-[0_6px_16px_rgba(104,110,94,.12)] transition-[box-shadow,border-color] duration-200 hover:border-primary hover:shadow-[0_8px_20px_rgba(120,167,27,.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            <div className="w-[38px] h-[38px] rounded-[10px] bg-background flex items-center justify-center mb-2.5"><Icon className="h-5 w-5" /></div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="font-heading text-lg font-extrabold tracking-[-.01em] leading-[1.15]">{title}</h3>
              <span className="flex-1 min-w-4 border-b-2 border-dotted border-[#b9bdac] -translate-y-[3px]" />
            </div>
            <p className="text-sm leading-[1.4] text-muted-foreground my-2">{desc}</p>
            <p className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 mb-3.5"><ChefHat className="h-3.5 w-3.5" />{m.proNote}</p>
            <span className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm rounded-full px-4 py-2.5 transition-[background,box-shadow] duration-200 group-hover:bg-[#6a9617] group-hover:shadow-[0_4px_10px_rgba(120,167,27,.4)] group-active:bg-[#5c8413]">
              {cta} <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}