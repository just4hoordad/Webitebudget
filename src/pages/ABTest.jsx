import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { buildGroceryPrompt, allowedStoreNames } from "@/lib/generateGroceries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FlaskConical, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const GROCERY_SCHEMA = {
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
                name: { type: "string" },
                quantity: { type: "string" },
                unit_price: { type: "number" },
                price: { type: "number" },
                normal_price: { type: "number" },
                store: { type: "string" },
                calories_info: { type: "string" },
                total_kcal: { type: "number" },
                protein_g: { type: "number" },
                carb_g: { type: "number" },
                fat_g: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};

const MEAL_PLAN_SCHEMA = {
  type: "object",
  properties: {
    weeks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week: { type: "number" },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                breakfast: { type: "string" },
                breakfast_calories: { type: "number" },
                breakfast_ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, quantity: { type: "string" } },
                  },
                },
                lunch: { type: "string" },
                lunch_calories: { type: "number" },
                lunch_ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, quantity: { type: "string" } },
                  },
                },
                dinner: { type: "string" },
                dinner_calories: { type: "number" },
                dinner_ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { name: { type: "string" }, quantity: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const MODELS = [
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", color: "bg-emerald-500" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", color: "bg-blue-500" },
];

function buildMealPlanPrompt(config) {
  const { calories, people, diet, days } = config;
  const sampleItems = "Oats 500g, Milk 1L, Eggs 10, Bananas 1kg, Chicken Breast 500g, Rice 1kg, Tomatoes 500g, Pasta 500g, Cheese 200g, Yogurt 500g, Bread 1 loaf, Bell Peppers 3 pack, Onions 1kg, Olive Oil 500ml, Frozen Berries 500g";
  const totalWeeks = Math.ceil(days / 7);
  return `Generate a meal plan. Return all text in English.

AVAILABLE PRODUCTS: ${sampleItems}
Diet type: ${diet}
Target calories per day: ${calories} kcal (breakfast_calories + lunch_calories + dinner_calories must add up to ~${calories} kcal every day)
Number of people: ${people}

CRITICAL RULES:
1. Use ONLY the products listed above — no substitutions or additions.
2. Divide product usage roughly equally across all ${totalWeeks} weeks.
3. For each meal, specify which product is used.
4. Make each week different — do NOT repeat the same meals across weeks.
5. Every meal must be a real, cookable dish combining products into a recognizable meal.

Calorie distribution: breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal.

Return a "weeks" array with exactly ${totalWeeks} objects. Each week has a "days" array of 7 days. Total days across all weeks MUST equal ${days}.`;
}

