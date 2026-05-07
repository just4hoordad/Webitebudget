import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Euro, Users, Leaf, Beef, Fish, Wheat, TrendingDown, Minus, TrendingUp, Dumbbell, Tag } from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";

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
];

const DRUGSTORES = [
  { id: "dm", name: "dm", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "rossmann", name: "Rossmann", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "müller", name: "Müller", color: "bg-violet-100 text-violet-700 border-violet-200" },
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
  const [bio, setBio] = useState(false);
  const [junkPercent, setJunkPercent] = useState([0]);

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
      bio: bio,
      junkPercent: junkPercent[0],
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
               {GROCERY_STORES.map((store) => (
                 <button
                   key={store.id}
                   onClick={() => toggleStore(store.id)}
                   className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                     selectedStores.includes(store.id)
                       ? store.color + " border-current"
                       : "bg-card text-muted-foreground border-border hover:border-primary/40"
                   }`}
                 >
                   {store.name}
                 </button>
               ))}
             </div>
             <p className="text-xs font-medium text-muted-foreground">Drugstores</p>
             <div className="flex flex-wrap gap-2">
               {DRUGSTORES.map((store) => (
                 <button
                   key={store.id}
                   onClick={() => toggleStore(store.id)}
                   className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                     selectedStores.includes(store.id)
                       ? store.color + " border-current"
                       : "bg-card text-muted-foreground border-border hover:border-primary/40"
                   }`}
                 >
                   {store.name}
                 </button>
               ))}
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

      {/* Junk Food Allowance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">🍕 Junk Food Allowance</label>
            <p className="text-xs text-muted-foreground mt-0.5">% of your total daily calories from junk food</p>
          </div>
          <span className={`font-heading font-bold text-lg px-3 py-1 rounded-xl ${
            junkPercent[0] === 0 ? "bg-green-100 text-green-700" :
            junkPercent[0] <= 15 ? "bg-yellow-100 text-yellow-700" :
            junkPercent[0] <= 30 ? "bg-orange-100 text-orange-700" :
            "bg-red-100 text-red-700"
          }`}>
            {junkPercent[0]}%
          </span>
        </div>
        <Slider
          value={junkPercent}
          onValueChange={setJunkPercent}
          max={50}
          min={0}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0% — Clean</span>
          <span>25% — Balanced</span>
          <span>50% — YOLO</span>
        </div>
      </div>

      {/* Sale Hunt + Bio */}
      <div className="flex flex-col gap-3">
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

        <button
          onClick={() => setBio((v) => !v)}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
            bio
              ? "bg-green-50 border-green-500 text-green-800"
              : "bg-card border-border hover:border-green-400/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌿</span>
            <div className="text-left">
              <p className={`text-sm font-semibold ${bio ? "text-green-800" : "text-foreground"}`}>Bio / Organic</p>
              <p className={`text-xs ${bio ? "text-green-700/70" : "text-muted-foreground"}`}>Generate grocery list using organic & bio products</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-all duration-200 flex items-center px-0.5 ${bio ? "bg-green-500" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${bio ? "translate-x-4" : "translate-x-0"}`} />
          </div>
        </button>
      </div>

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