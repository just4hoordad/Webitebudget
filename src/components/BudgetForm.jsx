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
import { ArrowRight, Leaf, Beef, Fish, Wheat, Tag, X, Scale, Microwave, Search, Wallet, MapPin, Package, TrendingDown } from "lucide-react";
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
  { id: "balanced", nameKey: "balanced", icon: Scale, descKey: "balancedDesc" },
  { id: "vegetarian", nameKey: "vegetarian", icon: Leaf, descKey: "vegetarianDesc" },
  { id: "vegan", nameKey: "vegan", icon: Leaf, descKey: "veganDesc" },
  { id: "high-protein", nameKey: "highProtein", icon: Beef, descKey: "highProteinDesc" },
  { id: "pescatarian", nameKey: "pescatarian", icon: Fish, descKey: "pescatarianDesc" },
  { id: "gluten-free", nameKey: "glutenFree", icon: Wheat, descKey: "glutenFreeDesc" },
  { id: "halal", nameKey: "halal", icon: null, descKey: "halalDesc" },
  { id: "frozen", nameKey: "frozenFoods", icon: Microwave, descKey: "frozenFoodsDesc" },
];

function SectionHeader({ icon: Icon, label, summary }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-heading font-semibold text-sm text-foreground leading-tight">{label}</p>
        {summary && <p className="text-xs text-muted-foreground truncate mt-0.5 group-data-[state=open]:hidden">{summary}</p>}
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
  const maxDays = isPro ? 30 : 7;
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
      const storesParam = selectedStoreLocations.length > 0
        ? selectedStoreLocations.map(s => s.name + (s.address ? ` (${s.address})` : "")).join(", ")
        : selectedStores.join(",");
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
          <h3 className="font-heading font-bold text-lg text-foreground px-1">{t("planYourMeals")}</h3>
          <Accordion type="single" collapsible value={openSection} onValueChange={selectSection} className="space-y-3">
        {/* ── Basics ── */}
        <AccordionItem id="step-basics" value="basics" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Wallet}
                label={t("basicsSection") || "Basics"}
                summary={`€${budget[0]} · ${days} ${t("days") || "days"} · ${t("headcountLabel") || "People"} ${people}${saleHunt ? " · 🏷️" : ""}`}
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-7 pt-1 ${dimCls("basics")}`}>
              {/* Budget Slider */}
              <div className="space-y-4">
                <BudgetInput value={budget[0]} onChange={withStepInput("basics", (value) => setBudget([value]))} label={t("monthlyBudget")} />
                <Slider
                  value={[budget[0]]}
                  onValueChange={withStepInput("basics", setBudget)}
                  max={2400}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>€10</span>
                  <span>{t("avgStudent")}</span>
                  <span>€2400</span>
                </div>
              </div>

              {/* Spending mode */}
              <SpendModeSelector value={spendMode} onChange={setSpendMode} />

              {/* Duration */}
              <DurationInput value={Number(days) || 1} onChange={setDays} label={t("durationDays") || "Duration"} max={maxDays} />

              {/* People */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{t("numberOfPeople")}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setPeople(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                        people === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {n} {n === 1 ? t("person") : t("people")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sale Hunt — savings toggle that belongs with the budget */}
              <div className="pt-2 mt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSaleHunt(!saleHunt)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                    saleHunt
                      ? "bg-primary/10 dark:bg-primary/15 border-primary/50"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    saleHunt ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    <Tag className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {t("saleHunt")}
                      {saleHunt && <TrendingDown className="h-3.5 w-3.5 text-primary" />}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">{t("saleHuntDesc")}</p>
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
          <h3 className="font-heading font-bold text-lg text-foreground px-1">{t("configurePreferences") || "Configure Preferences"}</h3>
          <Accordion type="single" collapsible value={openSection} onValueChange={selectSection} className="space-y-3">
        {/* ── Diet & Nutrition ── */}
        <AccordionItem id="step-diet" value="diet" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Leaf}
                label={t("dietSection") || "Diet"}
                summary={`${dietLabel} · ${computeDailyCalories(calorieMetrics) || 0} kcal · P${macros.protein}/C${macros.carbs}/F${macros.fats}${bio ? " · Bio" : ""}${allergies.length > 0 ? ` · ${allergies.length} ${t("allergiesTitle") || "allergies"}` : ""}`}
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-7 pt-1 ${dimCls("diet")}`}>
              {/* Diet Type */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {DIET_KEYS.map((diet) => {
                    const Icon = diet.icon;
                    const isSelected = selectedDiet === diet.id;
                    return (
                      <button
                        key={diet.id}
                        onClick={() => setSelectedDiet(diet.id)}
                        className={`flex flex-col items-start gap-1 p-4 rounded-xl text-left transition-all duration-200 border min-w-0 overflow-hidden ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-card text-foreground border-border shadow-sm hover:border-primary/40 hover:shadow-md"
                        }`}
                      >
                        <div className={`mb-1 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                          {diet.id === "halal" ? (
                            <span className="text-xl font-bold leading-none">حلال</span>
                          ) : Icon ? (
                            <Icon className="h-6 w-6" />
                          ) : null}
                        </div>
                        <span className={`font-heading font-semibold text-sm leading-tight break-words ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                          {t(diet.nameKey)}
                        </span>
                        <span className={`text-xs leading-tight break-words ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                    bio
                      ? "bg-primary/10 dark:bg-primary/15 border-primary/50"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    bio ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  }`}>
                    <Leaf className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t("bioTitle")}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{t("bioDesc")}</p>
                  </div>
                  <Switch checked={bio} onCheckedChange={setBio} aria-label={t("bioTitle")} onClick={(e) => e.stopPropagation()} />
                </button>
              </div>

              {/* Calorie Goal — computed from body metrics */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">{t("calorieGoal")}</label>
                <CalorieCalculator value={calorieMetrics} onChange={withStepInput("diet", setCalorieMetrics)} />
              </div>

              {/* Macronutrient Ratios */}
              <MacroRatioControl value={macros} onChange={setMacros} />

              {/* Allergies */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("allergiesTitle")}</label>
                <p className="text-xs text-muted-foreground">{t("allergiesDesc")}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allergies.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(tag, allergies, setAllergies)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder={t("allergiesPlaceholder")}
                    value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag(allergyInput, allergies, setAllergies, setAllergyInput)}
                  />
                  <button
                    onClick={() => addTag(allergyInput, allergies, setAllergies, setAllergyInput)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                  >{t("add")}</button>
                </div>
              </div>

            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Stores ── */}
        <AccordionItem id="step-stores" value="stores" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={MapPin}
                label={t("storesSection") || "Stores"}
                summary={storeNamesSummary || t("noStoresSelected")}
              />
            </AccordionTrigger>
          </div>
          <AccordionContent>
            <div className={`space-y-3 pt-1 ${dimCls("stores")}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{t("preferredStores")}</label>
                <StoreMapPicker
                  selectedStoreLocations={selectedStoreLocations}
                  onChangeStoreLocations={setSelectedStoreLocations}
                  selectedChains={selectedStores}
                  onToggleChain={toggleStore}
                  cityCoords={cityCoords}
                  onCityCoordsUsed={() => setCityCoords(null)}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("mapPickerHelper")}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {t("maxStoresHint") || "Up to 4 stores"}
              </p>
              <StoreSpeedHint />
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
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
                    className="flex-1 min-w-0 border border-border rounded-xl px-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={handleLocationSubmit}
                    className="flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-all duration-200"
                  >
                    <Search className="h-4 w-4" />
                    {t("search")}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t("plzHelper")}</p>
              </div>
              {selectedStoreLocations.length > 0 ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-primary mb-2">📍 {t("pinnedStores")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStoreLocations.map((s) => (
                      <span key={s.id} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium">
                        {s.name}
                        {s.address && <span className="opacity-70 text-xs">· {s.address}</span>}
                      </span>
                    ))}
                  </div>
                  <button onClick={() => setSelectedStoreLocations([])} className="text-xs text-muted-foreground hover:text-destructive mt-2 underline">
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
                          onClick={() => toggleStore(store.id)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 inline-flex items-center gap-1.5 ${
                            isSelected
                              ? store.color + " border-current shadow-sm"
                              : "bg-card text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          <span>{store.name}</span>
                          {discount > 0 && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                                isSelected
                                  ? "bg-current/15 text-current"
                                  : "bg-primary/10 text-primary border border-primary/30"
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
                   <p className="text-xs font-medium text-muted-foreground">{t("drugstores") || "Drugstores"}</p>
                   <div className="flex flex-wrap gap-2">
                     {DRUGSTORES.map((store) => {
                       const discount = getStoreDiscount(store.id, selectedDiet, macros);
                       const isSelected = selectedStores.includes(store.id);
                       return (
                         <button
                           key={store.id}
                           onClick={() => toggleStore(store.id)}
                           className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 inline-flex items-center gap-1.5 ${
                             isSelected
                               ? store.color + " border-current shadow-sm"
                               : "bg-card text-muted-foreground border-border hover:border-primary/40"
                           }`}
                         >
                           <span>{store.name}</span>
                           {discount > 0 && (
                             <span
                               className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                                 isSelected
                                   ? "bg-current/15 text-current"
                                   : "bg-primary/10 text-primary border border-primary/30"
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
                   <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
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
        <AccordionItem id="step-pantry" value="pantry" className="scroll-mt-24 border border-border rounded-2xl px-5 bg-card">
          <div className="flex items-center gap-2 py-4">
            <AccordionTrigger className="group flex-1 hover:no-underline py-0">
              <SectionHeader
                icon={Package}
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
      <div ref={generateRef} className="space-y-2">
        {!canGenerate && (
          <p className="text-xs text-destructive text-center font-medium">
            {!(budget[0] > 0)
              ? "Please enter your monthly budget"
              : enabled.diet && !metricsFilled
              ? "Please enter your height, weight and age in the Diet section"
              : "Please select at least one store"}
          </p>
        )}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
          size="lg"
        >
          {t("generateBtn")}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
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