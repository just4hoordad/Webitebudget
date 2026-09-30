import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PlanSetup from "@/components/planbuilder/PlanSetup";
import PlanGrid from "@/components/planbuilder/PlanGrid";
import PlanGroceryResult from "@/components/planbuilder/PlanGroceryResult";
import GeneratingLoader from "@/components/GeneratingLoader";
import CreditBar from "@/components/monetization/CreditBar";
import SharePlanModal from "@/components/planbuilder/SharePlanModal";
import PlanConfirm from "@/components/planbuilder/PlanConfirm";
import { MEAL_LIBRARY, FALLBACK_MEALS } from "@/lib/mealLibrary";
import { toDishes, filledDishes } from "@/lib/planDishes";
import { savePriceObservations, getKnownPricesText } from "@/lib/generateGroceries";
import { invokeAI } from "@/lib/aiClient";
import { Button } from "@/components/ui/button";
import { useMonetization } from "@/lib/MonetizationContext";
import { ArrowLeft, Share2 } from "lucide-react";

const PREFS_KEY = "bb_planbuilder_prefs";
const RECENT_KEY = "bb_recent_meals";
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
}

export default function PlanBuilder() {
  const { t, currentLanguage } = useLanguage();
  const { guarded } = useMonetization();
  const [phase, setPhase] = useState("setup");
  const [diet, setDiet] = useState(() => loadPrefs().diet || "");
  const [days, setDays] = useState(() => loadPrefs().days || 0);
  const [people, setPeople] = useState(() => loadPrefs().people || 0);
  const [stores, setStores] = useState(() => loadPrefs().stores || []);
  const [postalCode, setPostalCode] = useState(() => loadPrefs().postalCode || "");
  const [selectedStoreLocations, setSelectedStoreLocations] = useState(() => loadPrefs().selectedStoreLocations || []);
  const [cityCoords, setCityCoords] = useState(null);
  const [macros, setMacrosRaw] = useState(() => loadPrefs().macros || { protein: 30, carbs: 40, fats: 30 });
  const [macrosSet, setMacrosSet] = useState(() => !!loadPrefs().macros);
  const setMacros = (m) => { setMacrosRaw(m); setMacrosSet(true); };

  // Restore saved inputs from the logged-in user's account
  useEffect(() => {
    base44.auth.isAuthenticated().then(async (ok) => {
      if (!ok) return;
      const p = (await base44.auth.me())?.planBuilderPrefs;
      if (!p) return;
      if (p.diet) setDiet(p.diet);
      if (p.days) setDays(p.days);
      if (p.people) setPeople(p.people);
      if (p.stores) setStores(p.stores);
      if (p.postalCode) setPostalCode(p.postalCode);
      if (p.selectedStoreLocations) setSelectedStoreLocations(p.selectedStoreLocations);
      if (p.macros) { setMacrosRaw(p.macros); setMacrosSet(true); }
    });
  }, []);
  const [enabled, setEnabled] = useState({ diet: true, people: true, days: true, stores: true, macros: true });
  const [prepEnabled, setPrepEnabled] = useState(true);
  const [plan, setPlan] = useState(null);
  const [grocery, setGrocery] = useState(null);
  const [prep, setPrep] = useState(null);
  const [loadingGrocery, setLoadingGrocery] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [suggesting, setSuggesting] = useState({});
  const [recentMeals, setRecentMeals] = useState(loadRecent);
  const [showShare, setShowShare] = useState(false);
  const savedPlanId = useRef(null);
  const savedPlanName = useRef(null);

  const CACHE_KEY = "bb_plan_grocery_cache";

  const todayStr = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD (local)

  const toggleStore = (s) => setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleSetting = (key) => setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasValidCache = () => {
    const cacheKey = JSON.stringify({ plan, enabled, diet, people, stores, selectedStoreLocations, macros, prepEnabled, lang: currentLanguage.code });
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.key === cacheKey && cached.date === todayStr()) return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const handleGenerate = () => {
    if (hasValidCache()) { generateGrocery(); return; }
    guarded(generateGrocery);
  };

  const startPlan = () => {
    const prefs = { diet, people, days, stores, postalCode, selectedStoreLocations, macros };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
    base44.auth.isAuthenticated().then((ok) => ok && base44.auth.updateMe({ planBuilderPrefs: prefs }));
    setPlan(Array.from({ length: days }, () => ({ breakfast: [], lunch: [], dinner: [] })));
    setGrocery(null);
    setPhase("grid");
    window.scrollTo(0, 0);
  };

  const setSlot = (d, type, value) =>
    setPlan((prev) => prev.map((day, i) => (i === d ? { ...day, [type]: value } : day)));

  const addDish = (d, type, name = "", side = false) =>
    setPlan((prev) => prev.map((day, i) => (i === d ? { ...day, [type]: [...toDishes(day[type]), { name, side }] } : day)));
  const updateDish = (d, type, idx, name) =>
    setPlan((prev) => prev.map((day, i) => {
      if (i !== d) return day;
      return { ...day, [type]: toDishes(day[type]).map((dish, j) => (j === idx ? { ...dish, name } : dish)) };
    }));
  const removeDish = (d, type, idx) =>
    setPlan((prev) => prev.map((day, i) => {
      if (i !== d) return day;
      return { ...day, [type]: toDishes(day[type]).filter((_, j) => j !== idx) };
    }));
  const addSideDish = (d, type) => addDish(d, type, "", true);

  const addRecentMeal = (name) => {
    const n = (name || "").trim();
    if (!n) return;
    setRecentMeals((prev) => {
      const next = [n, ...prev.filter((m) => m.toLowerCase() !== n.toLowerCase())].slice(0, 12);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const suggestMeal = (dayIndex, slotKey) => {
    const lib = MEAL_LIBRARY[diet] || FALLBACK_MEALS;
    const opts = lib.filter((m) => m.type === slotKey);
    if (!opts.length) { toast.error(t("suggestFailed")); return; }
    const name = opts[Math.floor(Math.random() * opts.length)].name;
    addDish(dayIndex, slotKey, name);
    addRecentMeal(name);
  };

  const autoFillMeals = () => {
    setAutofilling(true);
    try {
      const lib = MEAL_LIBRARY[diet] || FALLBACK_MEALS;
      const pick = (type) => {
        const opts = lib.filter((m) => m.type === type);
        return opts.length ? opts[Math.floor(Math.random() * opts.length)].name : "";
      };
      const next = Array.from({ length: plan.length }, () => ({
        breakfast: [{ name: pick("breakfast"), side: false }],
        lunch: [{ name: pick("lunch"), side: false }],
        dinner: [{ name: pick("dinner"), side: false }],
      }));
      setPlan(next);
      next.forEach((day) => ["breakfast", "lunch", "dinner"].forEach((k) => filledDishes(day, k).forEach((dd) => addRecentMeal(dd.name))));
    } catch {
      toast.error("Autofill failed. Please try again.");
    } finally {
      setAutofilling(false);
    }
  };

  const generateGrocery = async () => {
    // Reuse today's generated list if the plan hasn't changed (saves credits).
    const cacheKey = JSON.stringify({ plan, enabled, diet, people, stores, selectedStoreLocations, macros, prepEnabled, lang: currentLanguage.code });
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.key === cacheKey && cached.date === todayStr()) {
          setGrocery(cached.grocery);
          setPrep(cached.prep || null);
          setPhase("result");
          window.scrollTo(0, 0);
          toast.success(t("usingCachedList"));
          return;
        }
      }
    } catch { /* ignore cache read errors */ }

    plan.forEach((day) => ["breakfast", "lunch", "dinner"].forEach((k) => {
      filledDishes(day, k).forEach((dd) => addRecentMeal(dd.name));
    }));
    setLoadingGrocery(true);
    savedPlanId.current = null;
    try {
      const knownPricesText = await getKnownPricesText(postalCode);
      const lines = plan
        .map((day, d) => {
          const parts = [];
          ["breakfast", "lunch", "dinner"].forEach((type) => {
            const dishes = filledDishes(day, type);
            if (!dishes.length) return;
            const mains = dishes.filter((x) => !x.side).map((x) => x.name).join(", ");
            const sides = dishes.filter((x) => x.side).map((x) => x.name).join(", ");
            const label = mains ? `${type}: ${mains}` : `${type}: (sides only)`;
            parts.push(sides ? `${label} + sides: ${sides}` : label);
          });
          return `Day ${d + 1}: ${parts.join(" | ")}`;
        })
        .join("\n");

      // Single merged call: grocery list + (optional) prep guide in one response — halves credit use vs two parallel calls.
      const res = await invokeAI({
        prompt: `Here is a user's meal plan for ${enabled.people ? people : 1} person(s) over ${plan.length} day(s)${enabled.diet ? ` on a ${diet} diet` : ""}:
${lines}
${enabled.macros ? `\nThe user's target macronutrient split is protein ${macros.protein}%, carbs ${macros.carbs}%, fats ${macros.fats}%.` : ""}

For each meal, determine the realistic ingredients and quantities needed for 1 person, then generate a consolidated grocery list for ${enabled.people ? people : 1} person(s) over the whole plan.
${enabled.macros ? "- Adjust ingredient quantities so the overall list delivers the target macro split as closely as possible (scale protein/carb/fat sources up or down accordingly)." : "- No specific macro target; use realistic balanced quantities."}
- Consolidate ingredients that repeat across days/meals into a single line with the TOTAL quantity needed for ${enabled.people ? people : 1} person(s).
- Use real 2024-2025 German supermarket branded product names from these stores: ${enabled.stores ? (selectedStoreLocations.length > 0 ? selectedStoreLocations.map(s => s.name + (s.address ? ` (${s.address})` : "")).join(", ") : stores.join(", ")) : "any German supermarket (Aldi, Lidl, REWE, Edeka, Penny, Netto)"}. Pick the cheapest store per item.
- Region: postal code ${postalCode || "unknown"} — use regional prices for that area when available.
${knownPricesText ? `- COMMUNITY PRICE DATABASE (prefer these prices where a product matches):\n${knownPricesText}` : ""}
- quantity = total amount/package needed. price = unit_price × units needed for ${enabled.people ? people : 1} person(s) over ${plan.length} day(s).
- All item names in ${currentLanguage.label}, category names in English.
${enabled.diet && diet === "frozen" ? "- FROZEN MODE: only frozen ready-to-heat products." : ""}${prepEnabled ? `

PREP GUIDE: In the same response, under "prep", write a short cooking guide for each day. Return a "days" array with exactly ${plan.length} entries, one per plan day in order. For each day provide "breakfast", "lunch", "dinner" objects; each object has: "meal" (the meal name), "portion" (realistic portion size per person), and "prep" (2-4 short practical cooking steps). Leave a meal object with meal: "" if that slot is blank. All prep text in ${currentLanguage.label}.` : ""}`,
        model: "gemini_3_flash",
        response_json_schema: prepEnabled ? {
          type: "object",
          properties: {
            total_estimated_cost: { type: "number" },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" }, quantity: { type: "string" },
                        unit_price: { type: "number" }, price: { type: "number" },
                        normal_price: { type: "number" }, store: { type: "string" }, calories_info: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
            prep: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      breakfast: { type: "object", properties: { meal: { type: "string" }, portion: { type: "string" }, prep: { type: "string" } } },
                      lunch: { type: "object", properties: { meal: { type: "string" }, portion: { type: "string" }, prep: { type: "string" } } },
                      dinner: { type: "object", properties: { meal: { type: "string" }, portion: { type: "string" }, prep: { type: "string" } } },
                    },
                  },
                },
              },
            },
          },
        } : {
          type: "object",
          properties: {
            total_estimated_cost: { type: "number" },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" }, quantity: { type: "string" },
                        unit_price: { type: "number" }, price: { type: "number" },
                        normal_price: { type: "number" }, store: { type: "string" }, calories_info: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const grocery = { total_estimated_cost: res.total_estimated_cost, categories: res.categories };
      const prep = res.prep || null;
      setGrocery(grocery);
      setPrep(prep);
      setPhase("result");
      window.scrollTo(0, 0);
      savePriceObservations(grocery, postalCode, diet);

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ key: cacheKey, date: todayStr(), grocery, prep }));
      } catch { /* ignore */ }

      base44.entities.MealPlan.create({
        name: `${plan.length}-${t("days")} · ${new Date().toLocaleDateString(currentLanguage.code)}`,
        diet,
        people,
        stores: selectedStoreLocations.length > 0 ? selectedStoreLocations.map(s => s.name).join(", ") : stores.join(", "),
        macros,
        plan,
        groceryList: grocery,
        prep,
      })
        .then((rec) => {
          savedPlanId.current = rec?.id ?? null;
          savedPlanName.current = rec?.name ?? null;
          toast.success(t("planAutoSaved"));
          if (rec?.id) {
            base44.functions.invoke("googleCalendarSync", { planId: rec.id })
              .then(() => toast.success(t("calendarSynced") || "Synced to Google Calendar"))
              .catch(() => { /* not connected / not authenticated — ignore */ });
          }
        })
        .catch((e) => { console.error("Auto-save failed:", e); toast.error(t("planAutoSaveFailed")); });
    } catch {
      toast.error("Failed to build grocery list. Please try again.");
    } finally {
      setLoadingGrocery(false);
    }
  };

  const reset = () => { setPhase("setup"); setGrocery(null); window.scrollTo(0, 0); };

  if (phase === "result" && grocery) {
    const shareFooter = savedPlanId.current ? (
      <Button onClick={() => setShowShare(true)} variant="outline" className="w-full h-12">
        <Share2 className="h-4 w-4" /> {t("sharePlan") || "Share plan"}
      </Button>
    ) : null;
    return (
      <>
        <PlanGroceryResult
          grocery={grocery}
          prep={prep}
          days={plan.length}
          people={people}
          diet={diet}
          onReset={reset}
          footer={shareFooter}
        />
        <SharePlanModal
          plan={{ id: savedPlanId.current, name: savedPlanName.current || "", shareToken: "" }}
          open={showShare}
          onClose={() => setShowShare(false)}
        />
      </>
    );
  }

  if (phase === "confirm" && !loadingGrocery) {
    return (
      <PlanConfirm
        plan={plan}
        people={people}
        diet={diet}
        stores={selectedStoreLocations.length ? selectedStoreLocations.map((s) => s.name) : stores}
        prepEnabled={prepEnabled}
        onBack={() => setPhase("grid")}
        onConfirm={handleGenerate}
      />
    );
  }

  if (phase === "grid" || phase === "confirm") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </button>
          <CreditBar variant="onLight" />
        </div>
        {loadingGrocery ? (
          <GeneratingLoader type="grocery" stores={selectedStoreLocations.length ? selectedStoreLocations.map((s) => s.name) : stores} />
        ) : (
          <PlanGrid days={days} plan={plan} setSlot={setSlot} addDish={addDish} updateDish={updateDish} removeDish={removeDish} addSideDish={addSideDish} onAutoFill={autoFillMeals} autofilling={autofilling} onGenerate={() => { setPhase("confirm"); window.scrollTo(0, 0); }} generating={loadingGrocery} prepEnabled={prepEnabled} setPrepEnabled={setPrepEnabled} onSuggest={suggestMeal} suggesting={suggesting} recentMeals={recentMeals} diet={diet} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreditBar variant="onLight" />
      <PlanSetup diet={diet} setDiet={setDiet} days={days} setDays={setDays} people={people} setPeople={setPeople} stores={stores} toggleStore={toggleStore} macros={macros} setMacros={setMacros} macrosSet={macrosSet} enabled={enabled} toggleSetting={toggleSetting} onBuild={startPlan} loading={false} postalCode={postalCode} setPostalCode={setPostalCode} selectedStoreLocations={selectedStoreLocations} onChangeStoreLocations={setSelectedStoreLocations} cityCoords={cityCoords} onCityCoordsUsed={() => setCityCoords(null)} />
    </div>
  );
}