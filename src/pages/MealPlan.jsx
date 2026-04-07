import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, RefreshCw, Euro, Flame } from "lucide-react";
import DayMeals from "../components/DayMeals";
import GroceryList from "../components/GroceryList";
import ShoppingList from "../components/ShoppingList";
import NutritionSummary from "../components/NutritionSummary";
import StoreComparison from "../components/StoreComparison";
import StoreMap from "../components/StoreMap";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MealPlan() {
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();

  const urlParams = new URLSearchParams(location.search);
  const budget = urlParams.get("budget") || "150";
  const stores = urlParams.get("stores") || "aldi,lidl";
  const diet = urlParams.get("diet") || "balanced";
  const people = urlParams.get("people") || "1";
  const planType = urlParams.get("planType") || "weekly";
  const ingredients = urlParams.get("ingredients") || "";

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    // Always read fresh params to avoid stale closure
    const freshParams = new URLSearchParams(window.location.search);
    const freshPlanType = freshParams.get("planType") || "weekly";
    const freshIngredients = freshParams.get("ingredients") || "";
    const freshBudget = freshParams.get("budget") || budget;
    const freshDiet = freshParams.get("diet") || diet;
    const freshPeople = freshParams.get("people") || people;

    const isMonthly = freshPlanType === "monthly";
    const ingredientHint = freshIngredients ? `\n\nYou MUST use ONLY these ingredients to build the meal plan: ${freshIngredients}. Do not add other ingredients.` : "";
    const repeatNote = !isMonthly ? "\n\nIMPORTANT: This is a WEEKLY plan for budget savings — repeat the same meals on multiple days (e.g. same lunch 3-4 days in a row). Keep variety only between Breakfast/Lunch/Dinner types." : "";

    const prompt = `You are a nutrition and budget expert for students living in Germany. 
Create a detailed 7-day meal plan (Monday to Sunday) with 3 meals per day (Breakfast, Lunch, Dinner).${repeatNote}${ingredientHint}

Also provide:
1. A consolidated weekly shopping list with item name, quantity, estimated price, and which store is cheapest for that item
2. Daily average nutrition (calories, protein g, carbs g, fat g) with recommended targets
3. A cost breakdown per store showing total weekly cost if you shopped there

Return ONLY valid JSON in this exact format:
{
  "weeklyBudget": number,
  "totalWeeklyCost": number,
  "days": {
    "Monday": [
      {"name": "string", "description": "string", "ingredients": ["string"], "instructions": ["string"], "cost": number, "calories": number, "prepTime": number, "type": "Breakfast", "nutrition": {"protein": number, "carbs": number, "fat": number, "fiber": number}}
    ]
  },
  "shoppingList": [
    {"name": "string", "quantity": "string", "price": number, "store": "string"}
  ],
  "nutrition": {
    "calories": number, "caloriesTarget": number,
    "protein": number, "proteinTarget": number,
    "carbs": number, "carbsTarget": number,
    "fat": number, "fatTarget": number
  },
  "storeBreakdown": [
    {"id": "string", "name": "string", "total": number}
  ],
  "tips": ["string"]
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            weeklyBudget: { type: "number" },
            totalWeeklyCost: { type: "number" },
            days: { type: "object" },
            shoppingList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  price: { type: "number" },
                  store: { type: "string" },
                },
              },
            },
            nutrition: {
              type: "object",
              properties: {
                calories: { type: "number" },
                caloriesTarget: { type: "number" },
                protein: { type: "number" },
                proteinTarget: { type: "number" },
                carbs: { type: "number" },
                carbsTarget: { type: "number" },
                fat: { type: "number" },
                fatTarget: { type: "number" },
              },
            },
            storeBreakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  total: { type: "number" },
                },
              },
            },
            tips: { type: "array", items: { type: "string" } },
          },
        },
        model: "gemini_3_flash",
      });
      setMealPlan(result);
    } catch (err) {
      setError("Failed to generate meal plan. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePlan();
  }, [location.search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-heading font-semibold text-lg">Creating your meal plan...</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing prices across {stores.split(",").join(", ")} stores
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={generatePlan}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold">Your Meal Plan</h1>
            <p className="text-sm text-muted-foreground">
              {planType === "monthly" ? "Monthly" : "Weekly"} • {diet} diet • €{budget}/month • {people} person(s)
            </p>
          </div>
        </div>
        <Button onClick={generatePlan} variant="outline" className="rounded-xl gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Regenerate</span>
        </Button>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Weekly Budget"
          value={`€${(parseFloat(budget) / 4.33).toFixed(0)}`}
          icon={Euro}
        />
        <SummaryCard
          label="Weekly Cost"
          value={`€${mealPlan?.totalWeeklyCost?.toFixed(2) || "—"}`}
          icon={Euro}
          highlight
        />
        <SummaryCard
          label="Daily Calories"
          value={`${mealPlan?.nutrition?.calories || "—"}`}
          icon={Flame}
        />
        <SummaryCard
          label="Savings"
          value={`€${((parseFloat(budget) / 4.33) - (mealPlan?.totalWeeklyCost || 0)).toFixed(2)}`}
          icon={Euro}
        />
      </div>

      <Tabs defaultValue="meals" className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-12 rounded-xl">
          <TabsTrigger value="meals" className="rounded-lg">Meals</TabsTrigger>
          <TabsTrigger value="grocery" className="rounded-lg">Grocery</TabsTrigger>
          <TabsTrigger value="map" className="rounded-lg">Map</TabsTrigger>
          <TabsTrigger value="shopping" className="rounded-lg">Shopping</TabsTrigger>
          <TabsTrigger value="nutrition" className="rounded-lg">Nutrition</TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-6 mt-6">
          {DAYS.map((day) => {
            const meals = mealPlan?.days?.[day] || [];
            return <DayMeals key={day} day={day} meals={meals} />;
          })}
        </TabsContent>

        <TabsContent value="grocery" className="space-y-6 mt-6">
          <GroceryList items={mealPlan?.shoppingList || []} />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <StoreMap shoppingList={mealPlan?.shoppingList || []} />
        </TabsContent>

        <TabsContent value="shopping" className="space-y-6 mt-6">
          <StoreComparison storeBreakdown={mealPlan?.storeBreakdown} />
          <ShoppingList items={mealPlan?.shoppingList || []} />
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6 mt-6">
          {mealPlan?.nutrition && (
            <NutritionSummary nutrition={mealPlan.nutrition} />
          )}
          {mealPlan?.tips && mealPlan.tips.length > 0 && (
            <div className="bg-secondary/50 rounded-2xl p-5">
              <h3 className="font-heading font-semibold mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {mealPlan.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`font-heading font-bold text-xl ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}