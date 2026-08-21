import { useState, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PlanSetup from "@/components/planbuilder/PlanSetup";
import PlanGrid from "@/components/planbuilder/PlanGrid";
import PlanGroceryResult from "@/components/planbuilder/PlanGroceryResult";
import GeneratingLoader from "@/components/GeneratingLoader";
import CreditBar from "@/components/monetization/CreditBar";
import SharePlanModal from "@/components/planbuilder/SharePlanModal";
import DishPickerSheet from "@/components/planbuilder/DishPickerSheet";
import { Button } from "@/components/ui/button";
import { useMonetization } from "@/lib/MonetizationContext";
import { DISHES, localName } from "@/data/dishCatalog";
import { ArrowLeft, Share2 } from "lucide-react";

const PREFS_KEY = "bb_planbuilder_prefs";
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}

export default function PlanBuilder() {
  const { t, currentLanguage } = useLanguage();
  const { guarded } = useMonetization();
  const [phase, setPhase] = useState("setup");
  const [diet, setDiet] = useState(() => loadPrefs().diet || "balanced");
  const [days, setDays] = useState(7);
  const [people, setPeople] = useState(() => loadPrefs().people || 1);
  const [stores, setStores] = useState(() => loadPrefs().stores || ["Aldi", "Lidl"]);
  const [macros, setMacros] = useState({ protein: 30, carbs: 40, fats: 30 });
  const [enabled, setEnabled] = useState({ diet: true, people: true, days: true, stores: true, macros: true });
  const [prepEnabled, setPrepEnabled] = useState(true);
  const [plan, setPlan] = useState(null);
  const [grocery, setGrocery] = useState(null);
  const [prep, setPrep] = useState(null);
  const [loadingGrocery, setLoadingGrocery] = useState(false);
  const [picker, setPicker] = useState(null); // { day, type }
  const [showShare, setShowShare] = useState(false);
  const savedPlanId = useRef(null);
  const savedPlanName = useRef(null);

  const CACHE_KEY = "bb_plan_grocery_cache";

  const todayStr = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD (local)

  const toggleStore = (s) => setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleSetting = (key) => setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasValidCache = () => {
    const cacheKey = JSON.stringify({ plan, enabled, diet, people, stores, macros, prepEnabled, lang: currentLanguage.code });
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
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ diet, people, stores })); } catch { /* ignore */ }
    setPlan(Array.from({ length: days }, () => ({ breakfast: "", lunch: "", dinner: "" })));
    setGrocery(null);
    setPhase("grid");
    // Prefill a full plan automatically — the default case should just work.
    autoFillMeals();
  };

  const setSlot = (d, type, value) =>
    setPlan((prev) => prev.map((day, i) => (i === d ? { ...day, [type]: value } : day)));

  // Instantly composes a plan from the curated dish catalog, filtered by diet.
  const autoFillMeals = () => {
    const pool = (type) => {
      let list = DISHES.filter((d) => d.type === type);
      if (enabled.diet && diet !== "balanced") {
        const filtered = list.filter((d) => d.diets.includes(diet));
        if (filtered.length) list = filtered;
      }
      return list;
    };
    const b = pool("breakfast");
    const l = pool("lunch");
    const dnr = pool("dinner");
    setPlan((prev) =>
      prev.map((day, i) => ({
        breakfast: localName(b[i % b.length], currentLanguage.code),
        lunch: localName(l[i % l.length], currentLanguage.code),
        dinner: localName(dnr[i % dnr.length], currentLanguage.code),
      }))
    );
  };

  const generateGrocery = async () => {
    // Reuse today's generated list if the plan hasn't changed (saves credits).
    const cacheKey = JSON.stringify({ plan, enabled, diet, people, stores, macros, prepEnabled, lang: currentLanguage.code });
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.key === cacheKey && cached.date === todayStr()) {
          setGrocery(cached.grocery);
          setPrep(cached.prep || null);
          setPhase("result");
          toast.success(t("usingCachedList"));
          return;
        }
      }
    } catch { /* ignore cache read errors */ }

    setLoadingGrocery(true);
    savedPlanId.current = null;
    try {
      const lines = plan
        .map((day, d) => {
          const parts = [];
          ["breakfast", "lunch", "dinner"].forEach((type) => {
            const name = day[type]?.trim();
            if (name) parts.push(`${type}: ${name}`);
          });
          return `Day ${d + 1}: ${parts.join(" | ")}`;
        })
        .join("\n");

      const groceryPromise = base44.integrations.Core.InvokeLLM({
        prompt: `Here is a user's meal plan for ${enabled.people ? people : 1} person(s) over ${plan.length} day(s)${enabled.diet ? ` on a ${diet} diet` : ""}:
${lines}
${enabled.macros ? `\nThe user's target macronutrient split is protein ${macros.protein}%, carbs ${macros.carbs}%, fats ${macros.fats}%.` : ""}

For each meal, determine the realistic ingredients and quantities needed for 1 person, then generate a consolidated grocery list for ${enabled.people ? people : 1} person(s) over the whole plan.
${enabled.macros ? "- Adjust ingredient quantities so the overall list delivers the target macro split as closely as possible (scale protein/carb/fat sources up or down accordingly)." : "- No specific macro target; use realistic balanced quantities."}
- Consolidate ingredients that repeat across days/meals into a single line with the TOTAL quantity needed for ${enabled.people ? people : 1} person(s).
- Use real 2024-2025 German supermarket branded product names from these stores: ${enabled.stores ? stores.join(", ") : "any German supermarket (Aldi, Lidl, REWE, Edeka, Penny, Netto)"}. Pick the cheapest store per item.
- quantity = total amount/package needed. price = unit_price × units needed for ${enabled.people ? people : 1} person(s) over ${plan.length} day(s).
- All item names in ${currentLanguage.label}, category names in English.
${enabled.diet && diet === "frozen" ? "- FROZEN MODE: only frozen ready-to-heat products." : ""}`,
        model: "gemini_3_flash",
        response_json_schema: {
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

      const prepPromise = prepEnabled
        ? base44.integrations.Core.InvokeLLM({
            model: "gemini_3_flash",
            prompt: `Here is a user's meal plan for ${people} person(s) over ${plan.length} day(s):
${lines}

For each day and each meal that has a name, write a short cooking guide. Return an array "days" with exactly ${plan.length} entries. For each meal object provide: "meal" (the meal name), "portion" (realistic portion size per person), and "prep" (2-4 short practical steps to cook it). Leave a meal object empty (meal: "") if the user left that slot blank. All text in ${currentLanguage.label}.`,
            response_json_schema: {
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
          })
        : null;

      // Show the grocery list the moment it's ready — don't block on the prep guide.
      const res = await groceryPromise;
      setGrocery(res);
      setPhase("result");

      // Cache so re-generation on the same plan is instant.
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ key: cacheKey, date: todayStr(), grocery: res, prep: null }));
      } catch { /* ignore cache write errors */ }

      // Auto-save to the library (fire-and-forget, doesn't block the UI).
      base44.entities.MealPlan.create({
        name: `${plan.length}-${t("days")} · ${new Date().toLocaleDateString(currentLanguage.code)}`,
        diet,
        people,
        stores: stores.join(", "),
        macros,
        plan,
        groceryList: res,
      })
        .then((rec) => {
          savedPlanId.current = rec?.id ?? null;
          savedPlanName.current = rec?.name ?? null;
          toast.success(t("planAutoSaved"));
          // Auto-sync the saved plan to Google Calendar when the user is connected (fire-and-forget).
          if (rec?.id) {
            base44.functions.invoke("googleCalendarSync", { planId: rec.id })
              .then(() => toast.success(t("calendarSynced") || "Synced to Google Calendar"))
              .catch(() => { /* not connected / not authenticated — ignore */ });
          }
        })
        .catch((e) => { console.error("Auto-save failed:", e); toast.error(t("planAutoSaveFailed")); });

      // Prep guide streams in afterwards and updates the result view when ready.
      if (prepPromise) {
        prepPromise
          .then(async (prepRes) => {
            setPrep(prepRes);
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify({ key: cacheKey, date: todayStr(), grocery: res, prep: prepRes }));
            } catch { /* ignore cache write errors */ }
            const id = savedPlanId.current;
            if (id) {
              try { await base44.entities.MealPlan.update(id, { prep: prepRes }); }
              catch (e) { console.error("Prep save failed:", e); }
            }
          })
          .catch(() => { /* prep is optional */ });
      }
    } catch {
      toast.error("Failed to build grocery list. Please try again.");
    } finally {
      setLoadingGrocery(false);
    }
  };

  const reset = () => { setPhase("setup"); setGrocery(null); };

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

  if (phase === "grid") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-editorial transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("back")}
          </button>
          <CreditBar variant="onLight" />
        </div>
        {loadingGrocery ? (
          <GeneratingLoader type="grocery" />
        ) : (
          <PlanGrid
            days={days}
            plan={plan}
            onPickSlot={(day, type) => setPicker({ day, type })}
            onSetSlot={setSlot}
            onAutoFill={autoFillMeals}
            onGenerate={handleGenerate}
            generating={loadingGrocery}
            prepEnabled={prepEnabled}
            setPrepEnabled={setPrepEnabled}
          />
        )}
        <DishPickerSheet
          open={!!picker}
          onClose={() => setPicker(null)}
          mealType={picker?.type}
          diet={enabled.diet ? diet : null}
          currentName={picker ? plan[picker.day]?.[picker.type] : ""}
          onPick={(name) => { if (picker) setSlot(picker.day, picker.type, name); setPicker(null); }}
          onClear={() => { if (picker) setSlot(picker.day, picker.type, ""); setPicker(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CreditBar variant="onLight" />
      <PlanSetup diet={diet} setDiet={setDiet} days={days} setDays={setDays} people={people} setPeople={setPeople} stores={stores} toggleStore={toggleStore} macros={macros} setMacros={setMacros} enabled={enabled} toggleSetting={toggleSetting} onBuild={startPlan} loading={false} />
    </div>
  );
}