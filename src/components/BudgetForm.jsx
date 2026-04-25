import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Euro, Users, Leaf, Beef, Fish, Wheat, TrendingDown, Minus, TrendingUp, Dumbbell, Tag } from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";

// Each store: bg/text/border = active state. The logo badge uses logoBg + logoText for the colored "logo" portion.
const GROCERY_STORES = [
  { id: "aldi",     name: "Aldi",     logoBg: "#00005F", logoText: "#FFC800", label: "Aldi",      bg: "#EEF2FF", border: "#00005F" },
  { id: "lidl",     name: "Lidl",     logoBg: "#003F87", logoText: "#FFF200", label: "Lidl",      bg: "#EEF3FF", border: "#003F87" },
  { id: "rewe",     name: "REWE",     logoBg: "#CC0000", logoText: "#ffffff", label: "REWE",      bg: "#FDECEA", border: "#CC0000" },
  { id: "edeka",    name: "Edeka",    logoBg: "#E2001A", logoText: "#FFD700", label: "edeka",     bg: "#FFF8E1", border: "#E2001A" },
  { id: "penny",    name: "Penny",    logoBg: "#D40511", logoText: "#ffffff", label: "penny",     bg: "#FDECEA", border: "#D40511" },
  { id: "netto",    name: "Netto",    logoBg: "#F39200", logoText: "#000000", label: "Netto",     bg: "#FFF8E6", border: "#F39200" },
  { id: "kaufland", name: "Kaufland", logoBg: "#ED1D23", logoText: "#ffffff", label: "kaufland",  bg: "#FDECEA", border: "#ED1D23" },
  { id: "norma",    name: "Norma",    logoBg: "#007A3D", logoText: "#ffffff", label: "NORMA",     bg: "#E8F5E9", border: "#007A3D" },
  { id: "globus",   name: "Globus",   logoBg: "#0057A8", logoText: "#ffffff", label: "globus",    bg: "#E3F2FD", border: "#0057A8" },
  { id: "real",     name: "Real",     logoBg: "#006B37", logoText: "#ffffff", label: "real",      bg: "#E8F5E9", border: "#006B37" },
  { id: "tegut",    name: "Tegut",    logoBg: "#E2001A", logoText: "#ffffff", label: "tegut",     bg: "#FDECEA", border: "#E2001A" },
  { id: "hit",      name: "HIT",      logoBg: "#E87722", logoText: "#ffffff", label: "HIT",       bg: "#FFF3E0", border: "#E87722" },
];

const DRUGSTORES = [
  { id: "rossmann", name: "Rossmann", logoBg: "#CC0000", logoText: "#ffffff", label: "Rossmann",  bg: "#FDECEA", border: "#CC0000" },
  { id: "dm",       name: "dm",       logoBg: "#D40C18", logoText: "#ffffff", label: "dm",        bg: "#FDE8EC", border: "#D40C18" },
];

const CALORIE_GOAL_KEYS = [
  { id: "lose", nameKey: "loseWeight", kcal: 1600, icon: TrendingDown, desc: "~1600 kcal/day" },
  { id: "maintain", nameKey: "maintain", kcal: 2000, icon: Minus, desc: "~2000 kcal/day" },
  { id: "gain", nameKey: "gainWeight", kcal: 2500, icon: TrendingUp, desc: "~2500 kcal/day" },
  { id: "muscle", nameKey: "buildMuscle", kcal: 2800, icon: Dumbbell, desc: "~2800 kcal/day" },
];

const DIET_KEYS = [
  { id: "balanced", nameKey: "balanced", icon: Users },
  { id: "vegetarian", nameKey: "vegetarian", icon: Leaf },
  { id: "vegan", nameKey: "vegan", icon: Leaf },
  { id: "high-protein", nameKey: "highProtein", icon: Beef },
  { id: "pescatarian", nameKey: "pescatarian", icon: Fish },
  { id: "gluten-free", nameKey: "glutenFree", icon: Wheat },
  { id: "halal", nameKey: "halal", icon: Users },
];



function StoreBadge({ store, active, onToggle }) {
  return (
    <button
      onClick={() => onToggle(store.id)}
      className="flex items-center rounded-lg border-2 overflow-hidden transition-all duration-200 text-xs font-bold"
      style={{
        borderColor: active ? store.border : store.border + "44",
        opacity: active ? 1 : 0.55,
        boxShadow: active ? `0 1px 4px ${store.border}44` : "none",
      }}
    >
      <span
        className="px-2.5 py-1.5 leading-tight"
        style={{ background: store.logoBg, color: store.logoText }}
      >
        {store.label}
      </span>
    </button>
  );
}

