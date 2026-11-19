import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BudgetInput from "@/components/BudgetInput";
import DurationInput from "@/components/DurationInput";
import SpendModeSelector from "@/components/SpendModeSelector";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ArrowRight, Leaf, Beef, Fish, Wheat, Tag, X, Scale, Microwave, Search, Wallet, MapPin, Package, TrendingDown, Check, Sparkles } from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";
import { getStoreDiscount } from "@/lib/storeDiscounts";
import StoreSpeedHint from "@/components/StoreSpeedHint";
import PantryManager from "@/components/PantryManager";
import MacroRatioControl from "@/components/MacroRatioControl";
import CalorieCalculator, { computeDailyCalories } from "@/components/CalorieCalculator";
import StepProgress from "@/components/StepProgress";
import StickyGenerateBar from "@/components/StickyGenerateBar";
import useGuidedAccordion from "@/components/forms/useGuidedAccordion";
import EasyModeToggle from "@/components/EasyModeToggle";
import BudgetEasyEssentials from "@/components/builder/BudgetEasyEssentials";
import { MAX_PLAN_DAYS } from "@/lib/freeTier";


const GROCERY_STORES = [
  { id: "aldi", name: "Aldi", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "lidl", name: "Lidl", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "rewe", name: "REWE", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "edeka", name: "Edeka", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "penny", name: "Penny", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "netto", name: "Netto", color: "bg-gray-100 text-gray-700 border-gray-200" },
  { id: "kaufland", name: "Kaufland", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "norma", name: "Norma", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "globus", name: "Globus", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { id: "tegut", name: "Tegut", color: "bg-red-100 text-red-600 border-red-200" },
];

const DRUGSTORES = [
  { id: "dm", name: "dm", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "rossmann", name: "Rossmann", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "müller", name: "Müller", color: "bg-violet-100 text-violet-700 border-violet-200" },
];

const DIET_KEYS = [
  { id: "balanced", nameKey: "balanced", icon: Scale, descKey: "balancedDesc", badge: "bg-[#78a71b]" },
  { id: "vegetarian", nameKey: "vegetarian", icon: Leaf, descKey: "vegetarianDesc", badge: "bg-[#34D399]" },
  { id: "vegan", nameKey: "vegan", icon: Leaf, descKey: "veganDesc", badge: "bg-[#A3E635]" },
  { id: "high-protein", nameKey: "highProtein", icon: Beef, descKey: "highProteinDesc", badge: "bg-[#FF8FB5]" },
  { id: "pescatarian", nameKey: "pescatarian", icon: Fish, descKey: "pescatarianDesc", badge: "bg-[#7DD3FC]" },
  { id: "gluten-free", nameKey: "glutenFree", icon: Wheat, descKey: "glutenFreeDesc", badge: "bg-[#FFB020]" },
  { id: "halal", nameKey: "halal", icon: null, descKey: "halalDesc", badge: "bg-[#C084FC]" },
  { id: "frozen", nameKey: "frozenFoods", icon: Microwave, descKey: "frozenFoodsDesc", badge: "bg-[#60A5FA]" },
];

function SectionHeader({ icon: Icon, label, summary, badgeBg = "bg-[#78a71b]" }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
      <div className={`h-9 w-9 rounded-xl ${badgeBg} border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]`}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-heading font-black text-base text-foreground leading-tight">{label}</p>
        {summary && <p className="text-xs font-medium text-muted-foreground truncate mt-0.5 group-data-[state=open]:hidden">{summary}</p>}
      </div>
    </div>
  );
}

