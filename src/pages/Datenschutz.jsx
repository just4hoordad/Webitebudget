import { useLanguage } from "@/lib/LanguageContext";
import { privacyTranslations } from "@/lib/translations_pages";

export default function Datenschutz() {
  const { currentLanguage } = useLanguage();
  const p = privacyTranslations[currentLanguage.code] || privacyTranslations["en"];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <h1 className="font-heading text-3xl font-bold text-foreground">{p.pageTitle}</h1>

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

      <p className="text-xs text-muted-foreground pt-4 border-t border-border">{p.date}</p>
    </div>
  );
}