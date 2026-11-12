import { Link } from "react-router-dom";
import { Leaf, Euro, ShoppingBasket, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { pageTranslations } from "@/lib/translations_pages";

export default function About() {
  const { currentLanguage } = useLanguage();
  const p = pageTranslations[currentLanguage.code] || pageTranslations["en"];

  const features = [
    { icon: Euro, title: p.aboutF1Title, desc: p.aboutF1Desc, bg: "bg-[#FFB020]" },
    { icon: Leaf, title: p.aboutF2Title, desc: p.aboutF2Desc, bg: "bg-[#78a71b]" },
    { icon: ShoppingBasket, title: p.aboutF3Title, desc: p.aboutF3Desc, bg: "bg-[#7DD3FC]" },
    { icon: Users, title: p.aboutF4Title, desc: p.aboutF4Desc, bg: "bg-[#FF8FB5]" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div className="bba-t bg-card space-y-4">
        <span className="bba-sticker">
          {p.aboutTitle}
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tight">
          {p.aboutP1?.split(".")[0] || p.aboutTitle}
        </h1>
        <div className="space-y-4 text-muted-foreground text-sm sm:text-base font-medium leading-relaxed">
          <p>{p.aboutP1}</p>
          <p>{p.aboutP2}</p>
          <p>{p.aboutP3}</p>
          <p>{p.aboutP4}</p>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="text-base">📧</span>
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary font-heading font-bold hover:underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(({ icon: Icon, title, desc, bg }) => (
          <div key={title} className="bba-t bg-card p-5 group hover:-translate-y-1">
            <div className={`${bg} text-[#111827] border-2 border-[#111827] w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 shadow-[2px_2px_0_#111827]`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-heading font-black text-foreground mb-1">{title}</p>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bba-t bg-[#FFB020] text-[#111827] px-6 py-6 text-center space-y-4">
        <p className="text-sm font-semibold text-[#111827] max-w-md mx-auto">{p.aboutCta}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#111827] text-white font-heading font-black text-sm px-6 py-3 rounded-full border-2 border-[#111827] shadow-[3px_3px_0_#FF3E7F] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
        >
          {p.aboutCtaBtn}
        </Link>
      </div>
    </div>
  );
}