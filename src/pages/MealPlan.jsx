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
  const [loadingStatus, setLoadingStatus] = useState("Generating your grocery list…");
  const [removedItems, setRemovedItems] = useState(new Set());
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planLoadingStatus, setPlanLoadingStatus] = useState("Creating your meal plan…");
  const [saving, setSaving] = useState(false);
  const groceryListRef = useRef(null);
  const exportRef = useRef(null);
  const isFirstRender = useRef(true);

  const getCacheKey = () =>
    `grocery_${budget}_${stores}_${diet}_${people}_${calories}_${saleHunt}_${currentLanguage.code}`;

  useEffect(() => {
    // Try to load from session cache first
    const cached = sessionStorage.getItem(getCacheKey());
    if (cached) {
      setGroceries(JSON.parse(cached));
      setLoading(false);
    } else {
      generateGroceries();
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setWeeklyPlan(null);
    // Check cache for new language
    const cached = sessionStorage.getItem(getCacheKey());
    if (cached) {
      setGroceries(JSON.parse(cached));
      setLoading(false);
    } else {
      generateGroceries();
    }
  }, [currentLanguage.code]);

  const generateGroceries = async () => {
    setRemovedItems(new Set());
    setLoading(true);
    const statusMessages = [
      "Checking prices at your stores…",
      "Building your grocery list…",
      "Almost there…",
    ];
    let msgIdx = 0;
    setLoadingStatus(statusMessages[0]);
    const statusInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % statusMessages.length;
      setLoadingStatus(statusMessages[msgIdx]);
    }, 4000);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Monthly grocery list. Language: ${currentLanguage.label}. People: ${people}. Diet: ${diet}. Germany. Budget: €${budget}/mo (stay within 3%). Calories: ~${calories} kcal/day. Stores: ${stores}.
Rules: real German prices, cheapest store per item, price=unit_price×qty, include normal_price (Rewe/Edeka). Real branded names (e.g. "Ja! Vollmilch 3,5% 1L"). All text in ${currentLanguage.label}.${saleHunt ? " SALE HUNT: only genuine sale items cheaper than regular alternatives." : ""}`,
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
    clearInterval(statusInterval);
    sessionStorage.setItem(getCacheKey(), JSON.stringify(result));
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
    const planMessages = [
      "Planning your meals…",
      "Balancing nutrition…",
      "Finalising the week…",
    ];
    let planMsgIdx = 0;
    setPlanLoadingStatus(planMessages[0]);
    const planStatusInterval = setInterval(() => {
      planMsgIdx = (planMsgIdx + 1) % planMessages.length;
      setPlanLoadingStatus(planMessages[planMsgIdx]);
    }, 4000);

    const result = await base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `7-day meal plan (repeats 4x=28 days). Language: ${currentLanguage.label}. Diet: ${diet}. ${calories} kcal/day. People: ${people}. Breakfast ~${Math.round(calories*0.25)} kcal, lunch ~${Math.round(calories*0.35)} kcal, dinner ~${Math.round(calories*0.40)} kcal. Use ONLY these ingredients (qty is 4-week total): ${availableItems}. Return exactly 7 days.`,
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
    clearInterval(planStatusInterval);
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
            <p className="text-foreground font-semibold text-lg">{loadingStatus}</p>
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
               {loadingPlan ? <><Loader2 className="h-4 w-4 animate-spin" /> {planLoadingStatus}</> : t("generateWeeklyPlan")}
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
            <Button onClick={() => { sessionStorage.removeItem(getCacheKey()); generateGroceries(); }} variant="outline" className="w-full">
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