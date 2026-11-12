import { useLanguage } from "@/lib/LanguageContext";
import DurationInput from "@/components/DurationInput";
import { Button } from "@/components/ui/button";
import { ArrowRight, SlidersHorizontal, Leaf, Beef, Fish, Wheat, Scale, Microwave, Store } from "lucide-react";
import { GROCERY_STORES } from "@/lib/groceryStores";
import { useMonetization } from "@/lib/MonetizationContext";
import ProLockBadge from "@/components/monetization/ProLockBadge";

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

const FREE_HINT = {
  en: "Free plan: 1 store. Upgrade for multiple.",
  de: "Gratis-Tarif: 1 Geschäft. Upgrade für mehrere.",
  fr: "Plan gratuit : 1 magasin. Passez au supérieur pour plus.",
  es: "Plan gratuito: 1 tienda. Mejora para más.",
  ar: "الباقة المجانية: متجر واحد. ترقَّ للمزيد.",
  ru: "Бесплатный план: 1 магазин. Обновите для большего.",
  uk: "Безкоштовний план: 1 магазин. Оновіть для більшого.",
  fa: "پلن رایگان: ۱ فروشگاه. ارتقا برای بیشتر.",
  zh: "免费计划：1家店。升级可选更多。",
  vi: "Gói miễn phí: 1 cửa hàng. Nâng cấp để chọn thêm.",
  tr: "Ücretsiz plan: 1 mağaza. Daha fazlası için yükseltin.",
};

const PRO_HINT = {
  en: "Up to 4 stores per plan.",
  de: "Bis zu 4 Geschäfte pro Plan.",
  fr: "Jusqu'à 4 magasins par plan.",
  es: "Hasta 4 tiendas por plan.",
  ar: "حتى 4 متاجر لكل خطة.",
  ru: "До 4 магазинов на план.",
  uk: "До 4 магазинів на план.",
  fa: "تا ۴ فروشگاه برای هر برنامه.",
  zh: "每个计划最多4家店。",
  vi: "Tối đa 4 cửa hàng mỗi kế hoạch.",
  tr: "Her plan için en fazla 4 mağaza.",
};

const PICK_HINT = {
  en: "Pick at least one store to continue",
  de: "Wähle mindestens ein Geschäft",
  fr: "Choisissez au moins un magasin",
  es: "Elige al menos una tienda",
  ar: "اختر متجراً واحداً على الأقل",
  ru: "Выберите хотя бы один магазин",
  uk: "Оберіть хоча б один магазин",
  fa: "حداقل یک فروشگاه انتخاب کنید",
  zh: "请至少选择一家店",
  vi: "Chọn ít nhất một cửa hàng",
  tr: "Devam etmek için en az bir mağaza seçin",
};

export default function PlanEasyEssentials({ diet, setDiet, days, setDays, people, setPeople, onBuild, canBuild, maxDays, onSwitchDetailed, stores, toggleStore, isPro }) {
  const { t, currentLanguage } = useLanguage();
  const { openPricing } = useMonetization();
  const more = MORE[currentLanguage?.code] || MORE.en;
  const freeHint = FREE_HINT[currentLanguage?.code] || FREE_HINT.en;
  const proHint = PRO_HINT[currentLanguage?.code] || PRO_HINT.en;
  const pickHint = PICK_HINT[currentLanguage?.code] || PICK_HINT.en;

  const handleStoreClick = (storeId) => {
    if (stores.includes(storeId)) {
      toggleStore(storeId);
    } else if (isPro) {
      if (stores.length >= 4) return;
      toggleStore(storeId);
    } else {
      // Free tier: max 1 store — replace current selection
      stores.forEach((s) => toggleStore(s));
      toggleStore(storeId);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bba-t bg-card p-5 sm:p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-heading font-black text-foreground flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#78a71b] text-[#111827] border-2 border-[#111827] text-xs">1</span>
            {t("dietPreference") || "Diet"}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DIETS.map((d) => {
              const Icon = d.Icon;
              const sel = diet === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiet(d.id)}
                  className={`flex items-center gap-2 p-3 text-left text-sm bba-chip ${
                    sel ? "bba-chip-active" : ""
                  }`}
                >
                  {d.id === "halal" ? <span className="text-base font-black leading-none">حلال</span> : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                  <span className="truncate">{t(d.nameKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-heading font-black text-foreground flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#FF8FB5] text-[#111827] border-2 border-[#111827] text-xs">2</span>
              <Store className="h-4 w-4 text-primary" />
              {t("preferredStores") || "Preferred stores"}
            </label>
            {!isPro && (
              <ProLockBadge
                label="2–4 STORES · PRO"
                size="xs"
                onClick={openPricing}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {GROCERY_STORES.map((store) => {
              const isSelected = stores.includes(store.id);
              const isExtraLockedSlot = !isPro && stores.length >= 1 && !isSelected;
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => handleStoreClick(store.id)}
                  className={`px-3.5 py-2 text-sm bba-chip ${
                    isSelected
                      ? "bba-chip-active"
                      : isExtraLockedSlot
                      ? "!bg-[#161e2e] !text-[#F3F8E6]/70 hover:!text-white"
                      : ""
                  }`}
                >
                  {store.name}
                </button>
              );
            })}
          </div>
          {isPro ? (
            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FFB020] border border-[#111827] shrink-0" />
              {proHint}
            </p>
          ) : (
            <button
              type="button"
              onClick={openPricing}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bba-locked-arcade border-2 border-[#111827] dark:border-[#FFB020]/60 shadow-[2px_2px_0_#111827] text-left hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
            >
              <span className="text-xs font-bold text-[#F3F8E6]/85">{freeHint}</span>
              <ProLockBadge label="UNLOCK" size="xs" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-heading font-black text-foreground flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFB020] text-[#111827] border-2 border-[#111827] text-xs">3</span>
            {t("numberOfPeople")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPeople(n)}
                className={`py-2.5 px-3 text-sm bba-chip ${people === n ? "bba-chip-active" : ""}`}
              >
                {n} {n === 1 ? t("person") : t("people")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-heading font-black text-foreground flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#7DD3FC] text-[#111827] border-2 border-[#111827] text-xs">4</span>
            {t("durationDays") || "Duration"}
          </label>
          <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4">
            <DurationInput value={Number(days) || 1} onChange={setDays} max={maxDays} />
          </div>
        </div>
      </div>

      {stores.length === 0 && (
        <p className="text-xs text-destructive text-center font-heading font-bold -mt-2">⚠️ {pickHint}</p>
      )}

      <Button
        onClick={onBuild}
        disabled={!canBuild}
        variant="destructive"
        className="w-full h-14 text-base"
        size="lg"
      >
        {t("buildMyPlan")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <button
        type="button"
        onClick={onSwitchDetailed}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-heading font-extrabold text-muted-foreground hover:text-foreground transition-colors"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {more}
      </button>
    </div>
  );
}