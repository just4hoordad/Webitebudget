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
import EasyModeToggle from "@/components/EasyModeToggle";
import PlanEasyEssentials from "@/components/builder/PlanEasyEssentials";
import { MAX_PLAN_DAYS } from "@/lib/freeTier";

export default function PlanSetup({ diet, setDiet, days, setDays, people, setPeople, stores, toggleStore, macros, setMacros, macrosSet, enabled, toggleSetting, onBuild, loading, postalCode, setPostalCode, selectedStoreLocations, onChangeStoreLocations, cityCoords, onCityCoordsUsed, easyMode, onEasyModeChange }) {
  const { t } = useLanguage();
  const { isPro } = useMonetization();
  const maxDays = MAX_PLAN_DAYS;
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
      <div className="bba-t bg-[#78a71b] text-[#111827] space-y-1.5">
        <span className="bba-sticker">
          <ShoppingCart className="h-3.5 w-3.5" /> {t("planBuilderBadge")}
        </span>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-balance text-[#111827]">{t("planBuilderTitle")}</h1>
        <p className="text-[#111827]/85 font-medium text-sm text-balance">{t("planBuilderSubtitle")}</p>
      </div>

      <div className="flex justify-center">
        <EasyModeToggle mode={easyMode ? "easy" : "detailed"} onChange={onEasyModeChange} />
      </div>
      {easyMode ? (
        <PlanEasyEssentials
          diet={diet}
          setDiet={setDiet}
          days={days}
          setDays={setDays}
          people={people}
          setPeople={setPeople}
          onBuild={onBuild}
          canBuild={!!diet && people > 0 && days >= 1 && stores.length > 0}
          maxDays={maxDays}
          onSwitchDetailed={() => onEasyModeChange("detailed")}
          stores={stores}
          toggleStore={toggleStore}
          isPro={isPro}
        />
      ) : (
      <>
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
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${disabledCls("people")}`}>
          {[1, 2, 3, 4].map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => { setPeople(number); completePart("people"); }}
              className={`py-3 px-3 text-sm bba-chip ${people === number ? "bba-chip-active" : ""}`}
            >
              {number} {number === 1 ? t("person") : t("people")}
            </button>
          ))}
        </div>
      </SetupPart>

      <SetupPart part="days" icon={CalendarDays} label={t("durationDays") || "Duration"}>
        <div className={`rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4 ${disabledCls("days")}`}>
          <DurationInput value={days} onChange={setDays} onCommit={() => completePart("days")} max={maxDays} />
        </div>
      </SetupPart>

      <SetupStores enabled={enabled.stores} stores={stores} toggleStore={toggleStore} diet={diet} macros={macros}
        postalCode={postalCode} setPostalCode={setPostalCode} selectedStoreLocations={selectedStoreLocations}
        onChangeStoreLocations={onChangeStoreLocations} cityCoords={cityCoords} onCityCoordsUsed={onCityCoordsUsed}
        onComplete={completePart} />

      <SetupPart part="macros" icon={Scale} label={t("macroTitle")} active={enabled.macros}
        onToggle={() => { toggleSetting("macros"); completePart("macros"); }}>
        <div className={`rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4 ${disabledCls("macros")}`}>
          <MacroRatioControl value={macros} onChange={setMacros} unset={!macrosSet} onCommit={() => completePart("macros")} />
        </div>
      </SetupPart>

      {disabledReason && (
        <div className="rounded-2xl bg-[#FF3E7F]/15 border-2 border-[#FF3E7F] px-4 py-2.5 text-xs text-destructive text-center font-heading font-extrabold">
          ⚠️ {disabledReason}
        </div>
      )}
      <button
        id="pb-build"
        ref={buildRef}
        onClick={onBuild}
        disabled={buildBtnDisabled}
        className="scroll-mt-24 w-full h-14 text-base bba-cta bg-[#FF3E7F] text-white flex items-center justify-center disabled:opacity-50"
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
      </>
      )}
    </div>
  );
}