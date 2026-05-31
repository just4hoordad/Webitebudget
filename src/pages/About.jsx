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
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">{p.aboutTitle}</h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-4">{p.aboutP1}</p>
        <p className="text-muted-foreground text-base leading-relaxed mb-4">{p.aboutP2}</p>
        <p className="text-muted-foreground text-base leading-relaxed mb-4">{p.aboutP3}</p>
        <p className="text-muted-foreground text-base leading-relaxed">
          {p.aboutP4}
        </p>
        <p className="text-muted-foreground text-sm mt-3">
          📧 <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary hover:underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-card border border-border rounded-xl p-4">
            <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="font-heading font-semibold text-sm text-foreground mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">{p.aboutCta}</p>
        <Link to="/" className="inline-block bg-primary text-primary-foreground font-heading font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          {p.aboutCtaBtn}
        </Link>
      </div>
    </div>
  );
}