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
import { ArrowRight, Tag, X, Search, Wallet, MapPin, Package, TrendingDown, Leaf } from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";
import { getStoreDiscount } from "@/lib/storeDiscounts";
import StoreSpeedHint from "@/components/StoreSpeedHint";
import PantryManager from "@/components/PantryManager";
import MacroRatioControl from "@/components/MacroRatioControl";
import CalorieCalculator, { computeDailyCalories } from "@/components/CalorieCalculator";
import StickyGenerateBar from "@/components/StickyGenerateBar";
import useGuidedAccordion from "@/components/forms/useGuidedAccordion";


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
  { id: "balanced", nameKey: "balanced", icon: null, descKey: "balancedDesc" },
  { id: "vegetarian", nameKey: "vegetarian", icon: Leaf, descKey: "vegetarianDesc" },
  { id: "vegan", nameKey: "vegan", icon: Leaf, descKey: "veganDesc" },
  { id: "high-protein", nameKey: "highProtein", icon: null, descKey: "highProteinDesc" },
  { id: "pescatarian", nameKey: "pescatarian", icon: null, descKey: "pescatarianDesc" },
  { id: "gluten-free", nameKey: "glutenFree", icon: null, descKey: "glutenFreeDesc" },
  { id: "halal", nameKey: "halal", icon: null, descKey: "halalDesc" },
  { id: "frozen", nameKey: "frozenFoods", icon: null, descKey: "frozenFoodsDesc" },
];

const HERO_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/5f006f036_generated_399beae0.jpg";

