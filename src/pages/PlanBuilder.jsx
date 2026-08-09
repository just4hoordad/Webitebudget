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
  const [plan, setPlan] = useState(null);
  const [grocery, setGrocery] = useState(null);
  const [loadingGrocery, setLoadingGrocery] = useState(false);

  const toggleStore = (s) => setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const startPlan = () => {
    setPlan(Array.from({ length: days }, () => ({ breakfast: "", lunch: "", dinner: "" })));
    setGrocery(null);
    setPhase("grid");
  };

  const setSlot = (d, type, value) =>
    setPlan((prev) => prev.map((day, i) => (i === d ? { ...day, [type]: value } : day)));

  const generateGrocery = async () => {
    setLoadingGrocery(true);
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

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Here is a user's meal plan for ${people} person(s) over ${plan.length} day(s) on a ${diet} diet:
${lines}

For each meal, determine the realistic ingredients and quantities needed for 1 person, then generate a consolidated grocery list for ${people} person(s) over the whole plan.
- Consolidate ingredients that repeat across days/meals into a single line with the TOTAL quantity needed for ${people} person(s).
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
          <PlanGrid days={days} plan={plan} setSlot={setSlot} onGenerate={generateGrocery} generating={loadingGrocery} />
        )}
      </div>
    );
  }

  return <PlanSetup diet={diet} setDiet={setDiet} days={days} setDays={setDays} people={people} setPeople={setPeople} stores={stores} toggleStore={toggleStore} onBuild={startPlan} loading={false} />;
}