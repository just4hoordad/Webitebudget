import { useLanguage } from "@/lib/LanguageContext";
import { privacyTranslations } from "@/lib/translations_pages";

export default function Datenschutz() {
  const { currentLanguage } = useLanguage();
  const p = privacyTranslations[currentLanguage.code] || privacyTranslations["en"];

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">
      <div className="bba-t bg-[#7DD3FC] text-[#111827] space-y-1.5">
        <span className="bba-sticker">Legal</span>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#111827]">{p.pageTitle}</h1>
      </div>

      <div className="bba-t bg-card space-y-6">
      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s1h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {p.s1p.split("Hoordad.sedaghat@gmail.com")[0]}
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s2h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{p.s2p}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s3h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{p.s3p}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s4h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{p.s4p}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s5h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{p.s5p}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s6h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {p.s6p}{" "}
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">{p.s7h}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {p.s7p}{" "}
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </section>

      <p className="text-xs font-semibold text-muted-foreground pt-4 border-t-2 border-[#111827]/15 dark:border-white/15">{p.date}</p>
      </div>
    </div>
  );
}