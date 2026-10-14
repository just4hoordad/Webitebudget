import { useLanguage } from "@/lib/LanguageContext";
import DurationInput from "@/components/DurationInput";
import { Button } from "@/components/ui/button";
import { ArrowRight, SlidersHorizontal, Leaf, Beef, Fish, Wheat, Scale, Microwave } from "lucide-react";

const DIETS = [
  { id: "balanced", nameKey: "balanced", Icon: Scale },
  { id: "vegetarian", nameKey: "vegetarian", Icon: Leaf },
  { id: "vegan", nameKey: "vegan", Icon: Leaf },
  { id: "high-protein", nameKey: "highProtein", Icon: Beef },
  { id: "pescatarian", nameKey: "pescatarian", Icon: Fish },
  { id: "gluten-free", nameKey: "glutenFree", Icon: Wheat },
  { id: "halal", nameKey: "halal", Icon: null },
  { id: "frozen", nameKey: "frozenFoods", Icon: Microwave },
];

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

export default function PlanEasyEssentials({ diet, setDiet, days, setDays, people, setPeople, onBuild, canBuild, maxDays, onSwitchDetailed }) {
  const { t, currentLanguage } = useLanguage();
  const more = MORE[currentLanguage?.code] || MORE.en;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">{t("dietPreference") || "Diet"}</label>
          <div className="grid grid-cols-2 gap-2.5">
            {DIETS.map((d) => {
              const Icon = d.Icon;
              const sel = diet === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDiet(d.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-left text-sm font-medium border transition-all ${
                    sel ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {d.id === "halal" ? <span className="text-base font-bold leading-none">حلال</span> : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  <span className="truncate">{t(d.nameKey)}</span>
                </button>
              );
            })}
          </div>
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

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">{t("durationDays") || "Duration"}</label>
          <DurationInput value={Number(days) || 1} onChange={setDays} max={maxDays} />
        </div>
      </div>

      <Button
        onClick={onBuild}
        disabled={!canBuild}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
        size="lg"
      >
        {t("buildMyPlan")}
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