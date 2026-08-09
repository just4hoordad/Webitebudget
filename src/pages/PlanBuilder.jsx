import { useState } from "react";
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
  const [library, setLibrary] = useState(null);
  const [plan, setPlan] = useState(null);
  const [grocery, setGrocery] = useState(null);
  const [loadingLib, setLoadingLib] = useState(false);
  const [loadingGrocery, setLoadingGrocery] = useState(false);

  const toggleStore = (s) => setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const rotatePlan = (libs) => {
    const byType = { breakfast: [], lunch: [], dinner: [] };
    libs.forEach((m, i) => { if (byType[m.meal_type]) byType[m.meal_type].push(i); });
    return Array.from({ length: days }, (_, d) => ({
      breakfast: byType.breakfast[d % Math.max(1, byType.breakfast.length)] ?? null,
      lunch: byType.lunch[d % Math.max(1, byType.lunch.length)] ?? null,
      dinner: byType.dinner[d % Math.max(1, byType.dinner.length)] ?? null,
    }));
  };

  const buildLibrary = async () => {
    setLoadingLib(true);
    setGrocery(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a meal library of 24 home-cooking meals for a ${diet} diet in Germany: 8 breakfasts, 8 lunches, 8 dinners.
All meal names and ingredient names in ${currentLanguage.label}.
Each meal: name, meal_type ("breakfast"|"lunch"|"dinner"), calories per 1 person, ingredients (array of {name, quantity} where quantity is per 1 person, e.g. "2 eggs", "150g oats").
Use common German grocery ingredients. Vary the meals so the plan is interesting.`,
        response_json_schema: {
          type: "object",
          properties: {
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  meal_type: { type: "string" },
                  calories: { type: "number" },
                  ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
                },
              },
            },
          },
        },
      });
      const meals = res.meals || [];
      setLibrary(meals);
      setPlan(rotatePlan(meals));
      setPhase("grid");
    } catch {
      toast.error("Failed to load meal library. Please try again.");
    } finally {
      setLoadingLib(false);
    }
  };

  const setSlot = (d, type, value) =>
    setPlan((prev) => prev.map((day, i) => (i === d ? { ...day, [type]: value } : day)));

  const autoFill = () => setPlan(rotatePlan(library));

  const generateGrocery = async () => {
    setLoadingGrocery(true);
    try {
      const lines = plan
        .map((day, d) => {
          const meals = ["breakfast", "lunch", "dinner"].map((type) => {
            const idx = day[type];
            if (idx == null || !library[idx]) return null;
            const m = library[idx];
            return `${type}: ${m.name} (${m.ingredients?.map((i) => `${i.name} ${i.quantity}`).join(", ")})`;
          }).filter(Boolean);
          return `Day ${d + 1}: ${meals.join(" | ")}`;
        })
        .join("\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Here is a user's meal plan for ${people} person(s) over ${plan.length} day(s) on a ${diet} diet:
${lines}

Generate a consolidated grocery list of everything needed to cook these meals for ${people} person(s).
- Consolidate ingredients that repeat across days/meals into a single line with the TOTAL quantity needed for ${people} person(s) over the whole plan.
- Use real 2024-2025 German supermarket branded product names from these stores: ${stores.join(", ")}. Pick the cheapest store per item.
- quantity = total amount/package needed. price = unit_price × units needed for ${people} person(s) over ${plan.length} day(s).
- All item names in ${currentLanguage.label}, category names in English.
${diet === "frozen" ? "- FROZEN MODE: only frozen ready-to-heat products." : ""}`,
        add_context_from_internet: true,
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
      setGrocery(res);
      setPhase("result");
    } catch {
      toast.error("Failed to build grocery list. Please try again.");
    } finally {
      setLoadingGrocery(false);
    }
  };

  const reset = () => { setPhase("setup"); setGrocery(null); };

  if (phase === "result" && grocery) {
    return <PlanGroceryResult grocery={grocery} days={plan.length} people={people} onReset={reset} />;
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
          <PlanGrid days={days} library={library} plan={plan} setSlot={setSlot} onAutoFill={autoFill} onGenerate={generateGrocery} generating={loadingGrocery} />
        )}
      </div>
    );
  }

  if (loadingLib) return <GeneratingLoader type="plan" />;
  return <PlanSetup diet={diet} setDiet={setDiet} days={days} setDays={setDays} people={people} setPeople={setPeople} stores={stores} toggleStore={toggleStore} onBuild={buildLibrary} loading={loadingLib} />;
}