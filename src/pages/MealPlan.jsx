import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBasket, X, Save, FileDown, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import GroceryListExport from "@/components/GroceryListExport";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PullToRefresh from "@/components/PullToRefresh";

export default function MealPlan() {
  const { t, currentLanguage } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") || 150;
  const stores = params.get("stores") || "aldi,lidl";
  const diet = params.get("diet") || "balanced";
  const people = params.get("people") || 1;
  const calories = params.get("calories") || 2000;
  const saleHunt = params.get("saleHunt") === "true";

  const [groceries, setGroceries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState(new Set());
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const groceryListRef = useRef(null);
  const exportRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    generateGroceries();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setWeeklyPlan(null);
    generateGroceries();
  }, [currentLanguage.code]);

  const generateGroceries = async () => {
    setRemovedItems(new Set());
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a monthly grocery list for ${people} person(s) with a ${diet} diet in Germany.

Budget: €${budget}/month — final total MUST be between €${(budget*0.97).toFixed(0)} and €${(budget*1.03).toFixed(0)}.
Calories: ~${calories} kcal/day for all ${people} person(s).
Stores: ${stores}.
Language: ${currentLanguage.label}.

Rules:
1. Use real 2024-2025 German supermarket prices from the listed stores (e.g. Aldi Vollmilch 1L = €0.99, Lidl Eier 10er = €1.99).
2. Pick the cheapest store for each item.
3. The price field = unit price × quantity needed for the full month (e.g. 4x Vollmilch 1L at €0.99 = price: 3.96, unit_price: 0.99, quantity: "4x 1L").
4. Add enough items so the total is as close to €${budget} as possible.
5. All text in ${currentLanguage.label}.
6. For each item, also provide normal_price: the typical price for the same quantity at a regular/mid-range supermarket (e.g. Rewe, Edeka). This shows how much cheaper the budget store option is.
7. CRITICAL: The item name MUST include the full real product name with the brand name as sold in the store (e.g. "Ja! Vollmilch 3,5% 1L", "Milbona Naturjoghurt 500g", "Gut & Günstig Haferflocken 500g", "Tandil Waschmittel Pulver 1,5kg"). Never use generic names like "Milk" or "Oats" — always use the actual branded product name.
${saleHunt ? `8. SALE HUNT MODE IS ON: Actively look for items that are currently on sale or promotion at the listed stores. ONLY include a sale item if its sale price is genuinely lower than what you would normally pay elsewhere — never include items just because they are "on sale" if the discounted price is still higher than the cheapest regular alternative. Prioritize items where the sale price represents a real saving versus normal market prices.` : ""}`,
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
                      unit_price: { type: "number" },
                      price: { type: "number" },
                      normal_price: { type: "number" },
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
  const totalSaved = getActiveItems().reduce((sum, item) => {
    if (item.normal_price != null && item.normal_price > item.price) {
      return sum + (item.normal_price - item.price);
    }
    return sum;
  }, 0);

  const exportCSV = () => {
    const items = getActiveItems();
    const rows = [["Category", "Item", "Quantity", "Price (€)", "Store", "Calories Info"]];
    items.forEach(item => rows.push([item.category, item.name, item.quantity, item.price?.toFixed(2), item.store || "", item.calories_info || ""]));
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "TOTAL", "", groceries?.total_estimated_cost?.toFixed(2), "", ""]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    // BOM ensures UTF-8 is recognized correctly (supports Cyrillic, etc.)
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grocery-list-${diet}-${budget}eur.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!exportRef.current) return;

    const container = exportRef.current;
    const sections = Array.from(container.querySelectorAll('[data-pdf-section]'));
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    let cursorY = margin;
    let firstPage = true;

    for (const section of sections) {
      const canvas = await html2canvas(section, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (!firstPage && cursorY + imgH > pageH - margin) {
        doc.addPage();
        cursorY = margin;
      }

      doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, cursorY, imgW, imgH);
      cursorY += imgH + 8;
      firstPage = false;
    }

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
      model: "gemini_3_flash",
      prompt: `Create a 7-day meal plan (repeated 4x = 28 days). All text in ${currentLanguage.label}.

Ingredients (total for 4 weeks): ${availableItems}

Diet: ${diet} | Calories/day: ${calories} kcal | People: ${people}

Rules:
- Use ONLY listed ingredients
- Plan repeats 4x, so usage × 4 must not exceed listed quantities
- Breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal
- Return EXACTLY 7 days`,
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

  const [saved, setSaved] = useState(false);

  const saveMealPlan = async () => {
    if (!weeklyPlan || saved) return;
    setSaving(true);
    try {
      const isAuthed = await base44.auth.isAuthenticated();
      if (!isAuthed) {
        toast.error("Please log in to save meal plans.");
        base44.auth.redirectToLogin();
        return;
      }
      await base44.entities.MealPlan.create({
        name: `${diet} Meal Plan - ${new Date().toLocaleDateString()}`,
        diet,
        budget: parseFloat(budget),
        calories: parseFloat(calories),
        people: parseFloat(people),
        stores,
        plan: { days: weeklyPlan.weeks[0].days }
      });
      setSaved(true);
      toast.success(t("planSaved"));
    } catch (error) {
      toast.error("Failed to save meal plan: " + (error?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PullToRefresh onRefresh={generateGroceries}>
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("yourGroceryList")}</h1>
        <p className="text-sm text-muted-foreground">
          {diet} diet · €{budget}/month · {calories} kcal/day · {people} person(s)
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-2">
            <p className="text-foreground font-semibold text-lg">{t("generatingGroceries")}</p>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t("generatingGroceriesSubtitle")}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Budget Summary */}
          <div className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <span className="font-heading font-semibold text-foreground">{t("estimatedTotal")}</span>
              </div>
              <span className="font-heading text-2xl font-bold text-primary">
                €{activeTotal.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ {t("month")}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">{t("yourBudget")}</p>
                <p className="font-heading text-lg font-bold text-foreground">€{parseFloat(budget).toFixed(2)}</p>
              </div>
              <div className={`bg-card border rounded-xl px-4 py-3 ${
                activeTotal <= budget
                  ? 'border-green-200/50'
                  : 'border-destructive/30'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">{t("remaining")}</p>
                <p className={`font-heading text-lg font-bold ${
                  activeTotal <= budget
                    ? 'text-green-600'
                    : 'text-destructive'
                }`}>
                  €{(parseFloat(budget) - activeTotal).toFixed(2)}
                </p>
              </div>
            </div>
            {totalSaved > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-yellow-700 font-medium">💰 Saved vs. regular prices</p>
                <p className="font-heading text-lg font-bold text-yellow-600">€{totalSaved.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 justify-end">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              {t("exportCSV")}
            </Button>
            <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t("exportPDF")}
            </Button>
          </div>

          {/* Categories */}
          <div ref={groceryListRef}>
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
                       {item.unit_price != null && item.unit_price !== item.price ? (
                         <>
                           <p className="font-semibold text-foreground">€{item.price?.toFixed(2)}</p>
                           <p className="text-xs text-muted-foreground">€{item.unit_price?.toFixed(2)} × {Math.round(item.price / item.unit_price)}</p>
                         </>
                       ) : (
                         <p className="font-semibold text-foreground">€{item.price?.toFixed(2)}</p>
                       )}
                       {item.normal_price != null && item.normal_price > item.price && (
                         <p className="text-xs font-medium text-green-600">
                           saves €{(item.normal_price - item.price).toFixed(2)}
                         </p>
                       )}
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
          </div>

          {/* Generate Weekly Plan Button */}
          {!weeklyPlan && (
           <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3">
             <div>
               <h3 className="font-heading font-semibold">{t("weeklyPlanTitle")}</h3>
               <p className="text-sm text-muted-foreground">{t("weeklyPlanSubtitle")}</p>
             </div>
             <Button onClick={generateWeeklyPlan} disabled={loadingPlan} className="w-full gap-2">
               {loadingPlan ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("generatingPlan")}</> : t("generateWeeklyPlan")}
             </Button>
           </div>
          )}

          {/* Weekly Plan Display */}
          {weeklyPlan?.weeks?.[0] && (
           <div className="bg-card border border-border rounded-xl overflow-hidden">
             <div className="bg-primary px-5 py-3">
               <h2 className="font-heading font-semibold text-primary-foreground">{t("yourWeeklyMealPlan")}</h2>
             </div>
             <div className="divide-y divide-border">
               {weeklyPlan.weeks[0].days?.map((day, idx) => (
                 <div key={`${idx}`} className="px-5 py-4 grid grid-cols-4 gap-3 text-sm items-start">
                   <div className="font-semibold text-foreground col-span-4 border-b border-border pb-1 mb-1">{day.day}</div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">{t("breakfast")} {day.breakfast_calories && <span className="text-primary">({day.breakfast_calories} kcal)</span>}</span>
                     <span>{day.breakfast}</span>
                     {Array.isArray(day.breakfast_ingredients) && day.breakfast_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.breakfast_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                   </div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">{t("lunch")} {day.lunch_calories && <span className="text-primary">({day.lunch_calories} kcal)</span>}</span>
                     <span>{day.lunch}</span>
                     {Array.isArray(day.lunch_ingredients) && day.lunch_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.lunch_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                   </div>
                   <div className="text-muted-foreground col-span-4 sm:col-span-1">
                     <span className="font-medium text-foreground block text-xs mb-0.5">{t("dinner")} {day.dinner_calories && <span className="text-primary">({day.dinner_calories} kcal)</span>}</span>
                     <span>{day.dinner}</span>
                     {Array.isArray(day.dinner_ingredients) && day.dinner_ingredients.length > 0 && <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">{day.dinner_ingredients.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}</ul>}
                   </div>
                 </div>
               ))}
             </div>
             <div className="bg-muted px-5 py-3 flex items-center justify-between">
               <p className="text-xs text-muted-foreground">{t("repeatNote")}</p>
               <Button onClick={saveMealPlan} disabled={saving || saved} size="sm" className="gap-2">
                   <Save className="h-4 w-4" />
                   {saved ? t("planSaved") : saving ? t("saving") : t("savePlan")}
                 </Button>
             </div>
             </div>
             )}

             <div className="pb-8">
            <Button onClick={generateGroceries} variant="outline" className="w-full">
              {t("regenerate")}
            </Button>
          </div>
        </>
      )}
    </div>
      {groceries && (
        <GroceryListExport
          ref={exportRef}
          groceries={groceries}
          activeItems={getActiveItems()}
          activeTotal={activeTotal}
          budget={budget}
          diet={diet}
          people={people}
          calories={calories}
        />
      )}
    </PullToRefresh>
  );
}