import { useState, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PlanSetup from "@/components/planbuilder/PlanSetup";
import PlanGrid from "@/components/planbuilder/PlanGrid";
import PlanGroceryResult from "@/components/planbuilder/PlanGroceryResult";
import GeneratingLoader from "@/components/GeneratingLoader";
import { ArrowLeft } from "lucide-react";

export default function PlanBuilder() {
  const { t, currentLanguage } = useLanguage();
  const [phase, setPhase] = useState("setup");
  const [diet, setDiet] = useState("balanced");
  const [days, setDays] = useState(7);
  const [people, setPeople] = useState(1);
  const [stores, setStores] = useState(["Aldi", "Lidl"]);
  const [plan, setPlan] = useState(null);
  const [grocery, setGrocery] = useState(null);
  const [prep, setPrep] = useState(null);
  const [loadingGrocery, setLoadingGrocery] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const savedPlanId = useRef(null);

  const CACHE_KEY = "bb_plan_grocery_cache";

  const todayStr = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD (local)

  const toggleStore = (s) => setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const startPlan = () => {
    setPlan(Array.from({ length: days }, () => ({ breakfast: "", lunch: "", dinner: "" })));
    setGrocery(null);
    setPhase("grid");
  };

  const setSlot = (d, type, value) =>
    setPlan((prev) => prev.map((day, i) => (i === d ? { ...day, [type]: value } : day)));

  const autoFillMeals = async () => {
    setAutofilling(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a ${plan.length}-day meal plan for ${people} person(s) on a ${diet} diet in Germany.
Return exactly ${plan.length} days, each with a breakfast, lunch and dinner. All meal names in ${currentLanguage.label}.
Keep names short and realistic (home cooking). Vary meals across days so it's not repetitive.`,
        response_json_schema: {
          type: "object",
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  breakfast: { type: "string" },
                  lunch: { type: "string" },
                  dinner: { type: "string" },
                },
              },
            },
          },
        },
      });
      const filled = res.days || [];
      setPlan((prev) =>
        prev.map((day, i) =>
          filled[i]
            ? { breakfast: filled[i].breakfast || "", lunch: filled[i].lunch || "", dinner: filled[i].dinner || "" }
            : day
        )
      );
    } catch {
      toast.error("Autofill failed. Please try again.");
    } finally {
      setAutofilling(false);
    }
  };

  const generateGrocery = async () => {
    // Reuse today's generated list if the plan hasn't changed (saves credits).
    const cacheKey = JSON.stringify({ plan, diet, people, stores, lang: currentLanguage.code });
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
        prompt: `Here is a user's meal plan for ${people} person(s) over ${plan.length} day(s) on a ${diet} diet:
${lines}

For each meal, determine the realistic ingredients and quantities needed for 1 person, then generate a consolidated grocery list for ${people} person(s) over the whole plan.
- Consolidate ingredients that repeat across days/meals into a single line with the TOTAL quantity needed for ${people} person(s).
- Use real 2024-2025 German supermarket branded product names from these stores: ${stores.join(", ")}. Pick the cheapest store per item.
- quantity = total amount/package needed. price = unit_price × units needed for ${people} person(s) over ${plan.length} day(s).
- All item names in ${currentLanguage.label}, category names in English.
${diet === "frozen" ? "- FROZEN MODE: only frozen ready-to-heat products." : ""}`,
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

      const prepPromise = base44.integrations.Core.InvokeLLM({
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
      });

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
        plan,
        groceryList: res,
      })
        .then((rec) => { savedPlanId.current = rec?.id ?? null; toast.success(t("planAutoSaved")); })
        .catch((e) => { console.error("Auto-save failed:", e); toast.error(t("planAutoSaveFailed")); });

      // Prep guide streams in afterwards and updates the result view when ready.
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
    } catch {
      toast.error("Failed to build grocery list. Please try again.");
    } finally {
      setLoadingGrocery(false);
    }
  };

  const reset = () => { setPhase("setup"); setGrocery(null); };

  if (phase === "result" && grocery) {
    return <PlanGroceryResult grocery={grocery} prep={prep} days={plan.length} people={people} onReset={reset} />;
  }

  if (phase === "grid") {
    return (
      <div className="space-y-5">
        <button onClick={reset} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>
        {loadingGrocery ? (
          <GeneratingLoader type="grocery" />
        ) : (
          <PlanGrid days={days} plan={plan} setSlot={setSlot} onAutoFill={autoFillMeals} autofilling={autofilling} onGenerate={generateGrocery} generating={loadingGrocery} />
        )}
      </div>
    );
  }

  return <PlanSetup diet={diet} setDiet={setDiet} days={days} setDays={setDays} people={people} setPeople={setPeople} stores={stores} toggleStore={toggleStore} onBuild={startPlan} loading={false} />;
}