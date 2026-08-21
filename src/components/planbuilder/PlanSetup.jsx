import { useLanguage } from "@/lib/LanguageContext";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import MacroRatioControl from "@/components/MacroRatioControl";
import {
  Leaf, Beef, Fish, Wheat, Scale, Microwave, Users, CalendarDays,
  Store, ArrowRight, Check,
} from "lucide-react";

const DIET_KEYS = [
  { id: "balanced", nameKey: "balanced", icon: Scale, descKey: "balancedDesc" },
  { id: "vegetarian", nameKey: "vegetarian", icon: Leaf, descKey: "vegetarianDesc" },
  { id: "vegan", nameKey: "vegan", icon: Leaf, descKey: "veganDesc" },
  { id: "high-protein", nameKey: "highProtein", icon: Beef, descKey: "highProteinDesc" },
  { id: "pescatarian", nameKey: "pescatarian", icon: Fish, descKey: "pescatarianDesc" },
  { id: "gluten-free", nameKey: "glutenFree", icon: Wheat, descKey: "glutenFreeDesc" },
  { id: "halal", nameKey: "halal", icon: null, descKey: "halalDesc" },
  { id: "frozen", nameKey: "frozenFoods", icon: Microwave, descKey: "frozenFoodsDesc" },
];

const STORES = ["Aldi", "Lidl", "REWE", "Edeka", "Penny", "Netto"];

function SectionHeader({ index, icon: Icon, label, active, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <span className="font-display font-semibold text-editorial text-sm tabular-nums">{index}</span>
        <label className="text-sm font-medium text-editorial-ink flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-editorial" />} {label}
        </label>
      </div>
      <Switch checked={active} onCheckedChange={onToggle} aria-label={`Toggle ${label}`} />
    </div>
  );
}

export default function PlanSetup({ diet, setDiet, days, setDays, people, setPeople, stores, toggleStore, macros, setMacros, enabled, toggleSetting, onBuild, loading }) {
  const { t } = useLanguage();
  const disabledCls = (key) => (enabled[key] ? "" : "opacity-40 pointer-events-none");
  const macroTotal = macros.protein + macros.carbs + macros.fats;
  const buildDisabled = !loading && ((enabled.stores && stores.length === 0) || (enabled.macros && macroTotal !== 100));
  const disabledReason = buildDisabled
    ? (enabled.stores && stores.length === 0 ? t("buildDisabledStore") : t("buildDisabledMacros"))
    : null;

  return (
    <div className="space-y-7">
      {/* Editorial hero band */}
      <div className="relative overflow-hidden rounded-2xl bg-editorial-bg border border-border px-6 py-7">
        <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-editorial/10 blur-2xl pointer-events-none" />
        <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-widest text-editorial mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-editorial" /> {t("planBuilderBadge")}
        </span>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-[1.05] text-editorial-ink text-balance">
          {t("planBuilderTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md text-balance">{t("planBuilderSubtitle")}</p>
      </div>

      {/* Diet */}
      <div>
        <SectionHeader index="01" icon={Leaf} label={t("dietPreference")} active={enabled.diet} onToggle={() => toggleSetting("diet")} />
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${disabledCls("diet")}`}>
          {DIET_KEYS.map((d) => {
            const Icon = d.icon;
            const sel = diet === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDiet(d.id)}
                className={`relative flex flex-col items-start gap-1 p-4 rounded-xl text-left transition-all duration-200 border ${
                  sel ? "bg-editorial/5 border-editorial ring-1 ring-editorial" : "bg-card text-foreground border-border hover:border-editorial/40 hover:shadow-md"
                }`}
              >
                {sel && (
                  <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-editorial text-white flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div className={`mb-1 ${sel ? "text-editorial" : "text-muted-foreground"}`}>
                  {d.id === "halal" ? <span className="text-xl font-bold leading-none">حلال</span> : Icon ? <Icon className="h-6 w-6" /> : null}
                </div>
                <span className={`font-display font-semibold text-sm leading-tight ${sel ? "text-editorial-ink" : "text-foreground"}`}>{t(d.nameKey)}</span>
                <span className={`text-xs leading-tight ${sel ? "text-editorial-ink/70" : "text-muted-foreground"}`}>{t(d.descKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* People */}
      <div className="space-y-3">
        <SectionHeader index="02" icon={Users} label={t("numberOfPeople")} active={enabled.people} onToggle={() => toggleSetting("people")} />
        <div className={`flex gap-2 ${disabledCls("people")}`}>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} onClick={() => setPeople(n)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${people === n ? "bg-editorial text-white border-editorial" : "bg-card text-foreground border-border hover:border-editorial/40"}`}>
              {n} {n === 1 ? t("person") : t("people")}
            </button>
          ))}
        </div>
      </div>

      {/* Days */}
      <div className="space-y-3">
        <SectionHeader index="03" icon={CalendarDays} label={t("durationDays") || "Duration"} active={enabled.days} onToggle={() => toggleSetting("days")} />
        <div className={`flex items-center gap-4 ${disabledCls("days")}`}>
          <Slider value={[days]} onValueChange={([v]) => setDays(v)} min={1} max={30} step={1} className="flex-1" />
          <span className="font-display font-semibold text-2xl w-24 text-right text-editorial-ink">{days} <span className="text-sm text-muted-foreground">{t("days")}</span></span>
        </div>
      </div>

      {/* Stores */}
      <div className="space-y-3">
        <SectionHeader index="04" icon={Store} label={t("preferredStores")} active={enabled.stores} onToggle={() => toggleSetting("stores")} />
        <div className={`flex flex-wrap gap-2 ${disabledCls("stores")}`}>
          {STORES.map((s) => (
            <button key={s} onClick={() => toggleStore(s)} className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${stores.includes(s) ? "bg-editorial text-white border-editorial" : "bg-card text-muted-foreground border-border hover:border-editorial/40"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className="space-y-3">
        <SectionHeader index="05" icon={Scale} label={t("macroTitle")} active={enabled.macros} onToggle={() => toggleSetting("macros")} />
        <div className={`rounded-xl border border-border bg-card p-4 ${disabledCls("macros")}`}>
          <MacroRatioControl value={macros} onChange={setMacros} />
        </div>
      </div>

      {disabledReason && (
        <p className="text-xs text-destructive text-center font-medium">{disabledReason}</p>
      )}
      <button
        onClick={onBuild}
        disabled={loading || (enabled.stores && stores.length === 0) || (enabled.macros && macroTotal !== 100)}
        className="w-full h-14 text-base font-display font-semibold rounded-xl bg-editorial text-white hover:bg-editorial/90 hover:shadow-lg hover:shadow-editorial/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-60"
      >
        {t("buildMyPlan")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
}