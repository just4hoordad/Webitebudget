import { Link } from "react-router-dom";
import { Leaf, Euro, ShoppingBasket, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { pageTranslations } from "@/lib/translations_pages";

export default function About() {
  const { currentLanguage } = useLanguage();
  const p = pageTranslations[currentLanguage.code] || pageTranslations["en"];

  const features = [
    { icon: Euro, title: p.aboutF1Title, desc: p.aboutF1Desc },
    { icon: Leaf, title: p.aboutF2Title, desc: p.aboutF2Desc },
    { icon: ShoppingBasket, title: p.aboutF3Title, desc: p.aboutF3Desc },
    { icon: Users, title: p.aboutF4Title, desc: p.aboutF4Desc },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-2">
      <div className="space-y-5">
        <span className="inline-block text-xs font-heading font-semibold tracking-[0.18em] uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
          {p.aboutTitle}
        </span>
        <h1 className="font-heading text-4xl font-bold text-foreground leading-tight tracking-tight">
          {p.aboutP1?.split(".")[0] || p.aboutTitle}
        </h1>
        <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
          <p>{p.aboutP1}</p>
          <p>{p.aboutP2}</p>
          <p>{p.aboutP3}</p>
          <p>{p.aboutP4}</p>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="text-base">📧</span>
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary font-medium hover:underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bba-t bg-card p-5 group hover:-translate-y-1">
            <div className="bg-primary/20 border-2 border-[#111827] w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 shadow-[2px_2px_0_#111827]">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="font-heading font-semibold text-foreground mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/20 rounded-3xl px-6 py-6 text-center">
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">{p.aboutCta}</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] bb-shadow-glow">
          {p.aboutCtaBtn}
        </Link>
      </div>
    </div>
  );
}