function GrocerySummary({ result }) {
  if (!result?.categories) return null;
  const items = result.categories.flatMap((c) => c.items || []);
  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const kcal = items.reduce((s, i) => s + (Number(i.total_kcal) || 0), 0);
  const stores = [...new Set(items.map((i) => i.store).filter(Boolean))];
  const totalMatch = Math.abs((Number(result.total_estimated_cost) || 0) - total) < Math.max(total * 0.1, 2);

  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Items</p>
          <p className="font-heading font-bold text-base">{items.length}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Sum of prices</p>
          <p className="font-heading font-bold text-base">€{total.toFixed(2)}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Total kcal</p>
          <p className="font-heading font-bold text-base">{kcal.toLocaleString()}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Stores used</p>
          <p className="font-heading font-bold text-base">{stores.length}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${totalMatch ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {totalMatch ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {totalMatch ? "Total matches sum" : "Total mismatch"}
        </span>
        <span className="text-muted-foreground">Reported: €{(Number(result.total_estimated_cost) || 0).toFixed(2)}</span>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        {result.categories.map((cat) => (
          <div key={cat.name} className="border-b border-border last:border-0">
            <p className="font-semibold px-3 py-1.5 bg-muted/50 text-[11px] uppercase tracking-wide">{cat.name}</p>
            {cat.items?.map((item, i) => (
              <div key={i} className="px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate">{item.name} <span className="text-muted-foreground">({item.quantity})</span></span>
                <span className="font-medium shrink-0">€{(Number(item.price) || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MealPlanSummary({ result }) {
  const weeks = result?.weeks || [];
  const allDays = weeks.flatMap((w) => w.days || []);
  const totalCal = allDays.reduce((s, d) => s + (d.breakfast_calories || 0) + (d.lunch_calories || 0) + (d.dinner_calories || 0), 0);
  const avgCal = allDays.length > 0 ? Math.round(totalCal / allDays.length) : 0;

  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Weeks</p>
          <p className="font-heading font-bold text-base">{weeks.length}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Days</p>
          <p className="font-heading font-bold text-base">{allDays.length}</p>
        </div>
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-muted-foreground">Avg kcal/day</p>
          <p className="font-heading font-bold text-base">{avgCal}</p>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        {weeks.map((week, wi) => (
          <div key={wi} className="border-b border-border last:border-0">
            <p className="font-semibold px-3 py-1.5 bg-muted/50 text-[11px] uppercase tracking-wide">Week {week.week || wi + 1}</p>
            {week.days?.map((day, di) => (
              <div key={di} className="px-3 py-1.5 border-t border-border/50">
                <p className="font-medium text-[11px]">{day.day} — {day.breakfast_calories + day.lunch_calories + day.dinner_calories} kcal</p>
                <p className="text-muted-foreground text-[10px] truncate">🍳 {day.breakfast} · 🥪 {day.lunch} · 🍽 {day.dinner}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelPanel({ model, state }) {
  const { label, color } = MODELS.find((m) => m.id === model) || { label: model, color: "bg-gray-500" };
  const isGrocery = state.testType === "grocery";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h3 className="font-heading font-semibold text-sm">{label}</h3>
        {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
        {state.status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
        {state.status === "error" && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
      </div>

      {state.status === "idle" && (
        <p className="text-xs text-muted-foreground">Waiting for test run…</p>
      )}
      {state.status === "loading" && (
        <p className="text-xs text-muted-foreground animate-pulse">Generating…</p>
      )}
      {state.status === "error" && (
        <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}
      {state.status === "ok" && state.result && (
        isGrocery ? <GrocerySummary result={state.result} /> : <MealPlanSummary result={state.result} />
      )}
      {state.status === "ok" && state.result && (
        <details className="text-[10px]">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Raw JSON</summary>
          <pre className="mt-1 max-h-48 overflow-auto bg-muted rounded p-2 text-[9px] leading-tight">{JSON.stringify(state.result, null, 2)}</pre>
        </details>
      )}
    </Card>
  );
}

export default function ABTest() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const [testType, setTestType] = useState("grocery");
  const [config, setConfig] = useState({
    budget: 150,
    stores: "Aldi, Lidl",
    diet: "balanced",
    calories: 2000,
    days: 7,
    people: 1,
  });
  const [running, setRunning] = useState(false);
  const [states, setStates] = useState({
    "openai/gpt-5-nano": { status: "idle", testType: "grocery" },
    "google/gemini-2.5-flash": { status: "idle", testType: "grocery" },
  });

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const runTest = async () => {
    setRunning(true);
    const allowed = allowedStoreNames(config.stores);
    const schema = testType === "grocery"
      ? (allowed.length ? { ...GROCERY_SCHEMA, properties: { ...GROCERY_SCHEMA.properties } } : GROCERY_SCHEMA)
      : MEAL_PLAN_SCHEMA;
    const prompt = testType === "grocery"
      ? buildGroceryPrompt(config, "English")
      : buildMealPlanPrompt(config);

    setStates({
      "openai/gpt-5-nano": { status: "loading", testType },
      "google/gemini-2.5-flash": { status: "loading", testType },
    });

    try {
      const res = await base44.functions.invoke("abTestModels", {
        prompt,
        response_json_schema: schema,
        models: ["openai/gpt-5-nano", "google/gemini-2.5-flash"],
      });
      const results = res?.data?.results || res?.results || [];
      const next = {
        "openai/gpt-5-nano": { status: "idle", testType },
        "google/gemini-2.5-flash": { status: "idle", testType },
      };
      for (const r of results) {
        if (r.status === "ok") {
          next[r.model] = { status: "ok", result: r.result, testType };
        } else {
          next[r.model] = { status: "error", error: r.error, testType };
        }
      }
      setStates(next);
    } catch (e) {
      const msg = e?.message || "Test failed";
      setStates({
        "openai/gpt-5-nano": { status: "error", error: msg, testType },
        "google/gemini-2.5-flash": { status: "error", error: msg, testType },
      });
    } finally {
      setRunning(false);
    }
  };

  if (isLoadingAuth) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-3">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h1 className="font-heading text-xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground">This temporary A/B test page is restricted to admins.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-2.5">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">A/B Test: GPT-5 Nano vs Gemini 2.5 Flash</h1>
          <p className="text-xs text-muted-foreground">Temporary admin-only comparison · no results are saved</p>
        </div>
      </div>

      {/* Test type toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={testType === "grocery" ? "default" : "outline"}
          onClick={() => setTestType("grocery")}
        >
          Grocery Generation
        </Button>
        <Button
          size="sm"
          variant={testType === "meal-plan" ? "default" : "outline"}
          onClick={() => setTestType("meal-plan")}
        >
          Meal Plan Generation
        </Button>
      </div>

      {/* Config */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Test Configuration</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Budget (€)</span>
            <input
              type="number"
              value={config.budget}
              onChange={(e) => updateConfig("budget", Number(e.target.value))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
              disabled={testType === "meal-plan"}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Calories/day</span>
            <input
              type="number"
              value={config.calories}
              onChange={(e) => updateConfig("calories", Number(e.target.value))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Days</span>
            <input
              type="number"
              value={config.days}
              onChange={(e) => updateConfig("days", Number(e.target.value))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">People</span>
            <input
              type="number"
              value={config.people}
              onChange={(e) => updateConfig("people", Number(e.target.value))}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
            />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-muted-foreground">Stores</span>
            <input
              type="text"
              value={config.stores}
              onChange={(e) => updateConfig("stores", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
              disabled={testType === "meal-plan"}
            />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-muted-foreground">Diet</span>
            <select
              value={config.diet}
              onChange={(e) => updateConfig("diet", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
            >
              <option value="balanced">Balanced</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="high-protein">High Protein</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="frozen">Frozen</option>
            </select>
          </label>
        </div>
        <Button onClick={runTest} disabled={running} className="w-full gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {running ? "Running test…" : "Run A/B Test"}
        </Button>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ModelPanel model="openai/gpt-5-nano" state={states["openai/gpt-5-nano"]} />
        <ModelPanel model="google/gemini-2.5-flash" state={states["google/gemini-2.5-flash"]} />
      </div>
    </div>
  );
}