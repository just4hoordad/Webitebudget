import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShoppingBasket, X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function MealPlan() {
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") || 150;
  const stores = params.get("stores") || "aldi,lidl";
  const diet = params.get("diet") || "balanced";
  const people = params.get("people") || 1;
  const calories = params.get("calories") || 2000;

  const [groceries, setGroceries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState(new Set());
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    generateGroceries();
  }, []);

  const generateGroceries = async () => {
    setRemovedItems(new Set());
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a list of groceries for a ${diet} diet for ${people} person(s) in Germany with a monthly budget of €${budget}.
The target is ~${calories} kcal/day per person.

For EACH item, find the CHEAPEST price across these stores: ${stores}.
Only list the cheapest option for each product (show which store it's from).
Return realistic German supermarket products with accurate prices.
Group items by category (e.g. Proteins, Vegetables, Grains, Dairy, Snacks).
Make sure the total cost fits within the €${budget} monthly budget.`,
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
                      name: { type: "string" },
                      quantity: { type: "string" },
                      price: { type: "number" },
                      store: { type: "string" },
                      calories_info: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    setGroceries(result);
    setLoading(false);
  };

  const removeItem = (categoryName, itemName) => {
    setRemovedItems(prev => new Set([...prev, `${categoryName}::${itemName}`]));
    setWeeklyPlan(null);
  };

  const generateWeeklyPlan = async () => {
    const availableItems = groceries?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => item.name)
    ).join(", ");

    setLoadingPlan(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a 7-day meal plan using ONLY these ingredients: ${availableItems}

Generate meals for all 7 days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
Diet type: ${diet}
Target calories per day: ${calories} kcal
Number of people: ${people}

For each of the 7 days, include breakfast, lunch, and dinner with calorie counts.
Distribute calories: breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal.
All ingredients must come from the list above only.`,
      response_json_schema: {
        type: "object",
        properties: {
          days: {
            type: "array",
            minItems: 7,
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                breakfast: { type: "string" },
                breakfast_calories: { type: "number" },
                breakfast_ingredients: { type: "string" },
                lunch: { type: "string" },
                lunch_calories: { type: "number" },
                lunch_ingredients: { type: "string" },
                dinner: { type: "string" },
                dinner_calories: { type: "number" },
                dinner_ingredients: { type: "string" }
              }
            }
          }
        }
      }
    });
    setWeeklyPlan({ weeks: [{ week: 1, days: result.days || [] }] });
    setLoadingPlan(false);
  };

  const saveMealPlan = async () => {
    if (!weeklyPlan) return;
    setSaving(true);
    try {
      await base44.entities.MealPlan.create({
        name: `${diet} Meal Plan - ${new Date().toLocaleDateString()}`,
        diet,
        budget: parseFloat(budget),
        calories: parseFloat(calories),
        people: parseFloat(people),
        stores,
        plan: weeklyPlan.weeks[0]
      });
      toast.success("Meal plan saved!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save meal plan: " + (error?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Your Grocery List</h1>
          <p className="text-sm text-muted-foreground">
            {diet} diet · €{budget}/month · {calories} kcal/day · {people} person(s)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Generating your personalized grocery list...</p>
        </div>
      ) : (
        <>
          {/* Budget Summary */}
          <div className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <span className="font-heading font-semibold text-foreground">Estimated Total</span>
              </div>
              <span className="font-heading text-2xl font-bold text-primary">
                €{groceries?.total_estimated_cost?.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Your Budget</p>
                <p className="font-heading text-lg font-bold text-foreground">€{parseFloat(budget).toFixed(2)}</p>
              </div>
              <div className={`bg-card border rounded-xl px-4 py-3 ${
                groceries?.total_estimated_cost <= budget
                  ? 'border-green-200/50'
                  : 'border-destructive/30'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className={`font-heading text-lg font-bold ${
                  groceries?.total_estimated_cost <= budget
                    ? 'text-green-600'
                    : 'text-destructive'
                }`}>
                  €{(parseFloat(budget) - groceries?.total_estimated_cost).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          {groceries?.categories?.map((category) => (
           <div key={category.name} className="bg-card border border-border rounded-xl overflow-hidden">
             <div className="bg-secondary px-5 py-3">
               <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
                 {category.name}
               </h2>
             </div>
             <div className="divide-y divide-border">
               {category.items?.filter(item => !removedItems.has(`${category.name}::${item.name}`)).map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group">
                   <div className="flex-1">
                     <p className="font-medium text-foreground">{item.name}</p>
                     <p className="text-xs text-muted-foreground">{item.quantity} · {item.calories_info}</p>
                   </div>
                   <div className="flex items-center gap-3 ml-4">
                     <div className="text-right">
                       <p className="font-semibold text-foreground">€{item.price?.toFixed(2)}</p>
                       {item.store && <p className="text-xs text-muted-foreground">{item.store}</p>}
                     </div>
                     <button
                       onClick={() => removeItem(category.name, item.name)}
                       className="text-muted-foreground hover:text-destructive transition-colors"
                     >
                       <X className="h-4 w-4" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
          ))}

          {/* Generate Weekly Plan Button */}
          {!weeklyPlan && (
           <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3">
             <div>
               <h3 className="font-heading font-semibold">4-Week Meal Plan</h3>
               <p className="text-sm text-muted-foreground">Generate a personalized 4-week diet based on your grocery list.</p>
             </div>
             <Button onClick={generateWeeklyPlan} disabled={loadingPlan} className="w-full gap-2">
               {loadingPlan ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Plan...</> : "Generate 4-Week Meal Plan"}
             </Button>
           </div>
          )}

          {/* Weekly Plan Display */}
          {weeklyPlan?.weeks?.[0] && (
           <div className="bg-card border border-border rounded-xl overflow-hidden">
             <div className="bg-primary px-5 py-3">
               <h2 className="font-heading font-semibold text-primary-foreground">Your Weekly Meal Plan</h2>
             </div>
             <div className="divide-y divide-border">
               {weeklyPlan.weeks[0].days?.map((day, idx) => (
                 <div key={`${idx}`} className="px-5 py-4 grid grid-cols-4 gap-3 text-sm items-start">
                   <div className="font-semibold text-foreground col-span-4 border-b border-border pb-1 mb-1">{day.day}</div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">Breakfast {day.breakfast_calories && <span className="text-primary">({day.breakfast_calories} kcal)</span>}</span>
                     <span>{day.breakfast}</span>
                     {day.breakfast_ingredients && <p className="text-xs text-primary/70 mt-1 italic">{day.breakfast_ingredients}</p>}
                   </div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">Lunch {day.lunch_calories && <span className="text-primary">({day.lunch_calories} kcal)</span>}</span>
                     <span>{day.lunch}</span>
                     {day.lunch_ingredients && <p className="text-xs text-primary/70 mt-1 italic">{day.lunch_ingredients}</p>}
                   </div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">Dinner {day.dinner_calories && <span className="text-primary">({day.dinner_calories} kcal)</span>}</span>
                     <span>{day.dinner}</span>
                     {day.dinner_ingredients && <p className="text-xs text-primary/70 mt-1 italic">{day.dinner_ingredients}</p>}
                   </div>
                 </div>
               ))}
             </div>
             <div className="bg-muted px-5 py-3 flex items-center justify-between">
               <p className="text-xs text-muted-foreground">💡 Repeat this weekly plan for 4 weeks to build your 4-week meal schedule.</p>
               <Button onClick={saveMealPlan} disabled={saving} size="sm" className="gap-2">
                 <Save className="h-4 w-4" />
                 {saving ? "Saving..." : "Save Plan"}
               </Button>
             </div>
             </div>
             )}

             <div className="pb-8">
            <Button onClick={generateGroceries} variant="outline" className="w-full">
              Regenerate Grocery List
            </Button>
          </div>
        </>
      )}
    </div>
  );
}