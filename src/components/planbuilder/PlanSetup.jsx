import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import DurationInput from "@/components/DurationInput";
import MacroRatioControl from "@/components/MacroRatioControl";
import StepProgress from "@/components/StepProgress";
import StickyGenerateBar from "@/components/StickyGenerateBar";
import SetupPart from "@/components/planbuilder/SetupPart";
import SetupDiet from "@/components/planbuilder/SetupDiet";
import SetupStores from "@/components/planbuilder/SetupStores";
import usePlanSetupGuidance from "@/components/planbuilder/usePlanSetupGuidance";
import { Users, CalendarDays, Scale, ArrowRight, Sparkles, ShoppingCart } from "lucide-react";

export default function PlanSetup({ diet, setDiet, days, setDays, people, setPeople, stores, toggleStore, macros, setMacros, macrosSet, enabled, toggleSetting, onBuild, loading, postalCode, setPostalCode, selectedStoreLocations, onChangeStoreLocations, cityCoords, onCityCoordsUsed }) {
  const { t } = useLanguage();
  const { isPro } = useMonetization();
  const maxDays = isPro ? 30 : 7;
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

  const { activeStep, scrollToPart, completePart } = usePlanSetupGuidance({
    completed: {
      diet: !enabled.diet || !!diet,
      people: !enabled.people || people > 0,
      days: !enabled.days || days >= 1,
      stores: !enabled.stores || hasStores,
      macros: !enabled.macros || macrosDone,
    },
    enabled,
    formRef,
  });

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
        activeStep={activeStep}
        onStepClick={scrollToPart}
      />

      <SetupDiet diet={diet} setDiet={setDiet} enabled={enabled.diet} onComplete={completePart} />

      <SetupPart part="people" icon={Users} label={t("numberOfPeople")}>
        <div className={`flex gap-2 ${disabledCls("people")}`}>
          {[1, 2, 3, 4].map((number) => (
            <button key={number} onClick={() => { setPeople(number); completePart("people"); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${people === number ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"}`}>
              {number} {number === 1 ? t("person") : t("people")}
            </button>
          ))}
        </div>
      </SetupPart>

      <SetupPart part="days" icon={CalendarDays} label={t("durationDays") || "Duration"}>
        <div className={`rounded-xl border border-border bg-card p-4 ${disabledCls("days")}`}>
          <DurationInput value={days} onChange={setDays} onCommit={() => completePart("days")} max={maxDays} />
        </div>
      </SetupPart>

      <SetupStores enabled={enabled.stores} stores={stores} toggleStore={toggleStore} diet={diet} macros={macros}
        postalCode={postalCode} setPostalCode={setPostalCode} selectedStoreLocations={selectedStoreLocations}
        onChangeStoreLocations={onChangeStoreLocations} cityCoords={cityCoords} onCityCoordsUsed={onCityCoordsUsed}
        onComplete={completePart} />

      <SetupPart part="macros" icon={Scale} label={t("macroTitle")} active={enabled.macros}
        onToggle={() => { toggleSetting("macros"); completePart("macros"); }}>
        <div className={`rounded-xl border border-border bg-card p-4 ${disabledCls("macros")}`}>
          <MacroRatioControl value={macros} onChange={setMacros} unset={!macrosSet} onCommit={() => completePart("macros")} />
        </div>
      </SetupPart>

      {disabledReason && (
        <p className="text-xs text-destructive text-center font-medium">{disabledReason}</p>
      )}
      <button
        id="pb-build"
        ref={buildRef}
        onClick={onBuild}
        disabled={buildBtnDisabled}
        className="scroll-mt-24 w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center text-primary-foreground disabled:opacity-60"
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