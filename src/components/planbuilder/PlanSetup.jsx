import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import DurationInput from "@/components/DurationInput";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import MacroRatioControl from "@/components/MacroRatioControl";
import StepProgress from "@/components/StepProgress";
import StickyGenerateBar from "@/components/StickyGenerateBar";
import useGuidedAccordion from "@/components/forms/useGuidedAccordion";
import {
  Leaf, Beef, Fish, Wheat, Scale, Microwave, Users, CalendarDays,
  Store, ArrowRight, Sparkles, ShoppingCart, MapPin, X, Tag, TrendingDown,
} from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";
import { getStoreDiscount } from "@/lib/storeDiscounts";

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

const STORES = ["Aldi", "Lidl", "Kaufland", "Penny", "Netto", "REWE", "Edeka"];

function SectionHeader({ icon: Icon, label, summary, extra }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-heading font-semibold text-sm text-foreground leading-tight">{label}</p>
        {summary && <p className="text-xs text-muted-foreground truncate mt-0.5 group-data-[state=open]:hidden">{summary}</p>}
      </div>
      {extra}
    </div>
  );
}

export default function PlanSetup({ diet, setDiet, days, setDays, people, setPeople, stores, toggleStore, macros, setMacros, macrosSet, enabled, toggleSetting, onBuild, loading, postalCode, setPostalCode, selectedStoreLocations, onChangeStoreLocations, cityCoords, onCityCoordsUsed }) {
  const { t } = useLanguage();
  const disabledCls = (key) => (enabled[key] ? "" : "opacity-40 pointer-events-none");
  const macroTotal = macros.protein + macros.carbs + macros.fats;
  const hasStores = stores.length > 0 || (selectedStoreLocations && selectedStoreLocations.length > 0);
  const macrosDone = macrosSet && macroTotal === 100;
  const basicsMissing = (enabled.diet && !diet) || (enabled.people && !(people > 0)) || (enabled.days && !(days >= 1));
  const buildDisabled = !loading && (basicsMissing || (enabled.stores && !hasStores) || (enabled.macros && !macrosDone));
  const tf = (k, fb) => { const v = t(k); return !v || v === k ? fb : v; };
  const disabledReason = buildDisabled
    ? (basicsMissing ? tf("fillAllSections", "Please fill in every section to continue")
      : enabled.stores && !hasStores ? t("buildDisabledStore")
      : macroTotal !== 100 ? t("buildDisabledMacros")
      : tf("pickMacros", "Please choose your macros"))
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
  const buildBtnDisabled = loading || buildDisabled;

  const { openSection, selectSection, withStepInput } = useGuidedAccordion({
    steps: ["diet", "people", "days", "stores", "macros"],
    completed: {
      diet: !enabled.diet || !!diet,
      people: !enabled.people || people > 0,
      days: !enabled.days || days >= 1,
      stores: !enabled.stores || hasStores,
      macros: !enabled.macros || macrosDone,
    },
    formRef,
    prefix: "pb-",
  });

  const dietLabel = diet ? t(DIET_KEYS.find(d => d.id === diet)?.nameKey) : (t("dietPreference") || "Diet");
  const storeNames = stores.length > 0 ? stores.join(", ") : (selectedStoreLocations && selectedStoreLocations.length > 0 ? selectedStoreLocations.map(s => s.name).join(", ") : (t("noStoresSelected") || "No stores"));

  return (
    <div ref={formRef} className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <ShoppingCart className="h-4 w-4" /> {t("planBuilderBadge")}
        </div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-balance">{t("planBuilderTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1.5 text-balance">{t("planBuilderSubtitle")}</p>
      </div>

      <StepProgress
        steps={[
          { key: "diet", label: t("dietPreference"), required: enabled.diet, done: !enabled.diet || !!diet },
          { key: "people", label: t("numberOfPeople"), required: enabled.people, done: !enabled.people || people > 0 },
          { key: "days", label: t("durationDays") || "Duration", required: enabled.days, done: !enabled.days || days >= 1 },
          { key: "stores", label: t("preferredStores"), required: enabled.stores, done: !enabled.stores || hasStores },
          { key: "macros", label: t("macroTitle"), required: enabled.macros, done: !enabled.macros || macrosDone },
        ]}
        activeStep={openSection}
        onStepClick={selectSection}
      />

      <Accordion type="single" collapsible value={openSection} onValueChange={selectSection} className="space-y-3">

        {/* ── Diet ── */}
        <AccordionItem id="pb-diet" value="diet" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader icon={Leaf} label={t("dietPreference")} summary={dietLabel} />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pb-2 ${disabledCls("diet")}`}>
              {DIET_KEYS.map((d) => {
                const Icon = d.icon;
                const sel = diet === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={withStepInput("diet", () => setDiet(d.id))}
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
          </AccordionContent>
        </AccordionItem>

        {/* ── People ── */}
        <AccordionItem id="pb-people" value="people" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader icon={Users} label={t("numberOfPeople")} summary={`${people} ${people === 1 ? (t("person") || "person") : (t("people") || "people")}`} />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`flex gap-2 pb-2 ${disabledCls("people")}`}>
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={withStepInput("people", () => setPeople(n))} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${people === n ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"}`}>
                  {n} {n === 1 ? t("person") : t("people")}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Days ── */}
        <AccordionItem id="pb-days" value="days" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader icon={CalendarDays} label={t("durationDays") || "Duration"} summary={`${days} ${t("days") || "days"}`} />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`pb-2 ${disabledCls("days")}`}>
              <DurationInput value={days} onChange={withStepInput("days", setDays)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Stores ── */}
        <AccordionItem id="pb-stores" value="stores" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader icon={Store} label={t("preferredStores")} summary={storeNames} />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-3 pb-2 ${disabledCls("stores")}`}>
              <div className="flex flex-wrap gap-2">
                {STORES.map((s) => {
                  const discount = getStoreDiscount(s, diet, macros);
                  const isSelected = stores.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={withStepInput("stores", () => toggleStore(s))}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all inline-flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      <span>{s}</span>
                      {discount > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 transition-colors ${
                            isSelected
                              ? "bg-white/20 text-primary-foreground"
                              : "bg-primary/10 text-primary border border-primary/30"
                          }`}
                          title={`Estimated ~${discount}% savings on ${diet || "staple"} essentials`}
                        >
                          <Tag className="h-2.5 w-2.5" /> -{discount}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
                <TrendingDown className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  {t("storeDiscountExplanation") || "Estimated discount % calculated from current shelf prices for your diet & macro split"}
                </span>
              </p>

              {/* Postal code — regional pricing + map picker */}
              <div className="space-y-2 pt-2 border-t border-border">
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
                      onChangeStoreLocations={withStepInput("stores", onChangeStoreLocations)}
                      selectedChains={stores}
                      onToggleChain={withStepInput("stores", toggleStore)}
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Macros ── */}
        <AccordionItem id="pb-macros" value="macros" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Scale}
                label={t("macroTitle")}
                summary={macrosDone ? `P${macros.protein}/C${macros.carbs}/F${macros.fats}` : (t("pickMacros") || "Set macros")}
                extra={
                  <Switch checked={enabled.macros} onCheckedChange={withStepInput("macros", () => toggleSetting("macros"))} aria-label={t("macroTitle")} onClick={(e) => e.stopPropagation()} />
                }
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`pb-2 ${disabledCls("macros")}`}>
              <MacroRatioControl value={macros} onChange={withStepInput("macros", setMacros)} unset={!macrosSet} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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