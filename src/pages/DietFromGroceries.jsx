import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import DayMeals from "@/components/DayMeals";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DietFromGroceries() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const params = new URLSearchParams(location.search);
  const ingredients = params.get("ingredients") || "";
  const planType = params.get("planType") || "weekly";

  const generateDiet = async () => {
    if (!ingredients) return;
    setLoading(true);
    setError(null);

    const isMonthly = planType === "monthly";
    const repeatNote = !isMonthly
      ? " Repeat the same meals across multiple days to save money — budget-friendly repetition is encouraged."
      : " Provide a full 4-week variety plan, but only use the provided ingredients.";

    const prompt = `You are a nutrition expert. A student has these groceries and wants a ${isMonthly ? "monthly (4-week)" : "weekly (7-day)"} meal plan using ONLY what they have.

Ingredients available: ${ingredients}

Create a 7-day meal plan (Monday–Sunday) with Breakfast, Lunch, and Dinner for each day using ONLY the listed ingredients.${repeatNote}

Be creative but realistic — combine the ingredients into proper meals. Do not add ingredients not in the list.

Return ONLY valid JSON:
{
  "days": {
    "Monday": [
      {"name": "string", "description": "string", "ingredients": ["string"], "instructions": ["string"], "cost": 0, "calories": number, "prepTime": number, "type": "Breakfast", "nutrition": {"protein": number, "carbs": number, "fat": number, "fiber": number}}
    ],
    "Tuesday": [...],
    "Wednesday": [...],
    "Thursday": [...],
    "Friday": [...],
    "Saturday": [...],
    "Sunday": [...]
  },
  "tips": ["string"]
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            days: { type: "object" },
            tips: { type: "array", items: { type: "string" } },
          },
        },
        model: "gemini_3_flash",
      });
      setPlan(result);
    } catch (err) {
      setError("Failed to generate diet plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateDiet();
  }, [location.search]);

  const ingredientList = ingredients.split(",").filter(Boolean);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/meal-plan">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold">Diet From Your Groceries</h1>
            <p className="text-sm text-muted-foreground">
              {planType === "monthly" ? "Monthly" : "Weekly"} plan • {ingredientList.length} ingredient{ingredientList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={generateDiet} variant="outline" className="rounded-xl gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Regenerate</span>
        </Button>
      </div>

      {/* Ingredients used */}
      {ingredientList.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ingredients used</p>
          <div className="flex flex-wrap gap-2">
            {ingredientList.map((ing, i) => (
              <span key={i} className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="text-center">
            <h2 className="font-heading font-semibold text-lg">Creating your diet plan...</h2>
            <p className="text-sm text-muted-foreground mt-1">Using your {ingredientList.length} selected ingredients</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={generateDiet}>Try Again</Button>
        </div>
      )}

      {!loading && !error && plan && (
        <div className="space-y-6">
          {DAYS.map((day) => (
            <DayMeals key={day} day={day} meals={plan.days?.[day] || []} />
          ))}

          {plan.tips?.length > 0 && (
            <div className="bg-secondary/50 rounded-2xl p-5">
              <h3 className="font-heading font-semibold mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.tips.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}