export default function BudgetForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isPro, openPricing } = useMonetization();
  const L = (k, fb) => { const v = t(k); return v === k ? fb : v; };
  const maxDays = isPro ? 30 : 7;
  const [budget, setBudget] = useState([0]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedStoreLocations, setSelectedStoreLocations] = useState([]);
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
  const [spendMode, setSpendMode] = useState("balanced");
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
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((s) => s !== storeId)
        : [...prev, storeId]
    );
  };

  const metricsFilled = ["height", "weight", "age"].every((k) => Number(calorieMetrics[k]) > 0);
  const hasAnyStore = selectedStoreLocations.length > 0 || selectedStores.length > 0;
  const canGenerate = budget[0] > 0 && (!enabled.diet || metricsFilled) && (!enabled.stores || hasAnyStore);

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
    if (enabled.basics) {
      params.set("budget", budget[0]);
      params.set("days", days);
      params.set("people", people);
      const dailyKcal = computeDailyCalories(calorieMetrics) || 2000;
      params.set("calories", dailyKcal * people);
      params.set("goal", calorieMetrics.goal);
      params.set("spendMode", spendMode);
      ["height", "weight", "age", "sex", "activity"].forEach((k) => calorieMetrics[k] && params.set(k, calorieMetrics[k]));
    }
    if (enabled.diet) {
      params.set("diet", selectedDiet);
      params.set("macros", `${macros.protein},${macros.carbs},${macros.fats}`);
      params.set("allergies", allergies.join(","));
    }
    if (enabled.stores) {
      const storesParam = selectedStoreLocations.length > 0
        ? selectedStoreLocations.map(s => s.name + (s.address ? ` (${s.address})` : "")).join(", ")
        : selectedStores.join(",");
      params.set("stores", storesParam);
      params.set("plz", postalCode);
      params.set("bio", bio);
      params.set("saleHunt", saleHunt);
    }
    if (enabled.pantry) {
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

  const stepDone = {
    basics: budget[0] > 0,
    diet: !enabled.diet || metricsFilled,
    stores: !enabled.stores || storeCount > 0,
    pantry: visited.pantry,
  };
  const stepLabels = [
    { key: "basics", label: t("basicsSection") || "Basics" },
    { key: "diet", label: t("dietSection") || "Diet" },
    { key: "stores", label: t("storesSection") || "Stores" },
    { key: "pantry", label: t("pantrySection") || "Pantry" },
  ];

  return (
    <div ref={formRef}>
      {/* Hero */}
      <div className="relative min-h-[260px] flex flex-col gap-3 p-7 overflow-hidden rounded-2xl border border-border">
        <img src={HERO_IMG} alt="Fresh ingredients on sage linen" className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/35 to-foreground/82 z-[1]" />
        <div className="relative z-[2] flex flex-col gap-3 mt-auto">
          <h1 className="text-[34px] leading-[1.05] text-white font-heading font-bold tracking-tight animate-rise">{L("budgetBuilderTitle", "Budget Builder")}</h1>
          <h2 className="text-[15px] leading-[1.3] text-white/90 font-medium animate-rise" style={{ animationDelay: "0.15s" }}>{L("planBuilderSubtitle", "Plan Builder")}</h2>
          <div className="flex flex-wrap gap-1.5 animate-rise" style={{ animationDelay: "0.3s" }}>
            {stepLabels.map((s) => (
              <span key={s.key} className="text-xs leading-tight px-2.5 py-1.5 rounded-full bg-white/18 border border-white/35 text-white font-semibold">{s.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 pt-5 pb-6 flex flex-col gap-3.5">
        <h3 className="text-xl leading-tight font-bold text-primary px-1">{t("planYourMeals")}</h3>

        {/* Progress pills */}
        <div className="flex gap-1.5">
          {stepLabels.map((s) => {
            const done = stepDone[s.key];
            const active = openSection === s.key;
    return (
      <button
        key={s.key}
        type="button"
        onClick={() => selectSection(s.key)}
        className={`flex-1 text-center text-[11px] font-semibold leading-tight py-1.5 px-0.5 rounded-full transition-colors ${
          done
            ? "bg-primary text-primary-foreground"
            : active
            ? "bg-card border border-primary text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {s.label}
      </button>
    );
          })}
        </div>

        {/* Step 1: Basics */}
        <div id="step-basics" className="scroll-mt-24 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
          <div className="flex gap-3 items-center">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">1</span>
            <div>
              <p className="text-[15px] leading-tight font-bold text-foreground">{t("basicsSection") || "Basics"}</p>
              <p className="text-xs leading-tight text-muted-foreground mt-0.5">€{budget[0]} · {days} {t("days") || "days"} · {t("headcountLabel") || "People"} {people}{saleHunt ? " · 🏷️" : ""}</p>
            </div>
          </div>

          <div className={`space-y-5 ${dimCls("basics")}`}>
            {/* Budget */}
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-foreground">{t("monthlyBudget")}</p>
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
            <DurationInput value={Number(days) || 1} onChange={setDays} label={t("durationDays") || "Duration"} maxDays={maxDays} isPro={isPro} onUpgrade={openPricing} />

            {/* People */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground">{t("numberOfPeople")}</p>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPeople(n)}
                    className={`flex-1 min-w-[70px] py-2 px-1.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                      people === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary"
                    }`}
                  >
                    {n} {n === 1 ? t("person") : t("people")}
                  </button>
                ))}
              </div>
            </div>

            {/* Sale Hunt */}
            <button
              type="button"
              onClick={() => setSaleHunt(!saleHunt)}
              className={`w-full flex gap-2.5 items-center p-3 rounded-xl border transition-colors text-left ${
                saleHunt
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/40 border-border hover:border-primary"
              }`}
            >
              <span className={`w-8.5 h-8.5 rounded-[10px] flex items-center justify-center shrink-0 ${saleHunt ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`} style={{ width: "34px", height: "34px" }}>
                <Tag className="h-[18px] w-[18px]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold leading-tight text-foreground flex items-center gap-1.5">
                  {t("saleHunt")}
                  {saleHunt && <TrendingDown className="h-3.5 w-3.5 text-primary" />}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">{t("saleHuntDesc")}</p>
              </div>
              <Switch checked={saleHunt} onCheckedChange={setSaleHunt} aria-label={t("saleHunt")} onClick={(e) => e.stopPropagation()} />
            </button>
          </div>
        </div>

        <h3 className="text-xl leading-tight font-bold text-primary px-1">{t("configurePreferences") || "Configure Preferences"}</h3>

        {/* Step 2: Diet */}
        <div id="step-diet" className="scroll-mt-24 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
          <div className="flex gap-3 items-center">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">2</span>
            <div>
              <p className="text-[15px] leading-tight font-bold text-foreground">{t("dietSection") || "Diet"}</p>
              <p className="text-xs leading-tight text-muted-foreground mt-0.5">{dietLabel} · {computeDailyCalories(calorieMetrics) || 0} kcal · P{macros.protein}/C{macros.carbs}/F{macros.fats}{bio ? " · Bio" : ""}{allergies.length > 0 ? ` · ${allergies.length} ${t("allergiesTitle") || "allergies"}` : ""}</p>
            </div>
          </div>

          <div className={`space-y-5 ${dimCls("diet")}`}>
            {/* Diet Type */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {DIET_KEYS.map((diet) => {
                  const Icon = diet.icon;
                  const isSelected = selectedDiet === diet.id;
                  return (
                    <button
                      key={diet.id}
                      onClick={() => setSelectedDiet(diet.id)}
                      className={`flex flex-col gap-[3px] p-2.5 rounded-xl text-left border transition-all min-h-[68px] ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-card border-border text-foreground hover:border-primary hover:shadow-sm"
                      }`}
                    >
                      {diet.id === "halal" ? (
                        <span className="text-[17px] font-bold leading-none">حلال</span>
                      ) : Icon ? (
                        <Icon className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      ) : null}
                      <strong className={`text-[13px] leading-tight font-bold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>{t(diet.nameKey)}</strong>
                      <span className={`text-[11px] leading-tight ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{t(diet.descKey)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bio / Organic */}
              <button
                type="button"
                onClick={() => setBio(!bio)}
                className={`w-full flex gap-2.5 items-center p-3 rounded-xl border transition-colors text-left ${
                  bio
                    ? "bg-primary/10 border-primary"
                    : "bg-muted/40 border-border hover:border-primary"
                }`}
              >
                <span className={`w-8.5 h-8.5 rounded-[10px] flex items-center justify-center shrink-0 ${bio ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`} style={{ width: "34px", height: "34px" }}>
                  <Leaf className="h-[18px] w-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-foreground">{t("bioTitle")}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{t("bioDesc")}</p>
                </div>
                <Switch checked={bio} onCheckedChange={setBio} aria-label={t("bioTitle")} onClick={(e) => e.stopPropagation()} />
              </button>
            </div>

            {/* Calorie Goal */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground">{t("calorieGoal")}</p>
              <CalorieCalculator value={calorieMetrics} onChange={withStepInput("diet", setCalorieMetrics)} />
            </div>

            {/* Macronutrient Ratios */}
            <MacroRatioControl value={macros} onChange={setMacros} />

            {/* Allergies */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground">{t("allergiesTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("allergiesDesc")}</p>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      {tag}
                      <button onClick={() => removeTag(tag, allergies, setAllergies)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2 text-[13px] bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder={t("allergiesPlaceholder")}
                  value={allergyInput}
                  onChange={e => setAllergyInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTag(allergyInput, allergies, setAllergies, setAllergyInput)}
                />
                <button
                  onClick={() => addTag(allergyInput, allergies, setAllergies, setAllergyInput)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:bg-primary/90 transition-colors"
                >{t("add")}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Stores */}
        <div id="step-stores" className="scroll-mt-24 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
          <div className="flex gap-3 items-center">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">3</span>
            <div>
              <p className="text-[15px] leading-tight font-bold text-foreground">{t("storesSection") || "Stores"}</p>
              <p className="text-xs leading-tight text-muted-foreground mt-0.5">{storeNamesSummary || t("noStoresSelected")}</p>
            </div>
          </div>

          <div className={`space-y-3 ${dimCls("stores")}`}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-foreground">{t("preferredStores")}</p>
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
            <StoreSpeedHint />
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {t("plzLabel") || "Postal code (PLZ) or city"}
              </p>
              <div className="flex gap-1.5">
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
                  className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2.5 text-[13px] bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={handleLocationSubmit}
                  className="flex shrink-0 items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-[13px] font-bold hover:bg-primary/90 transition-colors"
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
                <div className="flex flex-wrap gap-1.5">
                  {GROCERY_STORES.map((store) => {
                    const discount = getStoreDiscount(store.id, selectedDiet, macros);
                    const isSelected = selectedStores.includes(store.id);
                    return (
                      <button
                        key={store.id}
                        onClick={() => toggleStore(store.id)}
                        className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary"
                        }`}
                      >
                        <span>{store.name}</span>
                        {discount > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                            isSelected ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary border border-primary/30"
                          }`}>
                            <Tag className="h-2.5 w-2.5" /> -{discount}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-medium text-muted-foreground">{t("drugstores") || "Drugstores"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {DRUGSTORES.map((store) => {
                    const discount = getStoreDiscount(store.id, selectedDiet, macros);
                    const isSelected = selectedStores.includes(store.id);
                    return (
                      <button
                        key={store.id}
                        onClick={() => toggleStore(store.id)}
                        className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary"
                        }`}
                      >
                        <span>{store.name}</span>
                        {discount > 0 && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                            isSelected ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary border border-primary/30"
                          }`}>
                            <Tag className="h-2.5 w-2.5" /> -{discount}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
                  <TrendingDown className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t("storeDiscountExplanation") || "Estimated % cheaper than mid-range supermarkets (REWE/Edeka) on a typical basket"}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Pantry */}
        <div id="step-pantry" className="scroll-mt-24 bg-card border border-border rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm">
          <div className="flex gap-3 items-center">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0">4</span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] leading-tight font-bold text-foreground">{t("pantrySection") || "Pantry"}</p>
              <p className="text-xs leading-tight text-muted-foreground mt-0.5">{pantryItems.length > 0 ? `${pantryItems.length} ${t("items") || "items"}` : (t("pantryEmptySummary") || "Add staples you already have")}</p>
            </div>
            <Switch checked={enabled.pantry} onCheckedChange={() => toggleSection("pantry")} aria-label={t("pantrySection") || "Pantry"} />
          </div>
          <div className={dimCls("pantry")}>
            <PantryManager onPantryChange={setPantryItems} />
          </div>
        </div>

        {/* CTA */}
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
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full py-3.5 rounded-xl text-[15px] font-bold flex justify-center gap-2 items-center transition-colors ${
              canGenerate
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 animate-drift"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {L("continueToPlan", "Continue to Plan")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sticky generate bar — mobile only, shown while the inline button is off-screen */}
      <StickyGenerateBar
        visible={showStickyGenerate}
        onClick={handleGenerate}
        disabled={!canGenerate}
        label={L("continueToPlan", "Continue to Plan")}
      />
    </div>
  );
}