export default function BudgetForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [budget, setBudget] = useState([150]);
  const [selectedStores, setSelectedStores] = useState(["aldi", "lidl"]);
  const [selectedStoreLocations, setSelectedStoreLocations] = useState([]); // specific pinned store objects
  const [selectedDiet, setSelectedDiet] = useState("balanced");
  const [calorieGoal, setCalorieGoal] = useState("maintain");
  const [people, setPeople] = useState(1);
  const [saleHunt, setSaleHunt] = useState(false);

  const toggleStore = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((s) => s !== storeId)
        : [...prev, storeId]
    );
  };

  const handleGenerate = () => {
    const goalKcal = CALORIE_GOAL_KEYS.find(g => g.id === calorieGoal)?.kcal || 2000;
    const totalCalories = goalKcal * people;
    // Use pinned specific locations if available, otherwise fall back to chain names
    const storesParam = selectedStoreLocations.length > 0
      ? selectedStoreLocations.map(s => s.name + (s.address ? ` (${s.address})` : "")).join(", ")
      : selectedStores.join(",");
    const params = new URLSearchParams({
      budget: budget[0],
      stores: storesParam,
      diet: selectedDiet,
      people: people,
      calories: totalCalories,
      saleHunt: saleHunt,
    });
    navigate(`/meal-plan?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Budget Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{t("monthlyBudget")}</label>
          <div className="flex items-center gap-1 bg-primary/10 text-primary font-heading font-bold text-xl px-4 py-1.5 rounded-xl">
            <Euro className="h-5 w-5" />
            {budget[0]}
          </div>
        </div>
        <Slider
          value={budget}
          onValueChange={setBudget}
          max={400}
          min={50}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>€50</span>
          <span>{t("avgStudent")}</span>
          <span>€400</span>
        </div>
      </div>

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

      {/* Store Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{t("preferredStores")}</label>
          <StoreMapPicker
            selectedStoreLocations={selectedStoreLocations}
            onChangeStoreLocations={setSelectedStoreLocations}
            selectedChains={selectedStores}
            onToggleChain={toggleStore}
          />
        </div>
        {selectedStoreLocations.length > 0 ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-primary mb-2">📍 Specific stores pinned from map:</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedStoreLocations.map((s) => (
                <span key={s.id} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium">
                  {s.name}
                  {s.address && <span className="opacity-70 text-xs">· {s.address}</span>}
                </span>
              ))}
            </div>
            <button onClick={() => setSelectedStoreLocations([])} className="text-xs text-muted-foreground hover:text-destructive mt-2 underline">
              Clear pinned stores
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {GROCERY_STORES.map((store) => <StoreBadge key={store.id} store={store} active={selectedStores.includes(store.id)} onToggle={toggleStore} />)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Drogeriemärkte</p>
              <div className="flex flex-wrap gap-2">
                {DRUGSTORES.map((store) => <StoreBadge key={store.id} store={store} active={selectedStores.includes(store.id)} onToggle={toggleStore} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calorie Goal */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t("calorieGoal")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CALORIE_GOAL_KEYS.map((goal) => {
            const Icon = goal.icon;
            return (
              <button
                key={goal.id}
                onClick={() => setCalorieGoal(goal.id)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-200 overflow-hidden ${
                  calorieGoal === goal.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-center leading-tight">{t(goal.nameKey)}</span>
                <span className={`text-xs ${calorieGoal === goal.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{goal.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diet Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t("dietPreference")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIET_KEYS.map((diet) => {
            const Icon = diet.icon;
            return (
              <button
                key={diet.id}
                onClick={() => setSelectedDiet(diet.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 overflow-hidden min-w-0 ${
                  selectedDiet === diet.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t(diet.nameKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sale Hunt */}
      <button
        onClick={() => setSaleHunt((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
          saleHunt
            ? "bg-accent/10 border-accent text-accent-foreground"
            : "bg-card border-border hover:border-accent/40"
        }`}
      >
        <div className="flex items-center gap-3">
          <Tag className={`h-5 w-5 ${saleHunt ? "text-accent-foreground" : "text-muted-foreground"}`} />
          <div className="text-left">
            <p className={`text-sm font-semibold ${saleHunt ? "text-accent-foreground" : "text-foreground"}`}>{t("saleHunt")}</p>
            <p className={`text-xs ${saleHunt ? "text-accent-foreground/70" : "text-muted-foreground"}`}>{t("saleHuntDesc")}</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full transition-all duration-200 flex items-center px-0.5 ${saleHunt ? "bg-accent" : "bg-muted"}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${saleHunt ? "translate-x-4" : "translate-x-0"}`} />
        </div>
      </button>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={selectedStoreLocations.length === 0 && selectedStores.length === 0}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300"
        size="lg"
      >
        {t("generateBtn")}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}