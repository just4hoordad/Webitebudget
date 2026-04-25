import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { ShoppingBasket, X, Save, FileDown, FileText, BarChart2, Shuffle, ArrowLeftRight } from "lucide-react";
import MealSwapModal from "@/components/MealSwapModal";
import GrocerySwapModal from "@/components/GrocerySwapModal";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import GeneratingLoader from "@/components/GeneratingLoader";
import { jsPDF } from "jspdf";

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
  const junkPercent = parseInt(params.get("junkPercent") || "0", 10);

  const [groceries, setGroceries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState(new Set());
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const generateGroceries = async (retryCount = 0) => {
    setRemovedItems(new Set());
    setLoading(true);
    try {
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
${junkPercent > 0 ? `8. JUNK FOOD ALLOWANCE: Up to ${junkPercent}% of daily calories (${Math.round((junkPercent/100) * calories)} kcal/day) can come from junk food / treats (e.g. chips, chocolate, fast food, sweets, sodas). Include appropriate junk food items in the grocery list that cover this allowance.` : "8. Keep the grocery list clean and healthy — no junk food or treats."}
${saleHunt ? `9. SALE HUNT MODE IS ON: Actively look for items that are currently on sale or promotion at the listed stores. ONLY include a sale item if its sale price is genuinely lower than what you would normally pay elsewhere — never include items just because they are "on sale" if the discounted price is still higher than the cheapest regular alternative. Prioritize items where the sale price represents a real saving versus normal market prices.` : ""}`,
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
    } catch (err) {
      if (retryCount < 2) {
        return generateGroceries(retryCount + 1);
      }
      toast.error("Failed to generate grocery list. Please try again.");
    }
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

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    let y = margin;

    const GREEN = [15, 76, 53];
    const GRAY = [107, 114, 128];
    const DARK = [17, 24, 39];

    const checkPage = (needed) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    // Header
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageW, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('BUDGETBITE', margin, 24);
    doc.text(new Date().toLocaleDateString('en-DE', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 24, { align: 'right' });
    doc.setFontSize(20); doc.text('Monthly Grocery List', margin, 46);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`${diet} diet · €${budget}/month · ${calories} kcal/day · ${people} person(s)`, margin, 62);
    y = 96;

    const items = getActiveItems();
    const categories = {};
    items.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    Object.entries(categories).forEach(([catName, catItems]) => {
      checkPage(30);
      // Category header
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y, pageW - margin * 2, 18, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GREEN);
      doc.text(catName.toUpperCase(), margin + 6, y + 12);
      y += 22;

      catItems.forEach(item => {
        checkPage(16);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        const nameLines = doc.splitTextToSize(item.name, pageW - margin * 2 - 120);
        doc.text(nameLines, margin + 6, y + 9);
        doc.setTextColor(...GRAY);
        doc.setFontSize(8);
        doc.text(item.quantity || '', margin + 6, y + 9 + nameLines.length * 10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GREEN);
        doc.text(`€${item.price?.toFixed(2)}`, pageW - margin - 6, y + 9, { align: 'right' });
        if (item.store) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...GRAY);
          doc.text(item.store, pageW - margin - 6, y + 18, { align: 'right' });
        }
        y += nameLines.length * 10 + 12;
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y - 4, pageW - margin, y - 4);
      });
      y += 6;
    });

    // Total
    checkPage(30);
    doc.setFillColor(...GREEN);
    doc.rect(margin, y, pageW - margin * 2, 24, 'F');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', margin + 8, y + 16);
    doc.text(`€${activeTotal.toFixed(2)}`, pageW - margin - 8, y + 16, { align: 'right' });

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

IMPORTANT: Return ALL text (meal names, day names, ingredient names) in ${currentLanguage.label} language.

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
5. Distribute all ingredients as evenly as possible

For EACH of the 7 days, provide breakfast, lunch, and dinner with:
- Meal name (in ${currentLanguage.label})
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

  const [saved, setSaved] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [grocerySwapTarget, setGrocerySwapTarget] = useState(null);


  const getAvailableIngredientNames = () =>
    groceries?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => item.name)
    ) || [];

  const handleGrocerySwap = (categoryName, oldItem, newItem) => {
    setGroceries(prev => {
      const newCategories = prev.categories.map(cat => {
        if (cat.name !== categoryName) return cat;
        return {
          ...cat,
          items: cat.items.map(i => i.name === oldItem.name ? { ...newItem, category: categoryName } : i)
        };
      });
      const newTotal = newCategories
        .flatMap(cat => cat.items)
        .reduce((sum, i) => sum + (i.price || 0), 0);
      return { ...prev, categories: newCategories, total_estimated_cost: newTotal };
    });
    setWeeklyPlan(null);
  };

  const exportMealPlanPDF = () => {
    const days = weeklyPlan?.weeks?.[0]?.days || [];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const col = (pageW - margin * 2) / 3;
    let y = margin;

    const GREEN = [15, 76, 53];
    const LIGHT_GREEN = [26, 158, 110];
    const GRAY = [107, 114, 128];
    const DARK = [17, 24, 39];
    const BG_LIGHT = [240, 253, 244];

    const checkPage = (needed) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // ── Header ──
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageW, 110, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BUDGETBITE', margin, 28);
    doc.text(new Date().toLocaleDateString('en-DE', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 28, { align: 'right' });

    doc.setFontSize(22);
    doc.text('7-Day Meal Plan', margin, 52);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${diet} diet · ${people} person(s) · repeats for 4 weeks`, margin, 66);

    // stat boxes
    const stats = [
      { label: 'MONTHLY BUDGET', value: `€${parseFloat(budget).toFixed(0)}` },
      { label: 'DAILY CALORIES', value: `${calories} kcal` },
      { label: 'PEOPLE', value: String(people) },
      { label: 'MEALS / WEEK', value: '21' },
    ];
    const bw = (pageW - margin * 2) / 4;
    stats.forEach(({ label, value }, i) => {
      const bx = margin + i * bw;
      doc.setFillColor(255, 255, 255, 0.18);
      doc.setFillColor(30, 100, 70);
      doc.roundedRect(bx, 76, bw - 6, 28, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 230, 215);
      doc.text(label, bx + 8, 87);
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(value, bx + 8, 100);
    });

    y = 126;

    // ── Days ──
    days.forEach((day, idx) => {
      const meals = [
        { label: 'BREAKFAST', name: day.breakfast, cal: day.breakfast_calories, ings: day.breakfast_ingredients },
        { label: 'LUNCH',     name: day.lunch,     cal: day.lunch_calories,     ings: day.lunch_ingredients     },
        { label: 'DINNER',    name: day.dinner,    cal: day.dinner_calories,    ings: day.dinner_ingredients    },
      ];

      // Estimate height needed for this day
      const ingLines = meals.reduce((sum, m) => sum + (m.ings?.length || 0), 0);
      const needed = 28 + 14 + meals.length * 38 + ingLines * 10 + 12;
      checkPage(needed);

      // Day header row
      doc.setFillColor(...(idx % 2 === 0 ? BG_LIGHT : [249, 250, 251]));
      doc.rect(margin, y, pageW - margin * 2, 20, 'F');
      doc.setFillColor(...GREEN);
      doc.circle(margin + 10, y + 10, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(String(idx + 1), margin + 10, y + 13, { align: 'center' });
      doc.setTextColor(...GREEN);
      doc.setFontSize(11);
      doc.text(day.day, margin + 22, y + 14);
      y += 22;

      // Meal columns
      const rowStartY = y;
      let maxColH = 0;

      meals.forEach((meal, mIdx) => {
        const cx = margin + mIdx * col;
        let cy = rowStartY + 4;

        // Meal type label
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GRAY);
        doc.text(meal.label, cx + 4, cy + 7);
        cy += 10;

        // kcal pill
        if (meal.cal) {
          doc.setFillColor(...LIGHT_GREEN);
          doc.roundedRect(cx + 4, cy, 48, 10, 3, 3, 'F');
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text(`${meal.cal} kcal`, cx + 28, cy + 7, { align: 'center' });
          cy += 13;
        }

        // Meal name (wrapped)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        const nameLines = doc.splitTextToSize(meal.name || '', col - 10);
        doc.text(nameLines, cx + 4, cy + 9);
        cy += nameLines.length * 11 + 2;

        // Ingredients
        if (Array.isArray(meal.ings) && meal.ings.length > 0) {
          meal.ings.forEach(ing => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...GRAY);
            const ingText = doc.splitTextToSize(`· ${ing.name} ${ing.quantity}`, col - 10);
            doc.text(ingText, cx + 4, cy + 7);
            cy += ingText.length * 9;
          });
        }

        maxColH = Math.max(maxColH, cy - rowStartY);
      });

      // border between columns
      doc.setDrawColor(230, 230, 230);
      doc.line(margin + col, rowStartY, margin + col, rowStartY + maxColH + 4);
      doc.line(margin + col * 2, rowStartY, margin + col * 2, rowStartY + maxColH + 4);

      // bottom border for day card
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, rowStartY - 22, pageW - margin * 2, maxColH + 26, 'S');

      y = rowStartY + maxColH + 10;
    });

    // ── Footer ──
    checkPage(20);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('BudgetBite — Smart meal planning for students in Germany', margin, y);
    doc.text('This plan repeats for 4 consecutive weeks', pageW - margin, y, { align: 'right' });

    doc.save(`meal-plan-${diet}-${budget}eur.pdf`);
  };

  const handleSwap = (dayIndex, mealType, alternative) => {
    setWeeklyPlan(prev => {
      const newDays = [...prev.weeks[0].days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        [mealType]: alternative.name,
        [`${mealType}_calories`]: alternative.calories,
        [`${mealType}_ingredients`]: alternative.ingredients || [],
      };
      return { weeks: [{ week: 1, days: newDays }] };
    });
    setSaved(false);
  };

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
        <GeneratingLoader type="grocery" />
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
          <div>
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
                       onClick={() => setGrocerySwapTarget({ item, category: category.name })}
                       className="text-muted-foreground hover:text-primary transition-colors"
                       title="Find alternative"
                     >
                       <ArrowLeftRight className="h-4 w-4" />
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
            loadingPlan ? (
              <GeneratingLoader type="plan" />
            ) : (
              <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3">
                <div>
                  <h3 className="font-heading font-semibold">{t("weeklyPlanTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("weeklyPlanSubtitle")}</p>
                </div>
                <Button onClick={generateWeeklyPlan} className="w-full gap-2">
                  {t("generateWeeklyPlan")}
                </Button>
              </div>
            )
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
                   {[
                     { type: "breakfast", label: t("breakfast"), name: day.breakfast, cal: day.breakfast_calories, ings: day.breakfast_ingredients },
                     { type: "lunch", label: t("lunch"), name: day.lunch, cal: day.lunch_calories, ings: day.lunch_ingredients },
                     { type: "dinner", label: t("dinner"), name: day.dinner, cal: day.dinner_calories, ings: day.dinner_ingredients },
                   ].map(({ type, label, name, cal, ings }) => (
                     <div key={type} className="text-muted-foreground col-span-4 sm:col-span-1">
                       <div className="flex items-center justify-between mb-0.5">
                         <span className="font-medium text-foreground text-xs">{label} {cal && <span className="text-primary">({cal} kcal)</span>}</span>
                         <button
                           onClick={() => setSwapTarget({ dayIndex: idx, mealType: type, meal: { name, calories: cal, ingredients: ings } })}
                           className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group"
                           title="AI Swap"
                         >
                           <Shuffle className="h-3 w-3 group-hover:text-primary" />
                           <span className="hidden sm:inline">Swap</span>
                         </button>
                       </div>
                       <span>{name}</span>
                       {Array.isArray(ings) && ings.length > 0 && (
                         <ul className="text-xs text-primary/70 mt-1 italic list-disc ml-4">
                           {ings.map((ing, i) => <li key={i}>{ing.name} - {ing.quantity}</li>)}
                         </ul>
                       )}
                     </div>
                   ))}
                 </div>
               ))}
             </div>
             {/* Nutrition CTA */}
             <Link to={`/nutrition?budget=${budget}&stores=${encodeURIComponent(stores)}&diet=${diet}&people=${people}&calories=${calories}&junkPercent=${junkPercent}`} className="block mx-5 my-3">
               <div className="flex items-center gap-4 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 hover:bg-primary/20 transition-colors cursor-pointer">
                 <div className="bg-primary rounded-lg p-2 shrink-0">
                   <BarChart2 className="h-5 w-5 text-primary-foreground" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-heading font-semibold text-foreground text-sm">View Nutrition Analysis</p>
                   <p className="text-xs text-muted-foreground">Protein, fat & carbs breakdown with charts</p>
                 </div>
                 <span className="text-primary font-semibold text-sm shrink-0">→</span>
               </div>
             </Link>
             <div className="bg-muted px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">{t("repeatNote")}</p>
              <div className="flex items-center gap-2">
                <Button onClick={() => exportMealPlanPDF()} variant="outline" size="sm" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Download Plan
                </Button>
                <Button onClick={saveMealPlan} disabled={saving || saved} size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  {saved ? t("planSaved") : saving ? t("saving") : t("savePlan")}
                </Button>
              </div>
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
      <AnimatePresence>
        {grocerySwapTarget && (
          <GrocerySwapModal
            item={grocerySwapTarget.item}
            category={grocerySwapTarget.category}
            diet={diet}
            budget={budget}
            onSwap={handleGrocerySwap}
            onClose={() => setGrocerySwapTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {swapTarget && (
          <MealSwapModal
            meal={swapTarget.meal}
            mealType={swapTarget.mealType}
            dayIndex={swapTarget.dayIndex}
            availableIngredients={getAvailableIngredientNames()}
            targetCalories={swapTarget.meal.calories || Math.round(calories * (swapTarget.mealType === "breakfast" ? 0.25 : swapTarget.mealType === "lunch" ? 0.35 : 0.40))}
            diet={diet}
            onSwap={handleSwap}
            onClose={() => setSwapTarget(null)}
          />
        )}
      </AnimatePresence>




    </PullToRefresh>
  );
}