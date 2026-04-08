import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShoppingBasket, X, Save, FileDown, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
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
      prompt: `Generate a grocery list for a ${diet} diet for ${people} person(s) in Germany with a STRICT monthly budget of €${budget}.
The target is ~${calories} kcal/day per person.

CRITICAL REQUIREMENTS:
1. Look up REAL, CURRENT prices from these German supermarkets: ${stores}
2. Use actual product names and exact current prices as found on their websites or apps
3. For EACH item, find the CHEAPEST price across the selected stores and note which store it's from
4. The TOTAL estimated cost MUST be as close as possible to €${budget} (ideally within ±5%)
5. Return realistic German supermarket products with ACCURATE, REAL prices you find online
6. Group items by category (e.g. Proteins, Vegetables, Grains, Dairy, Snacks)
7. Prioritize cost-effective ingredients to maximize nutrition while hitting the budget target
8. If the total is below budget, add more items; if above, remove less essential items

The grocery list must last exactly 1 month and support a ${diet} diet at ~${calories} kcal/day.`,
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

  const getActiveItems = () =>
    groceries?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => ({ ...item, category: cat.name }))
    ) || [];

  const activeTotal = getActiveItems().reduce((sum, item) => sum + (item.price || 0), 0);

  const exportCSV = () => {
    const items = getActiveItems();
    const rows = [["Category", "Item", "Quantity", "Price (€)", "Store", "Calories Info"]];
    items.forEach(item => rows.push([item.category, item.name, item.quantity, item.price?.toFixed(2), item.store || "", item.calories_info || ""]));
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "TOTAL", "", groceries?.total_estimated_cost?.toFixed(2), "", ""]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grocery-list-${diet}-${budget}eur.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const items = getActiveItems();
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("BudgetBite Grocery List", 14, 18);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Diet: ${diet} | Budget: €${budget}/month | ${calories} kcal/day | ${people} person(s)`, 14, 26);
    doc.text(`Stores: ${stores}`, 14, 32);
    let y = 42;
    let currentCategory = "";
    items.forEach(item => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont(undefined, "bold");
        doc.setFontSize(11);
        doc.text(currentCategory.toUpperCase(), 14, y);
        y += 6;
        doc.setFont(undefined, "normal");
        doc.setFontSize(9);
      }
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(`• ${item.name}`, 16, y);
      doc.text(item.quantity || "", 90, y);
      doc.text(`€${item.price?.toFixed(2)}`, 140, y);
      doc.text(item.store || "", 162, y);
      y += 6;
    });
    y += 4;
    doc.setFont(undefined, "bold");
    doc.setFontSize(11);
    doc.text(`Total: €${groceries?.total_estimated_cost?.toFixed(2)}`, 14, y);
    doc.save(`grocery-list-${diet}-${budget}eur.pdf`);
  };

  const generateWeeklyPlan = async () => {
    const availableItems = groceries?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => `${item.name} (${item.quantity})`)
    ).join(", ");

    setLoadingPlan(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a complete 7-day meal plan that will repeat for exactly 4 weeks (28 days total).

AVAILABLE INGREDIENTS (TOTAL for the entire month = 4 weeks):
${availableItems}

Diet type: ${diet}
Target calories per day: ${calories} kcal
Number of people: ${people}

CRITICAL RULES:
1. Use ONLY the ingredients listed above — no substitutions or additions
2. The quantities listed are the TOTAL available for the ENTIRE MONTH (4 weeks)
3. Your 7-day plan will be repeated exactly 4 times. So the total ingredient usage across 4 repetitions MUST NOT exceed the listed quantities
4. For each meal, specify EXACTLY how much of each ingredient is used per day
5. Verify: (daily usage × 28 days) ≤ total monthly quantity for every ingredient
6. Distribute all ingredients as evenly as possible — don't waste any
7. If an ingredient like "Hackfleisch 2.4kg" is available, plan to use exactly 2.4kg across 28 days (e.g. 85g/day)

For EACH of the 7 days, provide breakfast, lunch, and dinner with:
- Meal name
- Exact calorie count
- List of ingredients with precise quantities used that day

Calorie distribution: breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal.

RETURN EXACTLY 7 days with no gaps or missing days.`,
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
                breakfast_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
                lunch: { type: "string" },
                lunch_calories: { type: "number" },
                lunch_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
                dinner: { type: "string" },
                dinner_calories: { type: "number" },
                dinner_ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } }
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
                €{activeTotal.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Your Budget</p>
                <p className="font-heading text-lg font-bold text-foreground">€{parseFloat(budget).toFixed(2)}</p>
              </div>
              <div className={`bg-card border rounded-xl px-4 py-3 ${
                activeTotal <= budget
                  ? 'border-green-200/50'
                  : 'border-destructive/30'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className={`font-heading text-lg font-bold ${
                  activeTotal <= budget
                    ? 'text-green-600'
                    : 'text-destructive'
                }`}>
                  €{(parseFloat(budget) - activeTotal).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 justify-end">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {/* Items grouped by store */}
          {(() => {
            const allItems = groceries?.categories?.flatMap(cat =>
              cat.items
                .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
                .map(item => ({ ...item, category: cat.name }))
            ) || [];
            const byStore = allItems.reduce((acc, item) => {
              const store = item.store || "Other";
              if (!acc[store]) acc[store] = [];
              acc[store].push(item);
              return acc;
            }, {});
            return Object.entries(byStore).map(([store, items]) => (
              <div key={store} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary px-5 py-3">
                  <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
                    🛒 {store}
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} · {item.calories_info} · <span className="text-muted-foreground/60">{item.category}</span></p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">€{item.price?.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.category, item.name)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

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
                     {Array.isArray(day.breakfast_ingredients) && day.breakfast_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.breakfast_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                   </div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">Lunch {day.lunch_calories && <span className="text-primary">({day.lunch_calories} kcal)</span>}</span>
                     <span>{day.lunch}</span>
                     {Array.isArray(day.lunch_ingredients) && day.lunch_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.lunch_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                   </div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">Dinner {day.dinner_calories && <span className="text-primary">({day.dinner_calories} kcal)</span>}</span>
                     <span>{day.dinner}</span>
                     {Array.isArray(day.dinner_ingredients) && day.dinner_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.dinner_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
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