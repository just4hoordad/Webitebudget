import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import MacroRatioControl from "@/components/MacroRatioControl";
import StickyGenerateBar from "@/components/StickyGenerateBar";
import {
  Leaf, Beef, Fish, Wheat, Scale, Microwave, Users, CalendarDays,
  Store, ArrowRight, Sparkles, ShoppingCart, MapPin, X,
} from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";

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

export default function PlanSetup({ diet, setDiet, days, setDays, people, setPeople, stores, toggleStore, macros, setMacros, enabled, toggleSetting, onBuild, loading, postalCode, setPostalCode, selectedStoreLocations, onChangeStoreLocations, cityCoords, onCityCoordsUsed }) {
  const { t } = useLanguage();
  const disabledCls = (key) => (enabled[key] ? "" : "opacity-40 pointer-events-none");
  const macroTotal = macros.protein + macros.carbs + macros.fats;
  const hasStores = stores.length > 0 || (selectedStoreLocations && selectedStoreLocations.length > 0);
  const buildDisabled = !loading && ((enabled.stores && !hasStores) || (enabled.macros && macroTotal !== 100));
  const disabledReason = buildDisabled
    ? (enabled.stores && !hasStores ? t("buildDisabledStore") : t("buildDisabledMacros"))
    : null;

  const formRef = useRef(null);
  const buildRef = useRef(null);
  const [formInView, setFormInView] = useState(true);
  const [buildInView, setBuildInView] = useState(true);

  useEffect(() => {
    const f = formRef.current;
    const b = buildRef.current;
    if (!f || !b) return;
    const fObs = new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting), { threshold: 0.05 });
    const bObs = new IntersectionObserver(([entry]) => setBuildInView(entry.isIntersecting), { threshold: 0.05 });
    fObs.observe(f);
    bObs.observe(b);
    return () => { fObs.disconnect(); bObs.disconnect(); };
  }, []);

  const showStickyBuild = formInView && !buildInView;
  const buildBtnDisabled = loading || (enabled.stores && !hasStores) || (enabled.macros && macroTotal !== 100);

  return (
    <div ref={formRef} className="space-y-6">
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

      {/* Postal code — regional pricing + map picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> {t("plzLabel") || "Postal code (PLZ)"}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            value={postalCode || ""}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder={t("plzPlaceholder") || "e.g. 10115"}
            className="flex-1 min-w-0 border border-border rounded-xl px-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="shrink-0 py-1">
            <StoreMapPicker
              selectedStoreLocations={selectedStoreLocations || []}
              onChangeStoreLocations={onChangeStoreLocations}
              selectedChains={stores}
              onToggleChain={toggleStore}
              cityCoords={cityCoords}
              onCityCoordsUsed={onCityCoordsUsed}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{t("plzHelper")}</p>
        {selectedStoreLocations && selectedStoreLocations.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
              <Store className="h-3.5 w-3.5" /> {selectedStoreLocations.length} {t("mapSpecificStoresSelected")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedStoreLocations.map((s) => (
                <span key={s.id} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-lg font-medium">
                  {s.name}
                  {s.address && <span className="opacity-70">· {s.address.split(",")[0]}</span>}
                  <button onClick={() => onChangeStoreLocations(selectedStoreLocations.filter((x) => x.id !== s.id))} className="ml-0.5 opacity-70 hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <button onClick={() => onChangeStoreLocations([])} className="text-xs text-muted-foreground hover:text-destructive mt-2 underline">
              {t("clearPinnedStores")}
            </button>
          </div>
        )}
      </div>

      {/* Macros */}
      <div className="space-y-3">
        <SectionHeader icon={Scale} label={t("macroTitle")} active={enabled.macros} onToggle={() => toggleSetting("macros")} />
        <div className={`rounded-xl border border-border bg-card p-4 ${disabledCls("macros")}`}>
          <MacroRatioControl value={macros} onChange={setMacros} />
        </div>
      </div>

      {disabledReason && (
        <p className="text-xs text-destructive text-center font-medium">{disabledReason}</p>
      )}
      <button
        ref={buildRef}
        onClick={onBuild}
        disabled={buildBtnDisabled}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-primary-foreground disabled:opacity-60"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        {t("buildMyPlan")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </button>

      <StickyGenerateBar
        visible={showStickyBuild}
        onClick={onBuild}
        disabled={buildBtnDisabled}
        label={t("buildMyPlan")}
        icon={Sparkles}
      />
    </div>
  );
}