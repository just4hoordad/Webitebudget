import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useDietSaleScores } from "@/lib/useDietSaleScores";
import { useStoreSaleScores } from "@/lib/useStoreSaleScores";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Euro, Users, Leaf, Beef, Fish, Wheat, TrendingDown, Minus, TrendingUp, Dumbbell, Tag, X, Scale, Microwave, Search } from "lucide-react";
import StoreMapPicker from "@/components/StoreMapPicker";
import PantryManager from "@/components/PantryManager";

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

const CALORIE_GOAL_KEYS = [
  { id: "lose", nameKey: "loseWeight", kcal: 1600, icon: TrendingDown, desc: "~1600 kcal/day" },
  { id: "maintain", nameKey: "maintain", kcal: 2000, icon: Minus, desc: "~2000 kcal/day" },
  { id: "gain", nameKey: "gainWeight", kcal: 2500, icon: TrendingUp, desc: "~2500 kcal/day" },
  { id: "muscle", nameKey: "buildMuscle", kcal: 2800, icon: Dumbbell, desc: "~2800 kcal/day" },
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



export default function BudgetForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const dietSaleScores = useDietSaleScores();
  const storeSaleScores = useStoreSaleScores();
  const [budget, setBudget] = useState([150]);
  const [selectedStores, setSelectedStores] = useState(["aldi", "lidl"]);
  const [selectedStoreLocations, setSelectedStoreLocations] = useState([]); // specific pinned store objects
  const [selectedDiet, setSelectedDiet] = useState("balanced");
  const [calorieGoal, setCalorieGoal] = useState("maintain");
  const [people, setPeople] = useState(1);
  const [days, setDays] = useState(30);
  const [saleHunt, setSaleHunt] = useState(false);
  const [bio, setBio] = useState(false);
  const [junkPercent, setJunkPercent] = useState([0]);
  const [proteinSnackBudget, setProteinSnackBudget] = useState(0);
  const [allergyInput, setAllergyInput] = useState("");
  const [allergies, setAllergies] = useState([]);

  const [pantryItems, setPantryItems] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityCoords, setCityCoords] = useState(null);

  const addTag = (value, list, setList, setInput) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setInput("");
  };

  const removeTag = (item, list, setList) => setList(list.filter(i => i !== item));

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setCityCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch (e) {
      // silently fail
    }
  };

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
      days: days,
      stores: storesParam,
      diet: selectedDiet,
      people: people,
      calories: totalCalories,
      saleHunt: saleHunt,
      bio: bio,
      junkPercent: junkPercent[0],
      proteinSnackBudget: proteinSnackBudget,
      allergies: allergies.join(","),
      owned: pantryItems.map(p => p.name + (p.amount && p.amount !== "some" ? ` (${p.amount})` : "")).join(","),
    });
    navigate(`/meal-plan?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Budget Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{t("monthlyBudget")}</label>
          <div className="flex items-center gap-1 bg-primary/10 text-primary font-heading font-bold text-xl px-3 py-1 rounded-xl">
            <Euro className="h-5 w-5 shrink-0" />
            <input
              type="number"
              min={1}
              value={budget[0]}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) setBudget([val]);
              }}
              className="w-20 bg-transparent text-primary font-heading font-bold text-xl focus:outline-none text-right"
            />
          </div>
        </div>
        <Slider
          value={[Math.min(budget[0], 600)]}
          onValueChange={setBudget}
          max={600}
          min={10}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>€10</span>
          <span>{t("avgStudent")}</span>
          <span>€600</span>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t("durationDays") || "Duration"}</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={e => setDays(e.target.value)}
            onBlur={e => {
              const val = parseInt(e.target.value, 10);
              setDays(!isNaN(val) ? Math.min(30, Math.max(1, val)) : 30);
            }}
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="1-30"
          />
          <span className="font-heading font-bold text-sm text-muted-foreground">{t("days") || "days"}</span>
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
            cityCoords={cityCoords}
            onCityCoordsUsed={() => setCityCoords(null)}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter city or zip code"
            value={citySearch}
            onChange={e => setCitySearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCitySearch()}
            className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleCitySearch}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-all duration-200"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
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
              {t("clearPinnedStores")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
               {GROCERY_STORES.map((store) => {
                 const score = storeSaleScores[store.id.toLowerCase()];
                 return (
                   <button
                     key={store.id}
                     onClick={() => toggleStore(store.id)}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                       selectedStores.includes(store.id)
                         ? store.color + " border-current"
                         : "bg-card text-muted-foreground border-border hover:border-primary/40"
                     }`}
                   >
                     {store.name}
                     {score && (
                       <span className="text-xs font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-md">
                         -{score}%
                       </span>
                     )}
                   </button>
                 );
               })}
             </div>
             <p className="text-xs font-medium text-muted-foreground">{t("drugstores") || "Drugstores"}</p>
             <div className="flex flex-wrap gap-2">
               {DRUGSTORES.map((store) => {
                 const score = storeSaleScores[store.id.toLowerCase()];
                 return (
                   <button
                     key={store.id}
                     onClick={() => toggleStore(store.id)}
                     className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                       selectedStores.includes(store.id)
                         ? store.color + " border-current"
                         : "bg-card text-muted-foreground border-border hover:border-primary/40"
                     }`}
                   >
                     {store.name}
                     {score && (
                       <span className="text-xs font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-md">
                         -{score}%
                       </span>
                     )}
                   </button>
                 );
               })}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DIET_KEYS.map((diet) => {
            const Icon = diet.icon;
            const isSelected = selectedDiet === diet.id;
            return (
              <button
                key={diet.id}
                onClick={() => setSelectedDiet(diet.id)}
                className={`flex flex-col items-start gap-1 p-4 rounded-xl text-left transition-all duration-200 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card text-foreground border-border shadow-sm hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className={`mb-1 flex items-start justify-between w-full ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  <span>
                    {diet.id === "halal" ? (
                      <span className="text-xl font-bold leading-none">حلال</span>
                    ) : Icon ? (
                      <Icon className="h-6 w-6" />
                    ) : null}
                  </span>
                  {dietSaleScores[diet.id] && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>
                      -{dietSaleScores[diet.id]}%
                    </span>
                  )}
                </div>
                <span className={`font-heading font-semibold text-sm leading-tight ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                  {t(diet.nameKey)}
                </span>
                <span className={`text-xs leading-tight ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                   {t(diet.descKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Junk Food Allowance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">{t("junkFoodTitle")}</label>
            <p className="text-xs text-muted-foreground mt-0.5">{t("junkFoodDesc")}</p>
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
          <span>{t("junkClean")}</span>
          <span>{t("junkBalanced")}</span>
          <span>{t("junkYolo")}</span>
        </div>
      </div>

      {/* Protein Snack Budget */}
      <div className={`space-y-3 px-5 py-4 rounded-xl border-2 transition-all duration-200 ${proteinSnackBudget > 0 ? "bg-blue-50 border-blue-400" : "bg-card border-border"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💪</span>
            <div>
              <p className={`text-sm font-semibold ${proteinSnackBudget > 0 ? "text-blue-800" : "text-foreground"}`}>{t("proteinSnackBudgetTitle")}</p>
              <p className={`text-xs ${proteinSnackBudget > 0 ? "text-blue-700/70" : "text-muted-foreground"}`}>{t("proteinSnackBudgetDesc")}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 font-heading font-bold text-lg px-3 py-1 rounded-xl ${proteinSnackBudget > 0 ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
            <Euro className="h-4 w-4 shrink-0" />
            <input
              type="number"
              min={0}
              max={200}
              value={proteinSnackBudget}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                setProteinSnackBudget(!isNaN(val) && val >= 0 ? val : 0);
              }}
              className="w-16 bg-transparent font-heading font-bold text-lg focus:outline-none text-right"
            />
          </div>
        </div>
        <Slider
          value={[proteinSnackBudget]}
          onValueChange={([v]) => setProteinSnackBudget(v)}
          max={200}
          min={0}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>€0 (off)</span>
          <span>€100</span>
          <span>€200</span>
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
              <p className={`text-sm font-semibold ${bio ? "text-green-800" : "text-foreground"}`}>{t("bioTitle")}</p>
              <p className={`text-xs ${bio ? "text-green-700/70" : "text-muted-foreground"}`}>{t("bioDesc")}</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-all duration-200 flex items-center px-0.5 ${bio ? "bg-green-500" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${bio ? "translate-x-4" : "translate-x-0"}`} />
          </div>
        </button>
      </div>

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

      {/* Pantry */}
      <PantryManager onPantryChange={setPantryItems} />

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