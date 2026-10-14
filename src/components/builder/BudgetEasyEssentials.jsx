import { useLanguage } from "@/lib/LanguageContext";
import BudgetInput from "@/components/BudgetInput";
import DurationInput from "@/components/DurationInput";
import { Button } from "@/components/ui/button";
import { ArrowRight, SlidersHorizontal } from "lucide-react";

const MORE = {
  en: "Want more control? Switch to Detailed",
  de: "Mehr Kontrolle? Wechsle zu Detailliert",
  fr: "Plus de contrôle ? Passez en Détaillé",
  es: "¿Más control? Cambia a Detallado",
  ar: "تريد تحكماً أكثر؟ بدّل إلى المفصل",
  ru: "Больше контроля? Перейдите к Подробно",
  uk: "Більше контролю? Перейдіть до Детально",
  fa: "کنترل بیشتر؟ به تفصیلی تغییر دهید",
  zh: "想要更多控制？切换到详细模式",
  vi: "Muốn kiểm soát thêm? Chuyển sang Chi tiết",
  tr: "Daha fazla kontrol mü? Detaylı'ya geç",
};

export default function BudgetEasyEssentials({ budget, setBudget, days, setDays, people, setPeople, onGenerate, canGenerate, maxDays, onSwitchDetailed }) {
  const { t, currentLanguage } = useLanguage();
  const more = MORE[currentLanguage?.code] || MORE.en;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
        <div className="space-y-3">
          <BudgetInput value={budget[0]} onChange={(v) => setBudget([v])} label={t("monthlyBudget")} />
          <input
            type="range"
            min={10}
            max={2400}
            step={5}
            value={budget[0] || 0}
            onChange={(e) => setBudget([Number(e.target.value)])}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>€10</span>
            <span>{t("avgStudent")}</span>
            <span>€2400</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">{t("durationDays") || "Duration"}</label>
          <DurationInput value={Number(days) || 1} onChange={setDays} max={maxDays} />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">{t("numberOfPeople")}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPeople(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  people === n ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                {n} {n === 1 ? t("person") : t("people")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onGenerate}
        disabled={!canGenerate}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
        size="lg"
      >
        {t("generateBtn")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <button
        onClick={onSwitchDetailed}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {more}
      </button>
    </div>
  );
}