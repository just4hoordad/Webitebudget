import { useLanguage } from "@/lib/LanguageContext";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import MacroRatioControl from "@/components/MacroRatioControl";
import {
  Leaf, Beef, Fish, Wheat, Scale, Microwave, Users, CalendarDays,
  Store, ArrowRight, Sparkles, ShoppingCart,
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

function SectionHeader({ icon: Icon, label, active, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />} {label}
      </label>
      <Switch checked={active} onCheckedChange={onToggle} aria-label={`Toggle ${label}`} />
    </div>
  );
}

export default function PlanSetup({ diet, setDiet, days, setDays, people, setPeople, stores, toggleStore, macros, setMacros, enabled, toggleSetting, onBuild, loading }) {
  const { t } = useLanguage();
  const disabledCls = (key) => (enabled[key] ? "" : "opacity-40 pointer-events-none");
  const macroTotal = macros.protein + macros.carbs + macros.fats;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <ShoppingCart className="h-4 w-4" /> {t("planBuilderBadge")}
        </div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-balance">{t("planBuilderTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1.5 text-balance">{t("planBuilderSubtitle")}</p>
      </div>

      {/* Diet */}
      <div>
        <SectionHeader icon={Leaf} label={t("dietPreference")} active={enabled.diet} onToggle={() => toggleSetting("diet")} />
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${disabledCls("diet")}`}>
          {DIET_KEYS.map((d) => {
            const Icon = d.icon;
            const sel = diet === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDiet(d.id)}
                className={`flex flex-col items-start gap-1 p-4 rounded-xl text-left transition-all duration-200 border ${
                  sel ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className={`mb-1 ${sel ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {d.id === "halal" ? <span className="text-xl font-bold leading-none">حلال</span> : Icon ? <Icon className="h-6 w-6" /> : null}
                </div>
                <span className={`font-heading font-semibold text-sm leading-tight ${sel ? "text-primary-foreground" : "text-foreground"}`}>{t(d.nameKey)}</span>
                <span className={`text-xs leading-tight ${sel ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t(d.descKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* People */}
      <div className="space-y-3">
        <SectionHeader icon={Users} label={t("numberOfPeople")} active={enabled.people} onToggle={() => toggleSetting("people")} />
        <div className={`flex gap-2 ${disabledCls("people")}`}>
          {[1, 2, 3, 4].map((n) => (
            <button key={n} onClick={() => setPeople(n)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${people === n ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"}`}>
              {n} {n === 1 ? t("person") : t("people")}
            </button>
          ))}
        </div>
      </div>

      {/* Days */}
      <div className="space-y-3">
        <SectionHeader icon={CalendarDays} label={t("durationDays") || "Duration"} active={enabled.days} onToggle={() => toggleSetting("days")} />
        <div className={`flex items-center gap-4 ${disabledCls("days")}`}>
          <Slider value={[days]} onValueChange={([v]) => setDays(v)} min={1} max={30} step={1} className="flex-1" />
          <span className="font-heading font-bold text-lg w-20 text-right">{days} {t("days")}</span>
        </div>
      </div>

      {/* Stores */}
      <div className="space-y-3">
        <SectionHeader icon={Store} label={t("preferredStores")} active={enabled.stores} onToggle={() => toggleSetting("stores")} />
        <div className={`flex flex-wrap gap-2 ${disabledCls("stores")}`}>
          {STORES.map((s) => (
            <button key={s} onClick={() => toggleStore(s)} className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${stores.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className={`rounded-xl border border-border bg-card p-4 ${disabledCls("macros")}`}>
        <MacroRatioControl value={macros} onChange={setMacros} active={enabled.macros} onToggle={() => toggleSetting("macros")} />
      </div>

      <button
        onClick={onBuild}
        disabled={loading || (enabled.stores && stores.length === 0) || (enabled.macros && macroTotal !== 100)}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-primary-foreground disabled:opacity-60"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        {t("buildMyPlan")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>
    </div>
  );
}