function SectionToggle({ active, onToggle, label }) {
  return (
    <div className="shrink-0">
      <Switch
        checked={active}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${label}`}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function BudgetForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isPro } = useMonetization();
  const maxDays = MAX_PLAN_DAYS;
  const [budget, setBudget] = useState([0]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedStoreLocations, setSelectedStoreLocations] = useState([]); // specific pinned store objects
  const [selectedDiet, setSelectedDiet] = useState("balanced");
  const [calorieMetrics, setCalorieMetrics] = useState({
    height: "",
    weight: "",
    age: "",
    sex: "male",
    activity: "moderate",
    goal: "maintain",
  });
  const [people, setPeople] = useState(1);
  const [days, setDays] = useState(1);
  const [saleHunt, setSaleHunt] = useState(false);
  const [bio, setBio] = useState(false);
  const [spendMode, setSpendMode] = useState("balanced"); // "balanced" | "save" | "maximize"
  const [junkPercent, setJunkPercent] = useState([0]);
  const [macros, setMacros] = useState({ protein: 30, carbs: 40, fats: 30 });
  const [proteinSnackBudget, setProteinSnackBudget] = useState(0);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergies, setAllergies] = useState([]);

  const [pantryItems, setPantryItems] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityCoords, setCityCoords] = useState(null);
  const [postalCode, setPostalCode] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const [enabled, setEnabled] = useState({ basics: true, diet: true, stores: true, lifestyle: true, pantry: true });
  const toggleSection = (key) => setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  const dimCls = (key) => (enabled[key] ? "" : "opacity-40 pointer-events-none");

  const [easyMode, setEasyMode] = useState(() => localStorage.getItem("bb_budget_easy") !== "detailed");
  const handleEasyChange = (v) => { setEasyMode(v === "easy"); try { localStorage.setItem("bb_budget_easy", v); } catch { /* ignore */ } };

  const [visited, setVisited] = useState({ diet: false, pantry: false });

  const formRef = useRef(null);
  const generateRef = useRef(null);
  const [formInView, setFormInView] = useState(false);
  const [genInView, setGenInView] = useState(false);

  useEffect(() => {
    const f = formRef.current;
    const g = generateRef.current;
    if (!f || !g) return;
    const fObs = new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting), { threshold: 0.05 });
    const gObs = new IntersectionObserver(([entry]) => setGenInView(entry.isIntersecting), { threshold: 0.05 });
    fObs.observe(f);
    gObs.observe(g);
    return () => { fObs.disconnect(); gObs.disconnect(); };
  }, []);

  const showStickyGenerate = formInView && !genInView;

  const addTag = (value, list, setList, setInput) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput("");
  };

  const removeTag = (item, list, setList) => setList(list.filter(i => i !== item));

  const handleCitySearch = async (val) => {
    const query = (val ?? citySearch).trim();
    if (!query) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setCityCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lng) });
      }
    } catch (e) {
      // silently fail
    }
  };

  const handleLocationSubmit = () => {
    const val = locationInput.trim();
    if (!val) return;
    if (/^\d{5}$/.test(val)) {
      setPostalCode(val);
    } else {
      setPostalCode("");
      handleCitySearch(val);
    }
  };

  const toggleStore = (storeId) => {
    setSelectedStores((prev) => {
      if (prev.includes(storeId)) return prev.filter((s) => s !== storeId);
      if (prev.length >= 4) return prev;
      return [...prev, storeId];
    });
  };

  const metricsFilled = ["height", "weight", "age"].every((k) => Number(calorieMetrics[k]) > 0);
  const hasAnyStore = selectedStoreLocations.length > 0 || selectedStores.length > 0;
  const effEnabled = easyMode ? { basics: true, diet: true, stores: true, pantry: false } : enabled;
  const canGenerate = easyMode ? (budget[0] > 0 && hasAnyStore) : (budget[0] > 0 && (!enabled.diet || metricsFilled) && (!enabled.stores || hasAnyStore));

  // Restore the logged-in user's previous inputs
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      if (!ok) return;
      const p = (await base44.auth.me())?.budgetFormPrefs;
      if (!p) return;
      if (p.budget) setBudget([p.budget]);
      if (p.days) setDays(p.days);
      if (p.people) setPeople(p.people);
      if (p.selectedDiet) setSelectedDiet(p.selectedDiet);
      if (p.calorieMetrics) setCalorieMetrics(p.calorieMetrics);
      if (p.macros) setMacros(p.macros);
      if (p.allergies) setAllergies(p.allergies);
      if (p.selectedStores) setSelectedStores(p.selectedStores);
      if (p.selectedStoreLocations) setSelectedStoreLocations(p.selectedStoreLocations);
      if (p.postalCode) { setPostalCode(p.postalCode); setLocationInput(p.postalCode); }
      setBio(!!p.bio);
      setSaleHunt(!!p.saleHunt);
      if (p.spendMode) setSpendMode(p.spendMode);
    });
  }, []);

  const handleGenerate = () => {
    const params = new URLSearchParams();
    if (effEnabled.basics) {
      params.set("budget", budget[0]);
      params.set("days", days);
      params.set("people", people);
      const dailyKcal = computeDailyCalories(calorieMetrics) || 2000;
      params.set("calories", dailyKcal * people);
      params.set("goal", calorieMetrics.goal);
      params.set("spendMode", spendMode);
      ["height", "weight", "age", "sex", "activity"].forEach((k) => calorieMetrics[k] && params.set(k, calorieMetrics[k]));
    }
    if (effEnabled.diet) {
      params.set("diet", selectedDiet);
      params.set("macros", `${macros.protein},${macros.carbs},${macros.fats}`);
      params.set("allergies", allergies.join(","));
    }
    if (effEnabled.stores) {
      const storesParam = easyMode
        ? selectedStores.map(id => [...GROCERY_STORES, ...DRUGSTORES].find(s => s.id === id)?.name || id).join(",")
        : selectedStoreLocations.length > 0
          ? selectedStoreLocations.map(s => s.name + (s.address ? ` (${s.address})` : "")).join(", ")
          : selectedStores.map(id => [...GROCERY_STORES, ...DRUGSTORES].find(s => s.id === id)?.name || id).join(",");
      params.set("stores", storesParam);
      params.set("plz", postalCode);
      params.set("bio", bio);
      params.set("saleHunt", saleHunt);
    }
    if (effEnabled.pantry) {
      params.set("owned", pantryItems.map(p => p.name + (p.amount && p.amount !== "some" ? ` (${p.amount})` : "")).join(","));
    }
    base44.auth.isAuthenticated().then((ok) => ok && base44.auth.updateMe({
      budgetFormPrefs: { budget: budget[0], days, people, selectedDiet, calorieMetrics, macros, allergies, selectedStores, selectedStoreLocations, postalCode, bio, saleHunt, spendMode },
    }));
    navigate(`/plan-review?${params.toString()}`);
  };

  const dietLabel = t(DIET_KEYS.find(d => d.id === selectedDiet)?.nameKey);
  const storeCount = selectedStoreLocations.length > 0 ? selectedStoreLocations.length : selectedStores.length;
  const ALL_STORES = [...GROCERY_STORES, ...DRUGSTORES];
  const storeNamesSummary = selectedStoreLocations.length > 0
    ? selectedStoreLocations.map(s => s.name).join(", ")
    : selectedStores.map(id => ALL_STORES.find(s => s.id === id)?.name || id).join(", ");

  const { openSection, selectSection, withStepInput } = useGuidedAccordion({
    steps: ["basics", "diet", "stores", "pantry"],
    completed: {
      basics: budget[0] > 0,
      diet: !enabled.diet || metricsFilled,
      stores: !enabled.stores || storeCount > 0,
      pantry: true,
    },
    formRef,
    prefix: "step-",
    onOpen: (key) => setVisited((previous) => ({ ...previous, [key]: true })),
  });

  return (
    <div ref={formRef} className="space-y-5">
      <div className="flex justify-center pb-1">
        <EasyModeToggle mode={easyMode ? "easy" : "detailed"} onChange={handleEasyChange} />
      </div>
      {easyMode ? (
        <BudgetEasyEssentials
          budget={budget}
          setBudget={setBudget}
          days={days}
          setDays={setDays}
          people={people}
          setPeople={setPeople}
          onGenerate={handleGenerate}
          canGenerate={budget[0] > 0 && hasAnyStore}
          maxDays={maxDays}
          onSwitchDetailed={() => handleEasyChange("detailed")}
          selectedStores={selectedStores}
          setSelectedStores={setSelectedStores}
          isPro={isPro}
        />
      ) : (
      <>
      <StepProgress
        steps={[
          { key: "basics", label: t("basicsSection") || "Basics", required: true, done: budget[0] > 0 },
          { key: "diet", label: t("dietSection") || "Diet", required: enabled.diet, done: !enabled.diet || metricsFilled },
          { key: "stores", label: t("storesSection") || "Stores", required: enabled.stores, done: !enabled.stores || storeCount > 0 },
          { key: "pantry", label: t("pantrySection") || "Pantry", done: visited.pantry },
        ]}
        activeStep={openSection}
        onStepClick={selectSection}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column - Plan Your Meals */}
        <div className="space-y-3">
          <h3 className="font-heading font-black text-lg text-foreground px-1">{t("planYourMeals")}</h3>
          <Accordion type="single" collapsible value={openSection} onValueChange={selectSection} className="space-y-3">
        {/* ── Basics ── */}
        <AccordionItem id="step-basics" value="basics" className="scroll-mt-24 bba-t px-5 py-0 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Wallet}
                badgeBg="bg-[#FFB020]"
                label={t("basicsSection") || "Basics"}
                summary={`€${budget[0]} · ${days} ${t("days") || "days"} · ${t("headcountLabel") || "People"} ${people}${saleHunt ? " · 🏷️" : ""}`}
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-6 pt-1 ${dimCls("basics")}`}>
              {/* Budget Slider */}
              <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4 space-y-4">
                <BudgetInput value={budget[0]} onChange={withStepInput("basics", (value) => setBudget([value]))} label={t("monthlyBudget")} />
                <Slider
                  value={[budget[0]]}
                  onValueChange={withStepInput("basics", setBudget)}
                  max={2400}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs font-heading font-bold text-muted-foreground">
                  <span>€10</span>
                  <span>{t("avgStudent")}</span>
                  <span>€2400</span>
                </div>
              </div>

              {/* Spending mode */}
              <SpendModeSelector value={spendMode} onChange={setSpendMode} />

              {/* Duration */}
              <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4">
                <DurationInput value={Number(days) || 1} onChange={setDays} label={t("durationDays") || "Duration"} max={maxDays} />
              </div>

              {/* People */}
              <div className="space-y-2.5">
                <label className="text-sm font-heading font-black text-foreground">{t("numberOfPeople")}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPeople(n)}
                      className={`py-2.5 px-2 text-xs sm:text-sm bba-chip ${people === n ? "bba-chip-active" : ""}`}
                    >
                      {n} {n === 1 ? t("person") : t("people")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sale Hunt — savings toggle that belongs with the budget */}
              <div className="pt-2 border-t-2 border-dashed border-[#111827]/20 dark:border-white/20">
                <button
                  type="button"
                  onClick={() => setSaleHunt(!saleHunt)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-[#111827] dark:border-[#78a71b] shadow-[2.5px_2.5px_0_#111827] transition-all text-left ${
                    saleHunt
                      ? "bg-[#FFB020] text-[#111827]"
                      : "bg-card text-foreground hover:bg-[#F3F8E6] hover:text-[#111827]"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] text-[#111827]">
                    <Tag className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading font-black flex items-center gap-1.5">
                      {t("saleHunt")}
                      {saleHunt && <TrendingDown className="h-3.5 w-3.5" />}
                    </p>
                    <p className={`text-xs font-medium leading-snug ${saleHunt ? "text-[#111827]/80" : "text-muted-foreground"}`}>{t("saleHuntDesc")}</p>
                  </div>
                  <Switch checked={saleHunt} onCheckedChange={setSaleHunt} aria-label={t("saleHunt")} onClick={(e) => e.stopPropagation()} />
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
          </Accordion>
        </div>

        {/* Right column - Configure Preferences */}
        <div className="space-y-3">
          <h3 className="font-heading font-black text-lg text-foreground px-1">{t("configurePreferences") || "Configure Preferences"}</h3>
          <Accordion type="single" collapsible value={openSection} onValueChange={selectSection} className="space-y-3">
        {/* ── Diet & Nutrition ── */}
        <AccordionItem id="step-diet" value="diet" className="scroll-mt-24 bba-t px-5 py-0 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Leaf}
                badgeBg="bg-[#78a71b]"
                label={t("dietSection") || "Diet"}
                summary={`${dietLabel} · ${computeDailyCalories(calorieMetrics) || 0} kcal · P${macros.protein}/C${macros.carbs}/F${macros.fats}${bio ? " · Bio" : ""}${allergies.length > 0 ? ` · ${allergies.length} ${t("allergiesTitle") || "allergies"}` : ""}`}
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-6 pt-1 ${dimCls("diet")}`}>
              {/* Diet Type */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {DIET_KEYS.map((diet) => {
                    const Icon = diet.icon;
                    const isSelected = selectedDiet === diet.id;
                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => setSelectedDiet(diet.id)}
                        className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-2xl text-left border-[2.5px] border-[#111827] dark:border-[#78a71b] min-w-0 overflow-hidden transition-all ${
                          isSelected
                            ? "bg-[#78a71b] text-[#111827] shadow-[4px_4px_0_#111827] -translate-y-0.5"
                            : "bg-card text-foreground shadow-[2.5px_2.5px_0_#111827] hover:-translate-y-0.5"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`h-9 w-9 rounded-xl ${isSelected ? "bg-white" : diet.badge} border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] flex items-center justify-center text-[#111827]`}>
                            {diet.id === "halal" ? (
                              <span className="text-sm font-black leading-none">حلال</span>
                            ) : Icon ? (
                              <Icon className="h-4 w-4" />
                            ) : null}
                          </div>
                          {isSelected && (
                            <span className="h-5 w-5 rounded-full bg-[#111827] text-white flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <span className={`font-heading font-black text-sm leading-tight break-words mt-1 ${isSelected ? "text-[#111827]" : "text-foreground"}`}>
                          {t(diet.nameKey)}
                        </span>
                        <span className={`text-xs font-medium leading-tight break-words ${isSelected ? "text-[#111827]/80" : "text-muted-foreground"}`}>
                          {t(diet.descKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bio / Organic — preference toggle that belongs with diet choices */}
                <button
                  type="button"
                  onClick={() => setBio(!bio)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-[#111827] dark:border-[#78a71b] shadow-[2.5px_2.5px_0_#111827] transition-all text-left ${
                    bio
                      ? "bg-[#78a71b] text-[#111827]"
                      : "bg-card text-foreground hover:bg-[#F3F8E6] hover:text-[#111827]"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] text-[#111827]">
                    <Leaf className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading font-black">{t("bioTitle")}</p>
                    <p className={`text-xs font-medium leading-snug ${bio ? "text-[#111827]/80" : "text-muted-foreground"}`}>{t("bioDesc")}</p>
                  </div>
                  <Switch checked={bio} onCheckedChange={setBio} aria-label={t("bioTitle")} onClick={(e) => e.stopPropagation()} />
                </button>
              </div>

              {/* Calorie Goal — computed from body metrics */}
              <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4 space-y-3">
                <label className="text-sm font-heading font-black text-foreground">{t("calorieGoal")}</label>
                <CalorieCalculator value={calorieMetrics} onChange={withStepInput("diet", setCalorieMetrics)} />
              </div>

              {/* Macronutrient Ratios */}
              <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4">
                <MacroRatioControl value={macros} onChange={setMacros} />
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <label className="text-sm font-heading font-black text-foreground">{t("allergiesTitle")}</label>
                <p className="text-xs font-medium text-muted-foreground">{t("allergiesDesc")}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allergies.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 bg-[#FF8FB5] text-[#111827] border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] text-xs font-heading font-extrabold px-3 py-1 rounded-full">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag, allergies, setAllergies)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 min-w-0 border-2 border-[#111827] dark:border-[#78a71b] rounded-xl px-3 py-2 text-sm font-semibold bg-card shadow-[2px_2px_0_#111827] focus:outline-none focus:ring-2 focus:ring-[#78a71b]"
                    placeholder={t("allergiesPlaceholder")}
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag(allergyInput, allergies, setAllergies, setAllergyInput)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addTag(allergyInput, allergies, setAllergies, setAllergyInput)}
                    className="h-10 px-4"
                  >{t("add")}</Button>
                </div>
              </div>

            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Stores ── */}
        <AccordionItem id="step-stores" value="stores" className="scroll-mt-24 bba-t px-5 py-0 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={MapPin}
                badgeBg="bg-[#FF8FB5]"
                label={t("storesSection") || "Stores"}
                summary={storeNamesSummary || t("noStoresSelected")}
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-3.5 pt-1 ${dimCls("stores")}`}>
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-heading font-black text-foreground">{t("preferredStores")}</label>
                <StoreMapPicker
                  selectedStoreLocations={selectedStoreLocations}
                  onChangeStoreLocations={setSelectedStoreLocations}
                  selectedChains={selectedStores}
                  onToggleChain={toggleStore}
                  cityCoords={cityCoords}
                  onCityCoordsUsed={() => setCityCoords(null)}
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">{t("mapPickerHelper")}</p>
              <p className="text-xs font-heading font-bold text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FFB020] border border-[#111827] shrink-0" />
                {t("maxStoresHint") || "Up to 4 stores"}
              </p>
              <StoreSpeedHint />
              <div className="space-y-2">
                <label className="text-sm font-heading font-black text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> {t("plzLabel") || "Postal code (PLZ) or city"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocationInput(val);
                      if (/^\d{5}$/.test(val)) setPostalCode(val);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLocationSubmit()}
                    placeholder={t("plzPlaceholder") || "e.g. 10115 or Berlin"}
                    className="flex-1 min-w-0 border-2 border-[#111827] dark:border-[#78a71b] rounded-xl px-4 py-2 text-sm font-semibold bg-card shadow-[2px_2px_0_#111827] focus:outline-none focus:ring-2 focus:ring-[#78a71b]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLocationSubmit}
                    className="h-10 px-3.5 shrink-0 gap-1.5"
                  >
                    <Search className="h-4 w-4" />
                    {t("search")}
                  </Button>
                </div>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">{t("plzHelper")}</p>
              </div>
              {selectedStoreLocations.length > 0 ? (
                <div className="bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] rounded-2xl px-4 py-3 shadow-[2px_2px_0_#111827]">
                  <p className="text-xs font-heading font-black text-foreground mb-2">📍 {t("pinnedStores")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStoreLocations.map((s) => (
                      <span key={s.id} className="flex items-center gap-1 text-xs bg-[#78a71b] text-[#111827] border-2 border-[#111827] px-3 py-1 rounded-full font-heading font-extrabold">
                        {s.name}
                        {s.address && <span className="opacity-75 text-xs">· {s.address}</span>}
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => setSelectedStoreLocations([])} className="text-xs font-heading font-bold text-muted-foreground hover:text-destructive mt-2 underline">
                    {t("clearPinnedStores")}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                     {GROCERY_STORES.map((store) => {
                      const discount = getStoreDiscount(store.id, selectedDiet, macros);
                      const isSelected = selectedStores.includes(store.id);
                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => toggleStore(store.id)}
                          className={`px-3.5 py-2 text-sm inline-flex items-center gap-1.5 bba-chip ${
                            isSelected ? "bba-chip-active" : ""
                          }`}
                        >
                          <span>{store.name}</span>
                          {discount > 0 && (
                            <span
                              className={`text-[10px] font-heading font-black px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border border-[#111827] ${
                                isSelected
                                  ? "bg-[#FFB020] text-[#111827]"
                                  : "bg-[#F3F8E6] text-[#111827]"
                              }`}
                              title={`Estimated ~${discount}% cheaper than mid-range supermarkets (REWE/Edeka) on ${selectedDiet || "staple"} essentials`}
                            >
                              <Tag className="h-2.5 w-2.5" /> -{discount}%
                            </span>
                          )}
                        </button>
                      );
                     })}
                   </div>
                   <p className="text-xs font-heading font-extrabold uppercase tracking-wider text-muted-foreground pt-1">{t("drugstores") || "Drugstores"}</p>
                   <div className="flex flex-wrap gap-2">
                     {DRUGSTORES.map((store) => {
                       const discount = getStoreDiscount(store.id, selectedDiet, macros);
                       const isSelected = selectedStores.includes(store.id);
                       return (
                         <button
                           key={store.id}
                           type="button"
                           onClick={() => toggleStore(store.id)}
                           className={`px-3.5 py-2 text-sm inline-flex items-center gap-1.5 bba-chip ${
                             isSelected ? "bba-chip-active" : ""
                           }`}
                         >
                           <span>{store.name}</span>
                           {discount > 0 && (
                             <span
                               className={`text-[10px] font-heading font-black px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border border-[#111827] ${
                                 isSelected
                                   ? "bg-[#FFB020] text-[#111827]"
                                   : "bg-[#F3F8E6] text-[#111827]"
                               }`}
                               title={`Estimated ~${discount}% cheaper than mid-range supermarkets (REWE/Edeka) on ${selectedDiet || "staple"} essentials`}
                             >
                               <Tag className="h-2.5 w-2.5" /> -{discount}%
                             </span>
                           )}
                         </button>
                       );
                     })}
                   </div>
                   <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 px-1">
                     <TrendingDown className="h-3.5 w-3.5 text-primary shrink-0" />
                     <span>
                       {t("storeDiscountExplanation") || "Estimated % cheaper than mid-range supermarkets (REWE/Edeka) on a typical basket — actual savings depend on the specific items in your generated list"}
                     </span>
                   </p>
                </div>
              )}


            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Pantry ── */}
        <AccordionItem id="step-pantry" value="pantry" className="scroll-mt-24 bba-t px-5 py-0 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Package}
                badgeBg="bg-[#7DD3FC]"
                label={t("pantrySection") || "Pantry"}
                summary={pantryItems.length > 0 ? `${pantryItems.length} ${t("items") || "items"}` : (t("pantryEmptySummary") || "Add staples you already have")}
              />
            </AccordionTrigger>
            <SectionToggle active={enabled.pantry} onToggle={() => toggleSection("pantry")} label={t("pantrySection") || "Pantry"} />
          </div>
          <AccordionContent>
            <div className={`pt-1 ${dimCls("pantry")}`}>
              <PantryManager onPantryChange={setPantryItems} />
            </div>
          </AccordionContent>
        </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Generate Button */}
      <div ref={generateRef} className="space-y-2.5">
        {!canGenerate && (
          <div className="rounded-2xl bg-[#FF3E7F]/15 border-2 border-[#FF3E7F] px-4 py-2.5 text-xs text-destructive text-center font-heading font-extrabold">
            ⚠️ {!(budget[0] > 0)
              ? "Please enter your monthly budget"
              : enabled.diet && !metricsFilled
              ? "Please enter your height, weight and age in the Diet section"
              : "Please select at least one store"}
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full h-14 text-base bba-cta bg-[#FF3E7F] text-white flex items-center justify-center disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {t("generateBtn")}
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>

      {/* Sticky generate bar — mobile only, shown while the inline button is off-screen */}
      <StickyGenerateBar
        visible={showStickyGenerate}
        onClick={handleGenerate}
        disabled={!canGenerate}
        label={t("generateBtn")}
      />
      </>
      )}
    </div>
  );
}