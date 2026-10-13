import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { categoryTranslations } from "@/lib/translations";
import { euCategoryTranslations } from "@/lib/translations_eu";
const allCategoryTranslations = { ...categoryTranslations, ...euCategoryTranslations };

const SHARE_L = {
  en: { share: "Share list", copied: "List copied! Paste it anywhere to share." },
  de: { share: "Liste teilen", copied: "Liste kopiert! Überall einfügen und teilen." },
  fr: { share: "Partager la liste", copied: "Liste copiée ! Collez-la partout." },
  es: { share: "Compartir lista", copied: "¡Lista copiada! Pégala donde quieras." },
  ar: { share: "مشاركة القائمة", copied: "تم نسخ القائمة! الصقها في أي مكان." },
  ru: { share: "Поделиться списком", copied: "Список скопирован! Вставьте куда угодно." },
  uk: { share: "Поділитися списком", copied: "Список скопійовано! Вставте куди завгодно." },
  fa: { share: "اشتراک‌گذاری لیست", copied: "لیست کپی شد! هرجا جای‌گذاری کنید." },
  zh: { share: "分享清单", copied: "清单已复制！可粘贴到任意位置分享。" },
  vi: { share: "Chia sẻ danh sách", copied: "Đã sao chép! Dán vào bất cứ đâu." },
  tr: { share: "Listeyi paylaş", copied: "Liste kopyalandı! İstediğiniz yere yapıştırın." },
};
import { Button } from "@/components/ui/button";
import { ShoppingBasket, Save, FileDown, FileText, BarChart2, Shuffle, ArrowLeftRight, Edit2, X, Plus, Loader2, Sparkles, PiggyBank, TrendingDown, Share2, Info, Crown, Scale, Trash2 } from "lucide-react";
import MealSwapModal from "@/components/MealSwapModal";
import GrocerySwapModal from "@/components/GrocerySwapModal";
import MealEditModal from "@/components/MealEditModal";
import AddItemModal from "@/components/AddItemModal";
import StoreBadge from "@/components/StoreBadge";
import GrocerySortToggle from "@/components/GrocerySortToggle";
import GroceryItemRow from "@/components/GroceryItemRow";
import MacroChart from "@/components/MacroChart";
import { AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import GeneratingLoader from "@/components/GeneratingLoader";
import ReassuranceRecap from "@/components/ReassuranceRecap";
import WeekMealGrid from "@/components/WeekMealGrid";
import RecipeModal from "@/components/RecipeModal";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import { base44 } from "@/api/base44Client";
import { setGenerationStatus } from "@/lib/generationStatus";
import { groceryParamsFromSearch, grocerySignature, runGroceryGeneration, dropUnselectedStores } from "@/lib/generateGroceries";
import GroceryGenerationError from "@/components/GroceryGenerationError";
import { invokeAI } from "@/lib/aiClient";
import { toast } from "sonner";
import PullToRefresh from "@/components/PullToRefresh";
import { saveLastBudget } from "@/lib/lastResult";
import CreditPill from "@/components/monetization/CreditPill";
import AdSlot from "@/components/ads/AdSlot";
import { useMonetization } from "@/lib/MonetizationContext";

// sessionStorage-backed meal-plan cache — survives refresh/back-navigation so
// revisiting a plan costs zero credits instead of regenerating from scratch.
const PLAN_PREFIX = "bb_plan_v4_"; // v4: ingredient filter — strips invented ingredients not in grocery list
const getPlanCache = (sig) => {
  try { const raw = sessionStorage.getItem(PLAN_PREFIX + sig); return raw ? JSON.parse(raw) : null; } catch { return null; }
};
const setPlanCache = (sig, data) => {
  try { sessionStorage.setItem(PLAN_PREFIX + sig, JSON.stringify(data)); } catch { /* ignore */ }
};

export default function MealPlan() {
  const { t, currentLanguage } = useLanguage();
  const { guarded, credits, isPro, openPricing } = useMonetization();
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") || 150;
  const stores = params.get("stores") || "";
  const diet = params.get("diet") || "balanced";
  const goal = params.get("goal") || "maintain";
  const people = params.get("people") || 1;
  const calories = params.get("calories") || 2000;
  const days = parseInt(params.get("days") || "30", 10);
  const saleHunt = params.get("saleHunt") === "true";
  const bio = params.get("bio") === "true";
  const junkPercent = parseInt(params.get("junkPercent") || "0", 10);
  const proteinSnackBudget = parseInt(params.get("proteinSnackBudget") || "0", 10);
  const spendMode = params.get("spendMode") || "balanced";
  const allergies = params.get("allergies") ? params.get("allergies").split(",").filter(Boolean) : [];
  const ownedItems = params.get("owned") ? params.get("owned").split(",").filter(Boolean) : [];
  const macrosParam = params.get("macros");
  const macros = macrosParam
    ? (() => { const [p, c, f] = macrosParam.split(",").map(Number); return { protein: p || 30, carbs: c || 40, fats: f || 30 }; })()
    : null;

  const [groceries, setGroceries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generationError, setGenerationError] = useState("");
  const [removedItems, setRemovedItems] = useState(new Set());
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [saving, setSaving] = useState(false);
  const isFirstRender = useRef(true);
  const location = useLocation();
  const isActive = location.pathname === "/meal-plan";
  const searchKey = window.location.search;
  const lastGenKey = useRef(null);
  const genCache = useRef({});
  const [planStyle, setPlanStyle] = useState(() => new URLSearchParams(window.location.search).get("planStyle") === "unique" ? "unique" : "repeat");
  const autoGenStarted = useRef(false);
  // The page stays mounted between visits, so re-read the chosen style from the URL each time it changes.
  useEffect(() => {
    setPlanStyle(new URLSearchParams(searchKey).get("planStyle") === "unique" ? "unique" : "repeat");
  }, [searchKey]);

  useEffect(() => {
    if (location.pathname !== "/meal-plan") return;
    if (lastGenKey.current === searchKey) return;
    lastGenKey.current = searchKey;
    kickoffGroceries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, searchKey]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (location.pathname !== "/meal-plan") return;
    // Language changed: keep the existing grocery list (product names are
    // brand names that don't change between languages) and only clear the
    // meal plan so it regenerates in the new language. Try the cache for
    // the new language first — a previously generated list in that language
    // is used if available, avoiding a fresh generation.
    const gparams = groceryParamsFromSearch(searchKey);
    const newSig = grocerySignature(gparams, currentLanguage.code);
    const cached = genCache.current[newSig];
    const groceriesForPlan = cached || groceries;
    if (cached) {
      setGroceries(cached);
    }
    setWeeklyPlan(null);
    setLoading(false);
    autoStartMealPlan(groceriesForPlan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage.code]);

  const generateGroceries = async (retryCount = 0, force = false) => {
    autoGenStarted.current = false;
    setWeeklyPlan(null);
    setGenerationError("");
    const gparams = groceryParamsFromSearch(searchKey);
    const langKey = grocerySignature(gparams, currentLanguage.code);
    const cached = genCache.current[langKey];
    if (cached && retryCount === 0 && !force) {
      setRemovedItems(new Set());
      const result = dropUnselectedStores(cached, gparams);
      setGroceries(result);
      setLoading(false);
      autoStartMealPlan(result);
      return;
    }
    setRemovedItems(new Set());
    setLoading(true);
    try {
      const result = await runGroceryGeneration(gparams, currentLanguage.label, currentLanguage.code, { force });
      setGroceries(result);
      genCache.current[langKey] = result;
      autoStartMealPlan(result);
    } catch (err) {
      const isTransient = err?.name === "TypeError" || err?.code === "ECONNABORTED" || /network|timeout|fetch/i.test(err?.message || "");
      if (isTransient && retryCount < 2) {
        return generateGroceries(retryCount + 1, force);
      }
      setGroceries(null);
      setGenerationError(err?.message || "Failed to generate grocery list. Please try again.");
    }
    setLoading(false);
  };

  const kickoffGroceries = () => {
    guarded(generateGroceries);
  };

  useEffect(() => {
    if (isActive && !loading && groceries) saveLastBudget(searchKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, groceries]);

  // Broadcast generation status to the global badge so users on other pages
  // know the list is still building (or ready / failed) and can return to it.
  useEffect(() => {
    // Don't broadcast until a generation has actually been kicked off — the
    // page stays mounted app-wide, so without this guard the initial loading
    // state would show the "generating" badge on every page before the user
    // ever asks for a list.
    if (!lastGenKey.current) { setGenerationStatus("idle", searchKey); return; }
    if (generationError || (planError && !weeklyPlan)) setGenerationStatus("error", searchKey);
    else if (loading || loadingPlan || (groceries && !weeklyPlan)) setGenerationStatus("generating", searchKey);
    else if (groceries && weeklyPlan) setGenerationStatus("ready", searchKey);
    else setGenerationStatus("idle", searchKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingPlan, groceries, weeklyPlan, generationError, planError, searchKey]);

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

  const shareGroceryList = async () => {
    const items = getActiveItems();
    const byCategory = {};
    items.forEach(it => { (byCategory[it.category] = byCategory[it.category] || []).push(it); });
    const lines = [];
    lines.push(`🛒 BudgetBite — ${t("yourGroceryList")}`);
    lines.push(`${diet} · €${budget}/${days} ${t("days")} · ${calories} kcal · ${people} ${t("personS")}`);
    lines.push("");
    Object.entries(byCategory).forEach(([cat, catItems]) => {
      lines.push(`▶ ${translateCategory(cat)}`);
      catItems.forEach(it => {
        const storeStr = it.store ? ` [${it.store}]` : "";
        lines.push(`  • ${it.name} — ${it.quantity} — €${(it.price || 0).toFixed(2)}${storeStr}`);
      });
      lines.push("");
    });
    lines.push(`💰 ${t("estimatedTotalForDays", { days })}: €${activeTotal.toFixed(2)}`);
    const text = lines.join("\n");
    const s = SHARE_L[currentLanguage.code] || SHARE_L.en;
    if (navigator.share) {
      try { await navigator.share({ title: t("yourGroceryList"), text }); return; }
      catch { /* cancelled → fall back to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(s.copied);
    } catch {
      toast.error("Could not share or copy. Try the CSV/PDF export.");
    }
  };

  const exportCSV = () => {
    const items = getActiveItems();
    const rows = [["Category", "Item", "Quantity", "Price (€)", "Store", "Calories Info"]];
    items.forEach(item => rows.push([item.category, item.name, item.quantity, item.price?.toFixed(2), item.store || "", item.calories_info || ""]));
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "TOTAL", "", groceries?.total_estimated_cost?.toFixed(2), "", ""]);
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grocery-list-${diet}-${budget}eur.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const items = getActiveItems();
    const categories = {};
    items.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    const pageWidth = 794;
    const pageHeight = 1123;
    const pagePadding = 48;
    const contentWidth = pageWidth - pagePadding * 2;

    // Escape user-controlled text before injecting into HTML strings (prevents DOM XSS during PDF export).
    const esc = (s) => String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const headerHtml = `
      <div style="margin:0 -48px 28px;padding:24px 48px 26px;background:#0f4c35;color:white;">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;letter-spacing:.08em;margin-bottom:12px;">
          <span>BUDGETBITE</span>
          <span>${new Date().toLocaleDateString(currentLanguage.code || 'en-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <h1 style="font-size:28px;line-height:1.2;margin:0 0 8px;font-weight:800;">${t("yourGroceryList")}</h1>
        <p style="margin:0;font-size:14px;opacity:.9;">${esc(diet)} · €${esc(budget)}/${t("month")} · ${esc(calories)} kcal · ${esc(people)} ${t("personS")}</p>
      </div>
    `;

    const itemHtml = (item) => `
      <div style="display:flex;justify-content:space-between;gap:18px;padding:12px 16px;border-top:1px solid #f3f4f6;break-inside:avoid;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#111827;">${esc(item.name || '')}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:3px;">${esc(item.quantity || '')}</div>
        </div>
        <div style="text-align:right;min-width:90px;">
          <div style="font-size:15px;font-weight:800;color:#0f4c35;">€${(item.price || 0).toFixed(2)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:3px;">${esc(item.store || '')}</div>
        </div>
      </div>
    `;

    const sectionHtml = (catName, catItems) => `
      <section style="break-inside:avoid;margin-bottom:18px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <h2 style="margin:0;padding:12px 16px;background:#f0fdf4;color:#0f4c35;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;">${esc(translateCategory(catName))}</h2>
        ${catItems.map(itemHtml).join('')}
      </section>
    `;

    const totalHtml = `
      <div style="margin-top:24px;padding:16px 18px;background:#0f4c35;color:white;border-radius:14px;display:flex;justify-content:space-between;font-size:18px;font-weight:800;break-inside:avoid;">
        <span>${t("estimatedTotal")}</span>
        <span>€${activeTotal.toFixed(2)}</span>
      </div>
    `;

    const measureNode = document.createElement("div");
    measureNode.style.position = "fixed";
    measureNode.style.left = "-10000px";
    measureNode.style.top = "0";
    measureNode.style.width = `${contentWidth}px`;
    measureNode.style.fontFamily = "'DM Sans', Arial, sans-serif";
    document.body.appendChild(measureNode);

    const measure = (html) => {
      measureNode.innerHTML = html;
      return measureNode.offsetHeight;
    };

    const pages = [];
    let currentBlocks = [headerHtml];
    let currentHeight = measure(headerHtml);
    const maxContentHeight = pageHeight - pagePadding * 2;

    const pushPage = () => {
      pages.push(currentBlocks.join(''));
      currentBlocks = [];
      currentHeight = 0;
    };

    Object.entries(categories).forEach(([catName, catItems]) => {
      const fullSection = sectionHtml(catName, catItems);
      const fullHeight = measure(fullSection);

      if (currentHeight + fullHeight <= maxContentHeight) {
        currentBlocks.push(fullSection);
        currentHeight += fullHeight;
        return;
      }

      if (currentHeight > 0) pushPage();

      const heading = `<section style="margin-bottom:18px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;"><h2 style="margin:0;padding:12px 16px;background:#f0fdf4;color:#0f4c35;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;">${esc(translateCategory(catName))}</h2>`;
      const close = `</section>`;
      let sectionBlocks = [heading];
      let sectionHeight = measure(heading + close);

      catItems.forEach(item => {
        const block = itemHtml(item);
        const blockHeight = measure(block);
        if (sectionHeight + blockHeight > maxContentHeight && sectionBlocks.length > 1) {
          currentBlocks.push(sectionBlocks.join('') + close);
          currentHeight = measure(currentBlocks.join(''));
          pushPage();
          sectionBlocks = [heading];
          sectionHeight = measure(heading + close);
        }
        sectionBlocks.push(block);
        sectionHeight += blockHeight;
      });

      currentBlocks.push(sectionBlocks.join('') + close);
      currentHeight = measure(currentBlocks.join(''));
    });

    const totalHeight = measure(totalHtml);
    if (currentHeight + totalHeight > maxContentHeight) pushPage();
    currentBlocks.push(totalHtml);
    pages.push(currentBlocks.join(''));
    document.body.removeChild(measureNode);

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    for (let i = 0; i < pages.length; i += 1) {
      const exportNode = document.createElement("div");
      exportNode.style.position = "fixed";
      exportNode.style.left = "-10000px";
      exportNode.style.top = "0";
      exportNode.style.width = `${pageWidth}px`;
      exportNode.style.minHeight = `${pageHeight}px`;
      exportNode.style.background = "#ffffff";
      exportNode.style.color = "#111827";
      exportNode.style.fontFamily = "'DM Sans', Arial, sans-serif";
      exportNode.style.padding = `0 ${pagePadding}px ${pagePadding}px`;
      exportNode.style.boxSizing = "border-box";
      exportNode.innerHTML = pages[i];
      document.body.appendChild(exportNode);

      const canvas = await html2canvas(exportNode, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(exportNode);

      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    }

    pdf.save(`grocery-list-${diet}-${budget}eur.pdf`);
  };

  const daySchema = {
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
  };

  const weeklyPlanSchema = {
    type: "object",
    properties: { days: { type: "array", minItems: 7, items: daySchema } }
  };

  const multiWeekPlanSchema = {
    type: "object",
    properties: {
      weeks: {
        type: "array",
        items: { type: "object", properties: { week: { type: "number" }, days: { type: "array", items: daySchema } } }
      }
    }
  };

  const totalDays = days;
  // Deterministic correction: scale each day's meal calories proportionally
  // so the daily total matches the target. The AI model rarely hits the exact
  // target, and a single retry is insufficient — this guarantees it in code.
  const scaleDayCalories = (days, target) => (days || []).map((d) => {
    if (!d) return d;
    const total = (d.breakfast_calories || 0) + (d.lunch_calories || 0) + (d.dinner_calories || 0);
    if (total <= 0 || Math.abs(total - target) < target * 0.05) return d;
    const scale = target / total;
    return {
      ...d,
      breakfast_calories: Math.round((d.breakfast_calories || 0) * scale),
      lunch_calories: Math.round((d.lunch_calories || 0) * scale),
      dinner_calories: Math.round((d.dinner_calories || 0) * scale),
    };
  });
  // --- Ingredient filter: strip meal-plan ingredients not in the grocery list ---
  // The meal-plan AI sometimes invents ingredients (e.g. "1 egg", "toast") that
  // were never bought. This filter removes them so the plan only references real
  // groceries, using a fuzzy prefix match to handle minor spelling differences.
  const STORE_WORDS = new Set(["rewe", "aldi", "lidl", "edeka", "penny", "netto", "kaufland", "tegut", "dm", "rossmann", "bio", "fairtrade", "gut", "günstig", "ja"]);
  const commonPrefixLen = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };

  const buildGroceryWordSet = () => {
    const words = new Set();
    (groceries?.categories || []).forEach(cat => {
      (cat.items || []).forEach(item => {
        if (removedItems.has(`${cat.name}::${item.name}`)) return;
        String(item.name || "").toLowerCase()
          .replace(/\d+\s*[*x×]?\s*\d*\s*(kg|g|l|ml|mg|stk|st|pack|er)\b/g, "")
          .split(/\s+/)
          .forEach(w => { if (w.length > 2 && !STORE_WORDS.has(w)) words.add(w); });
      });
    });
    return words;
  };

  const ingredientInGroceries = (ingName, groceryWords) => {
    const n = String(ingName || "").toLowerCase().trim();
    if (!n) return true;
    const words = n.replace(/\d+/g, "").split(/\s+/).filter(w => w.length > 2 && !STORE_WORDS.has(w));
    if (words.length === 0) return false;
    const groceryArr = Array.from(groceryWords);
    return words.some(w => groceryArr.some(gw =>
      commonPrefixLen(w, gw) >= 5 || gw.includes(w) || w.includes(gw)
    ));
  };

  const filterPlanIngredients = (planDays) => {
    const groceryWords = buildGroceryWordSet();
    if (!groceryWords.size) return planDays;
    return (planDays || []).map(d => {
      if (!d) return d;
      const filterIngs = (ings) => Array.isArray(ings) ? ings.filter(i => ingredientInGroceries(i.name, groceryWords)) : ings;
      return {
        ...d,
        breakfast_ingredients: filterIngs(d.breakfast_ingredients),
        lunch_ingredients: filterIngs(d.lunch_ingredients),
        dinner_ingredients: filterIngs(d.dinner_ingredients),
      };
    });
  };

  // True when the plan's average daily kcal misses the target by more than 10%.
  const calorieOff = (planDays) => {
    const list = (planDays || []).filter(Boolean);
    if (!list.length) return false;
    // Every single day must be within 10% of the goal, not just the average.
    return list.some((d) => Math.abs((d.breakfast_calories || 0) + (d.lunch_calories || 0) + (d.dinner_calories || 0) - Number(calories)) > Number(calories) * 0.1);
  };
  const totalWeeks = Math.ceil(totalDays / 7);

  const buildWeekPrompt = (availableItems, weekNum, totalWks, daysInThisWeek, previousWeeksSummary = "") => `Create a complete ${daysInThisWeek}-day meal plan for week ${weekNum} of ${totalWks}.

IMPORTANT: Return ALL text (meal names, day names, ingredient names) in ${currentLanguage.label} language.

AVAILABLE PRODUCTS (these are the TOTAL available for all ${totalDays} days — use roughly 1/${totalWks} of each product this week):
${availableItems}

Diet type: ${diet === "frozen" ? "FROZEN FOODS — all meals are frozen ready-to-heat products" : diet}
Target calories per day: ${calories} kcal (MANDATORY — breakfast_calories + lunch_calories + dinner_calories must add up to ~${calories} kcal every day; do NOT default to 2000)
${macros ? `Macronutrient split: ~${macros.protein}% protein, ~${macros.carbs}% carbs, ~${macros.fats}% fats. Distribute foods across meals so the day's macros approach this ratio.` : ""}
Number of people: ${people}

CRITICAL RULES:
1. Use ONLY the products listed above — no substitutions or additions. Every ingredient name in breakfast_ingredients, lunch_ingredients, dinner_ingredients MUST be copied EXACTLY from the AVAILABLE PRODUCTS list. Do NOT invent, assume, or add any ingredient (e.g. "egg", "toast", "oil") that is not in the list. If a product is not listed, the meal must not use it.
2. For each meal, specify EXACTLY which product is used${diet === "frozen" ? " and the heating instruction (e.g. \"Oven 200°C for 20 min\" or \"Microwave 3 min\")" : ""}.
${diet === "frozen" ? `3. FROZEN FOODS MODE: Each meal entry MUST be the exact frozen product name + heating method. Format: "🥡 [Product Name] — [Heating instruction]".` : "3. Vary meals across the days — do NOT repeat the same meal every day."}
4. Calorie distribution: breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal.
${previousWeeksSummary ? `5. AVOID repeating meals already used in earlier weeks — keep this week different:\n${previousWeeksSummary}` : ""}

REALISM & HEALTH — every meal must be a real, cookable dish a person would actually eat:
- Never pass a single raw ingredient or a drink off as a meal (e.g. "1L of milk", "just oats", "a banana" is NOT a meal). Combine products into a recognizable dish (e.g. "Oats with milk and banana", "Pasta with tomato and cheese", "Rice with chicken and vegetables").
- Portion sizes must be realistic for ONE sitting (e.g. ~250ml milk, ~150g rice/pasta, ~2 eggs, ~150g meat), never bulk quantities.
- Keep the day balanced: a mix of protein, carbs and vegetables across the three meals, with variety between days — do not repeat the same meal every day.
- The plan must be doable for a normal person to shop for and cook with the listed products.

Return a "days" array with EXACTLY ${daysInThisWeek} day objects. Each day object: { day, breakfast, breakfast_calories, breakfast_ingredients[{name,quantity}], lunch, lunch_calories, lunch_ingredients, dinner, dinner_calories, dinner_ingredients }.
RETURN EXACTLY ${daysInThisWeek} days with no gaps or missing days.`;

  const buildMultiWeekPrompt = (availableItems) => `Create a complete ${totalDays}-day meal plan split across ${totalWeeks} week(s).

IMPORTANT: Return ALL text (meal names, day names, ingredient names) in ${currentLanguage.label} language.

AVAILABLE PRODUCTS (TOTAL for ${totalDays} days = ${totalWeeks} week(s)):
${availableItems}

Diet type: ${diet === "frozen" ? "FROZEN FOODS — all meals are frozen ready-to-heat products" : diet}
Target calories per day: ${calories} kcal (MANDATORY — breakfast_calories + lunch_calories + dinner_calories must add up to ~${calories} kcal every day; do NOT default to 2000)
${macros ? ` Macronutrient split: ~${macros.protein}% protein, ~${macros.carbs}% carbs, ~${macros.fats}% fats. Distribute foods across meals so the day's macros approach this ratio.` : ""}
Number of people: ${people}

CRITICAL RULES:
1. Use ONLY the products listed above — no substitutions or additions. Every ingredient name in breakfast_ingredients, lunch_ingredients, dinner_ingredients MUST be copied EXACTLY from the AVAILABLE PRODUCTS list. Do NOT invent, assume, or add any ingredient (e.g. "egg", "toast", "oil") that is not in the list. If a product is not listed, the meal must not use it.
2. The quantities listed are the TOTAL available for ALL ${totalDays} days
3. Divide product usage roughly equally across all ${totalWeeks} weeks — use approx 1/${totalWeeks} of total quantity per week
4. For each meal, specify EXACTLY which product is used${diet === "frozen" ? " and heating instructions (e.g. \"Oven 200°C for 20 min\" or \"Microwave 3 min\")" : ""}
${diet === "frozen" ? `5. FROZEN FOODS MODE: Each meal entry MUST be the exact frozen product name + heating method. Format: "🥡 [Product Name] — [Heating instruction]". No cooking involved, just reheating.` : ""}
6. VARIETY: Make each week different — do NOT repeat the same meals across weeks.

Calorie distribution: breakfast ~${Math.round(calories * 0.25)} kcal, lunch ~${Math.round(calories * 0.35)} kcal, dinner ~${Math.round(calories * 0.40)} kcal.

REALISM & HEALTH — every meal must be a real, cookable dish a person would actually eat:
- Never pass a single raw ingredient or a drink off as a meal (e.g. "1L of milk", "just oats", "a banana" is NOT a meal). Combine products into a recognizable dish (e.g. "Oats with milk and banana", "Pasta with tomato and cheese", "Rice with chicken and vegetables").
- Portion sizes must be realistic for ONE sitting (e.g. ~250ml milk, ~150g rice/pasta, ~2 eggs, ~150g meat), never bulk quantities.
- Keep each day balanced: a mix of protein, carbs and vegetables across the three meals, with variety between days and between weeks — do not repeat the same meal day after day.
- The plan must be doable for a normal person to shop for and cook with the listed products.

Return a "weeks" array with exactly ${totalWeeks} objects. Each week object has a "days" array. Weeks 1 to ${totalWeeks - 1} have 7 days each; the final week has ${totalDays - (totalWeeks - 1) * 7} days. Total days across all weeks MUST equal ${totalDays}, with no gaps or missing meals.`;

  const generateAllWeeks = async (groceriesSource) => {
    const g = groceriesSource || groceries;
    const availableItems = g?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => `${item.name} (${item.quantity})`)
    ).join(", ");

    const sig = JSON.stringify({ items: availableItems, diet, calories, people, macros, lang: currentLanguage.code, totalDays });
    const cached = getPlanCache(sig);
    if (cached) {
      setLoadingPlan(false);
      return cached;
    }

    setLoadingPlan(true);
    try {
      // Single multi-week call instead of one call per week — a 30-day plan
      // drops from ~5 credits to ~1. The prompt already instructs the model
      // to vary meals across weeks.
      const multiPrompt = buildMultiWeekPrompt(availableItems);
      let result = await invokeAI({ prompt: multiPrompt, response_json_schema: multiWeekPlanSchema });
      if (calorieOff((result.weeks || []).flatMap((w) => w.days || []))) {
        result = await invokeAI({ prompt: `${multiPrompt}\n\nYour previous attempt had daily totals far from ${calories} kcal. Increase portions so each day totals ~${calories} kcal.`, response_json_schema: multiWeekPlanSchema });
      }
      const weeks = (result.weeks || []).map((w, i) => ({
        week: w.week || i + 1,
        days: filterPlanIngredients(scaleDayCalories(Array.isArray(w.days) ? w.days : [], Number(calories))),
      }));
      setPlanCache(sig, weeks);
      return weeks;
    } finally {
      setLoadingPlan(false);
    }
  };

  const generateWeeklyPlan = async (groceriesSource) => {
    const g = groceriesSource || groceries;
    const availableItems = g?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => `${item.name} (${item.quantity})`)
    ).join(", ");

    const daysInWeek = Math.min(totalDays, 7);
    const wkSig = JSON.stringify({ items: availableItems, diet, calories, people, macros, lang: currentLanguage.code, daysInWeek });
    const wkCached = getPlanCache(wkSig);
    if (wkCached) {
      setWeeklyPlan({ type: "repeat", weeks: [{ week: 1, days: wkCached }] });
      setLoadingPlan(false);
      return;
    }
    setLoadingPlan(true);
    const weekPrompt = buildWeekPrompt(availableItems, 1, totalWeeks, daysInWeek);
    let result = await invokeAI({ prompt: weekPrompt, response_json_schema: weeklyPlanSchema });
    if (calorieOff(result.days)) {
      result = await invokeAI({ prompt: `${weekPrompt}\n\nYour previous attempt had daily totals far from ${calories} kcal. Increase portions so each day totals ~${calories} kcal.`, response_json_schema: weeklyPlanSchema });
    }
    const days = filterPlanIngredients(scaleDayCalories(result.days || [], Number(calories)));
    setPlanCache(wkSig, days);
    setWeeklyPlan({ type: "repeat", weeks: [{ week: 1, days }] });
    setLoadingPlan(false);
  };

  const generateUniqueMonthlyPlan = async (groceriesSource) => {
    const weeks = await generateAllWeeks(groceriesSource);
    setWeeklyPlan({ type: "unique", weeks });
  };

  // Start the meal plan once the grocery list is ready. Called directly from
  // generateGroceries after the list is set (cache hit or fresh generation), so
  // the plan always builds on a real grocery list and never races ahead of it.
  // Hydrates from the sessionStorage plan cache first so revisiting a plan
  // (refresh / back / re-open) costs zero credits.
  const autoStartMealPlan = (groceriesResult) => {
    if (!groceriesResult) return;
    const availableItems = groceriesResult?.categories?.flatMap(cat =>
      cat.items
        .filter(item => !removedItems.has(`${cat.name}::${item.name}`))
        .map(item => `${item.name} (${item.quantity})`)
    ).join(", ");

    if (planStyle === "repeat") {
      const daysInWeek = Math.min(totalDays, 7);
      const wkSig = JSON.stringify({ items: availableItems, diet, calories, people, macros, lang: currentLanguage.code, daysInWeek });
      const wkCached = getPlanCache(wkSig);
      if (wkCached) {
        setWeeklyPlan({ type: "repeat", weeks: [{ week: 1, days: wkCached }] });
        return;
      }
    } else {
      const sig = JSON.stringify({ items: availableItems, diet, calories, people, macros, lang: currentLanguage.code, totalDays });
      const cached = getPlanCache(sig);
      if (cached) {
        setWeeklyPlan({ type: "unique", weeks: cached });
        return;
      }
    }

    setPlanError("");
    autoGenStarted.current = true;
    setLoadingPlan(true);
    (async () => {
      try {
        if (planStyle === "repeat") await generateWeeklyPlan(groceriesResult);
        else await generateUniqueMonthlyPlan(groceriesResult);
      } catch (e) {
        setLoadingPlan(false);
        setPlanError(e?.message || "Failed to generate meal plan.");
        autoGenStarted.current = false;
      }
    })();
  };

  const [saved, setSaved] = useState(false);
  const [swapTarget, setSwapTarget] = useState(null);
  const [grocerySwapTarget, setGrocerySwapTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [recipes, setRecipes] = useState({});
  const [recipeTarget, setRecipeTarget] = useState(null);
  const [sortByStore, setSortByStore] = useState(false);

  const recipeKey = (weekIndex, dayIndex, mealType) => `${weekIndex}:${dayIndex}:${mealType}`;

  const handleRecipe = (weekIndex, dayIndex, mealType, meal) => {
    if (!isPro) {
      openPricing?.();
      return;
    }
    setRecipeTarget({ weekIndex, dayIndex, mealType, meal });
  };

  const cacheRecipe = (weekIndex, dayIndex, mealType, entry) => {
    setRecipes(prev => ({ ...prev, [recipeKey(weekIndex, dayIndex, mealType)]: entry }));
  };
  const planKey = `${diet}-${budget}-${days}-${people}-${calories}`;
  const [boughtItems, setBoughtItems] = useState(() => {
    try {
      const raw = localStorage.getItem(`bb_bought_${planKey}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const toggleBought = (key) => {
    setBoughtItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem(`bb_bought_${planKey}`, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const handleAddItem = (item) => {
    const targetCat = item.category || "Custom";
    setGroceries(prev => {
      let newCategories = prev.categories;
      const existingCat = newCategories.find(c => c.name === targetCat);
      if (existingCat) {
        newCategories = newCategories.map(c => c.name === targetCat ? { ...c, items: [...c.items, item] } : c);
      } else {
        newCategories = [...newCategories, { name: targetCat, items: [item] }];
      }
      const newTotal = newCategories.flatMap(c => c.items).reduce((sum, i) => sum + (i.price || 0), 0);
      return { ...prev, categories: newCategories, total_estimated_cost: newTotal };
    });
    setWeeklyPlan(null);
  };

  const translateCategory = (englishName) => {
    const map = allCategoryTranslations[currentLanguage.code] || {};
    return map[englishName] || englishName;
  };

  const DIET_LABEL_KEYS = { balanced: "balanced", vegetarian: "vegetarian", vegan: "vegan", "high-protein": "highProtein", pescatarian: "pescatarian", "gluten-free": "glutenFree", halal: "halal", frozen: "frozenFoods", "half-cooked": "halfCooked" };
  const GOAL_LABEL_KEYS = { lose: "loseWeight", maintain: "maintain", gain: "gainWeight", muscle: "buildMuscle" };
  const dietLabel = t(DIET_LABEL_KEYS[diet] || "balanced");
  const goalLabel = t(GOAL_LABEL_KEYS[goal] || "maintain");

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
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageW, 110, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('BUDGETBITE', margin, 28);
    doc.text(new Date().toLocaleDateString('en-DE', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 28, { align: 'right' });
    doc.setFontSize(22); doc.text(t("yourWeeklyMealPlan"), margin, 52);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`${diet} · ${people} ${t("personS")} · ${t("repeatNote").replace(/^💡\s*/, '')}`, margin, 66);

    const stats = [
      { label: t("yourBudget").toUpperCase(), value: `€${parseFloat(budget).toFixed(0)}` },
      { label: t("calorieGoal").toUpperCase(), value: `${calories} kcal` },
      { label: t("numberOfPeople").toUpperCase(), value: String(people) },
      { label: 'MEALS / WEEK', value: '21' },
    ];
    const bw = (pageW - margin * 2) / 4;
    stats.forEach(({ label, value }, i) => {
      const bx = margin + i * bw;
      doc.setFillColor(30, 100, 70);
      doc.roundedRect(bx, 76, bw - 6, 28, 3, 3, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 230, 215);
      doc.text(label, bx + 8, 87);
      doc.setFontSize(14); doc.setTextColor(255, 255, 255);
      doc.text(value, bx + 8, 100);
    });
    y = 126;

    days.forEach((day, idx) => {
      const meals = [
        { label: t("breakfast").toUpperCase(), name: day.breakfast, cal: day.breakfast_calories, ings: day.breakfast_ingredients },
        { label: t("lunch").toUpperCase(),     name: day.lunch,     cal: day.lunch_calories,     ings: day.lunch_ingredients     },
        { label: t("dinner").toUpperCase(),    name: day.dinner,    cal: day.dinner_calories,    ings: day.dinner_ingredients    },
      ];
      const ingLines = meals.reduce((sum, m) => sum + (m.ings?.length || 0), 0);
      const needed = 28 + 14 + meals.length * 38 + ingLines * 10 + 12;
      checkPage(needed);

      doc.setFillColor(...(idx % 2 === 0 ? BG_LIGHT : [249, 250, 251]));
      doc.rect(margin, y, pageW - margin * 2, 20, 'F');
      doc.setFillColor(...GREEN);
      doc.circle(margin + 10, y + 10, 8, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(String(idx + 1), margin + 10, y + 13, { align: 'center' });
      doc.setTextColor(...GREEN);
      doc.setFontSize(11);
      doc.text(day.day, margin + 22, y + 14);
      y += 22;

      const rowStartY = y;
      let maxColH = 0;
      meals.forEach((meal, mIdx) => {
        const cx = margin + mIdx * col;
        let cy = rowStartY + 4;
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY);
        doc.text(meal.label, cx + 4, cy + 7);
        cy += 10;
        if (meal.cal) {
          doc.setFillColor(...LIGHT_GREEN);
          doc.roundedRect(cx + 4, cy, 48, 10, 3, 3, 'F');
          doc.setFontSize(7); doc.setTextColor(255, 255, 255);
          doc.text(`${meal.cal} kcal`, cx + 28, cy + 7, { align: 'center' });
          cy += 13;
        }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK);
        const nameLines = doc.splitTextToSize(meal.name || '', col - 10);
        doc.text(nameLines, cx + 4, cy + 9);
        cy += nameLines.length * 11 + 2;
        if (Array.isArray(meal.ings) && meal.ings.length > 0) {
          meal.ings.forEach(ing => {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GRAY);
            const ingText = doc.splitTextToSize(`· ${ing.name} ${ing.quantity}`, col - 10);
            doc.text(ingText, cx + 4, cy + 7);
            cy += ingText.length * 9;
          });
        }
        maxColH = Math.max(maxColH, cy - rowStartY);
      });

      doc.setDrawColor(230, 230, 230);
      doc.line(margin + col, rowStartY, margin + col, rowStartY + maxColH + 4);
      doc.line(margin + col * 2, rowStartY, margin + col * 2, rowStartY + maxColH + 4);
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, rowStartY - 22, pageW - margin * 2, maxColH + 26, 'S');
      y = rowStartY + maxColH + 10;
    });

    checkPage(20);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text(t("footerText"), margin, y);
    doc.text(t("repeatNote").replace(/^💡\s*/, ''), pageW - margin, y, { align: 'right' });

    doc.save(`meal-plan-${diet}-${budget}eur.pdf`);
  };

  const handleSwap = (dayIndex, mealType, alternative, weekIndex = 0) => {
    setWeeklyPlan(prev => {
      const newWeeks = prev.weeks.map((wk, wi) => {
        if (wi !== weekIndex) return wk;
        const newDays = [...wk.days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          [mealType]: alternative.name,
          [`${mealType}_calories`]: alternative.calories,
          [`${mealType}_ingredients`]: alternative.ingredients || [],
        };
        return { ...wk, days: newDays };
      });
      return { ...prev, weeks: newWeeks };
    });
    setSaved(false);
  };

  const handleMealEdit = (dayIndex, mealType, editedMeal, weekIndex = 0) => {
    setWeeklyPlan(prev => {
      const newWeeks = prev.weeks.map((wk, wi) => {
        if (wi !== weekIndex) return wk;
        const newDays = [...wk.days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          [mealType]: editedMeal.name,
          [`${mealType}_calories`]: editedMeal.calories,
          [`${mealType}_ingredients`]: editedMeal.ingredients || [],
        };
        return { ...wk, days: newDays };
      });
      return { ...prev, weeks: newWeeks };
    });
    setSaved(false);
  };

  const buildPlanRecord = () => ({
        name: `${diet} Meal Plan - ${new Date().toLocaleDateString()}`,
        diet,
        budget: parseFloat(budget),
        calories: parseFloat(calories),
        people: parseFloat(people),
        stores,
        days,
        postalCode: params.get("plz") || "",
        macros: macros || undefined,
        plan: { weeks: weeklyPlan.weeks, type: weeklyPlan.type },
        groceryList: groceries,
        recipes: Object.keys(recipes).length > 0 ? recipes : undefined
  });

  // Auto-save: once a plan is generated (and after every edit/swap), persist it
  // for logged-in users. The first save creates the record; later ones update it.
  const savedIdRef = useRef(null);
  useEffect(() => {
    if (!weeklyPlan || !groceries || loadingPlan) return;
    (async () => {
      if (!(await base44.auth.isAuthenticated())) return;
      if (savedIdRef.current) {
        await base44.entities.MealPlan.update(savedIdRef.current, buildPlanRecord());
      } else {
        const rec = await base44.entities.MealPlan.create(buildPlanRecord());
        savedIdRef.current = rec.id;
        toast.success(t("planSaved"));
        base44.functions.invoke("googleCalendarSync", { planId: rec.id }).catch(() => {});
      }
      setSaved(true);
    })().catch((e) => toast.error("Auto-save failed: " + (e?.message || "Unknown error")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyPlan, recipes]);

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
      const rec = await base44.entities.MealPlan.create(buildPlanRecord());
      savedIdRef.current = rec?.id;
      setSaved(true);
      toast.success(t("planSaved"));
      // Auto-sync to Google Calendar when the user is connected (fire-and-forget).
      if (rec?.id) {
        base44.functions.invoke("googleCalendarSync", { planId: rec.id })
          .then(() => toast.success(t("calendarSynced") || "Synced to Google Calendar"))
          .catch(() => { /* not connected / not authenticated — ignore */ });
      }
    } catch (error) {
      toast.error("Failed to save meal plan: " + (error?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // Clear the generated meal plan and its cache so the user can start fresh.
  const deleteAllMeals = () => {
    if (!window.confirm(t("deleteAllMealsConfirm") || "Delete all generated meals? You can generate a new plan afterwards.")) return;
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(PLAN_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
    setWeeklyPlan(null);
    setRecipes({});
    setSaved(false);
    savedIdRef.current = null;
    autoGenStarted.current = false;
    toast.success(t("deleteAllMealsDone") || "Meals cleared. Generate a new plan when you're ready.");
  };

  return (
    <PullToRefresh onRefresh={() => generateGroceries(0, true)}>
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("yourGroceryList")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("tx_dietLabel", { diet })} · €{budget}/{days} {t("days")} · {calories} kcal{t("tx_perDay")} · {people} {t("personS")}
          </p>
        </div>
        <CreditPill credits={credits} isPro={isPro} />
      </div>

      {loading ? (
        isActive ? (
          <div className="space-y-5">
            <ReassuranceRecap planStyle={planStyle} setPlanStyle={setPlanStyle} />
            <GeneratingLoader type="grocery" stores={stores} />
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>{t("bgGenerationNote") || "You can keep browsing the app — we'll keep generating in the background and your list will be ready when you come back."}</span>
            </div>
            <AdSlot duringGeneration layout="fixed-height" style={{ minHeight: 90 }} />
          </div>
        ) : null
      ) : generationError ? (
        <GroceryGenerationError message={generationError} onRetry={() => guarded(() => generateGroceries(0, true))} />
      ) : (
        <>
          {/* Spending mode badge */}
          {(() => {
            const modeKey = `spendMode${spendMode.charAt(0).toUpperCase() + spendMode.slice(1)}`;
            const modeLabel = t(modeKey) === modeKey ? spendMode : t(modeKey);
            const modeDescKey = `spendMode${spendMode.charAt(0).toUpperCase() + spendMode.slice(1)}Desc`;
            const modeDesc = t(modeDescKey) === modeDescKey ? "" : t(modeDescKey);
            const Icon = spendMode === "save" ? PiggyBank : spendMode === "maximize" ? Crown : Scale;
            return (
              <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{t("spendModeTitle") || "Spending mode"}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight">{modeLabel}</p>
                </div>
                {modeDesc && <p className="text-xs text-muted-foreground leading-snug ml-auto text-right hidden sm:block max-w-[60%]">{modeDesc}</p>}
              </div>
            );
          })()}

          {/* List intro */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("groceryListIntro", { diet: dietLabel, days, goal: goalLabel })}
            </p>
          </div>

          <p className="text-xs text-muted-foreground px-1 -mt-2 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{t("priceEstimateNote")}</span>
          </p>

          {/* Budget Summary */}
          <div className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <span className="font-heading font-semibold text-foreground">{t("estimatedTotalForDays", { days })}</span>
              </div>
              <span className="font-heading text-2xl font-bold text-primary">
                €{activeTotal.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">{t("yourBudget")}</p>
                <p className="font-heading text-lg font-bold text-foreground">€{parseFloat(budget).toFixed(2)}</p>
              </div>
              <div className={`bg-card border rounded-xl px-4 py-3 ${
                activeTotal <= parseFloat(budget) + proteinSnackBudget
                  ? 'border-green-200/50'
                  : 'border-destructive/30'
              }`}>
                <p className="text-xs text-muted-foreground mb-1">{t("remaining")}</p>
                <p className={`font-heading text-lg font-bold ${
                  activeTotal <= parseFloat(budget) + proteinSnackBudget
                    ? 'text-green-600'
                    : 'text-destructive'
                }`}>
                  €{(parseFloat(budget) + proteinSnackBudget - activeTotal).toFixed(2)}
                </p>
              </div>
            </div>
            {proteinSnackBudget > 0 && (() => {
              const proteinItems = groceries?.categories?.find(c => c.name === "Protein Snacks");
              const proteinSpent = proteinItems
                ? proteinItems.items.filter(i => !removedItems.has(`${proteinItems.name}::${i.name}`)).reduce((s, i) => s + (i.price || 0), 0)
                : 0;
              const proteinRemaining = proteinSnackBudget - proteinSpent;
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">💪</span>
                      <div>
                        <p className="text-xs font-semibold text-blue-800">{t("proteinSnackBudgetTitle")}</p>
                        <p className="text-xs text-blue-600">€{parseFloat(budget).toFixed(2)} + €{proteinSnackBudget.toFixed(2)} = €{(parseFloat(budget) + proteinSnackBudget).toFixed(2)} total</p>
                      </div>
                    </div>
                    <p className="font-heading text-lg font-bold text-blue-700">€{proteinSnackBudget.toFixed(2)}</p>
                  </div>
                  {proteinSpent > 0 && (
                    <div className="mt-2 flex items-center justify-between text-xs border-t border-blue-200 pt-2">
                      <span className="text-blue-700">{t("proteinSnackSaved")}</span>
                      <span className={`font-bold ${proteinRemaining >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {proteinRemaining >= 0 ? "+" : ""}€{proteinRemaining.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
            {totalSaved > 0 && (() => {
              const normalTotal = activeTotal + totalSaved;
              const pct = normalTotal > 0 ? Math.round((totalSaved / normalTotal) * 100) : 0;
              return (
                <div className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                  <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/10" />
                  <div className="relative flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <PiggyBank className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-heading font-bold uppercase tracking-wider opacity-80">{t("savedVsRegular")}</p>
                      <p className="font-heading text-4xl font-extrabold leading-none mt-1">€{totalSaved.toFixed(2)}</p>
                      <p className="text-sm opacity-90 mt-2 leading-relaxed">
                        {t("savedCelebration", { amount: `€${totalSaved.toFixed(2)}`, pct })}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-center justify-center bg-white/20 rounded-2xl px-3 py-2 backdrop-blur-sm shrink-0">
                      <TrendingDown className="h-5 w-5" />
                      <span className="font-heading text-2xl font-bold leading-none mt-0.5">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={shareGroceryList} size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              {(SHARE_L[currentLanguage.code] || SHARE_L.en).share}
            </Button>
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              {t("exportCSV")}
            </Button>
            <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t("exportPDF")}
            </Button>
          </div>

          {/* Display ad — between summary and the grocery list */}
          <AdSlot layout="fixed-height" style={{ minHeight: 90 }} />

          {/* Categories */}
          <div>
            <GrocerySortToggle sortByStore={sortByStore} setSortByStore={setSortByStore} />
            {!sortByStore ? (
              groceries?.categories?.map((category) => (
                <div key={category.name} className="bg-card border border-border rounded-xl overflow-hidden mb-3">
                  <div className="bg-secondary px-5 py-3">
                    <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
                      {translateCategory(category.name)}
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {category.items?.filter(item => !removedItems.has(`${category.name}::${item.name}`)).map((item, idx) => (
                      <GroceryItemRow
                        key={idx}
                        item={item}
                        categoryName={category.name}
                        stores={stores}
                        bought={boughtItems.has(`${category.name}::${item.name}`)}
                        onToggleBought={() => toggleBought(`${category.name}::${item.name}`)}
                        onSwap={(it, cat) => setGrocerySwapTarget({ item: it, category: cat })}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              (() => {
                const items = getActiveItems();
                const groups = {};
                items.forEach(it => {
                  const key = it.store || "__other__";
                  (groups[key] = groups[key] || []).push(it);
                });
                return Object.keys(groups).sort().map(storeName => (
                  <div key={storeName} className="bg-card border border-border rounded-xl overflow-hidden mb-3">
                    <div className="bg-secondary px-5 py-3 flex items-center gap-2">
                      {storeName !== "__other__" && <StoreBadge store={storeName} />}
                      <span className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
                        {storeName === "__other__" ? "Other" : storeName}
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {groups[storeName].map((item, idx) => (
                        <GroceryItemRow
                          key={idx}
                          item={item}
                          categoryName={item.category}
                          stores={stores}
                          bought={boughtItems.has(`${item.category}::${item.name}`)}
                          onToggleBought={() => toggleBought(`${item.category}::${item.name}`)}
                          onSwap={(it, cat) => setGrocerySwapTarget({ item: it, category: cat })}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>

          {/* Add Item */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border border-dashed border-primary/40 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("addItemWithAI")}
          </button>

          {/* Meal plan generates automatically once groceries are ready */}
          {!weeklyPlan && loadingPlan && (
            <>
              <GeneratingLoader type="plan" />
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>{t("bgGenerationNote") || "You can keep browsing the app — we'll keep generating in the background and your list will be ready when you come back."}</span>
              </div>
              <AdSlot duringGeneration layout="fixed-height" style={{ minHeight: 90 }} />
            </>
          )}

          {/* Meal plan failed or never started — show a retry/generate button */}
          {!weeklyPlan && !loadingPlan && (
            <div className="bg-card border border-border rounded-xl p-5 text-center space-y-3">
              {planError ? (
                <>
                  <p className="text-sm text-destructive font-medium">{t("planGenFailed") || "Meal plan could not be generated."}</p>
                  <p className="text-xs text-muted-foreground">{planError}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("planGenReady") || "Your grocery list is ready. Generate your meal plan."}</p>
              )}
              <Button
                onClick={() => {
                  setPlanError("");
                  autoGenStarted.current = false;
                  setLoadingPlan(true);
                  (async () => {
                    try {
                      if (planStyle === "repeat") await generateWeeklyPlan();
                      else await generateUniqueMonthlyPlan();
                    } catch (e) {
                      setLoadingPlan(false);
                      setPlanError(e?.message || "Failed to generate meal plan.");
                    }
                  })();
                }}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {planError ? (t("retry") || "Retry") : (t("generateMealPlan") || "Generate meal plan")}
              </Button>
            </div>
          )}

          {/* Weekly Plan Display */}
          {weeklyPlan?.weeks?.length > 0 && (
           <div className="space-y-4">
             <div className="flex items-center gap-2">
               <span className="font-heading font-bold text-lg">
                 {weeklyPlan.type === "exact"
                   ? `📅 ${t("exactDaysPlanLabel", { days })}`
                   : weeklyPlan.type === "unique"
                   ? t("uniqueMonthlyPlan")
                   : "🔁 " + t("yourWeeklyMealPlanHeader")}
               </span>
               {weeklyPlan.type === "repeat" && (
                 <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{t("repeats4Weeks")}</span>
               )}
               {weeklyPlan.type === "exact" && (
               <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{days} {t("days")} · {weeklyPlan.weeks.length} {t("weeks")}</span>
               )}
             </div>

             {weeklyPlan.weeks.map((week, weekIndex) => (
               <div key={weekIndex} className="space-y-2">
                 <h2 className="font-heading font-semibold text-primary text-sm px-1">
                   {t("weekLabel", { n: week.week })}
                 </h2>
                 <WeekMealGrid
                   week={week}
                   weekIndex={weekIndex}
                   t={t}
                   isPro={isPro}
                   onEdit={(wi, di, mt, meal) => setEditTarget({ weekIndex: wi, dayIndex: di, mealType: mt, meal })}
                   onSwap={(wi, di, mt, meal) => setSwapTarget({ weekIndex: wi, dayIndex: di, mealType: mt, meal })}
                   onRecipe={handleRecipe}
                 />
               </div>
             ))}

             {/* Weekly Summary */}
             {(() => {
               const allDays = weeklyPlan.weeks.flatMap(w => w.days || []);
               const totalCal = allDays.reduce((sum, d) =>
                 sum + (d.breakfast_calories || 0) + (d.lunch_calories || 0) + (d.dinner_calories || 0), 0);
               const avgCal = allDays.length > 0 ? Math.round(totalCal / allDays.length) : 0;
               const costPerDay = activeTotal / days;
               const planDays = allDays.length;
               const planCost = costPerDay * planDays;
               return (
                 <div className="bg-card border border-border rounded-xl overflow-hidden">
                   <div className="bg-secondary px-5 py-3">
                     <h3 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">📊 {t("tx_planSummary")}</h3>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                     <div className="px-4 py-4 text-center">
                       <p className="text-xs text-muted-foreground mb-1">{t("totalDays")}</p>
                       <p className="font-heading text-2xl font-bold text-foreground">{planDays}</p>
                     </div>
                     <div className="px-4 py-4 text-center">
                       <p className="text-xs text-muted-foreground mb-1">{t("totalCalories")}</p>
                       <p className="font-heading text-2xl font-bold text-primary">{totalCal.toLocaleString()}</p>
                       <p className="text-xs text-muted-foreground">~{avgCal} kcal{t("tx_perDay")}</p>
                     </div>
                     <div className="px-4 py-4 text-center">
                       <p className="text-xs text-muted-foreground mb-1">{t("tx_estCost")}</p>
                       <p className="font-heading text-2xl font-bold text-foreground">€{planCost.toFixed(2)}</p>
                       <p className="text-xs text-muted-foreground">~€{costPerDay.toFixed(2)}{t("tx_perDay")}</p>
                     </div>
                     <div className="px-4 py-4 text-center">
                       <p className="text-xs text-muted-foreground mb-1">{t("mealsTotal")}</p>
                       <p className="font-heading text-2xl font-bold text-foreground">{planDays * 3}</p>
                       <p className="text-xs text-muted-foreground">{t("tx_mealsPerDay")}</p>
                     </div>
                   </div>
                 </div>
               );
             })()}

             {/* Macro breakdown chart */}
             <MacroChart calories={parseFloat(calories)} macros={macros} />

             {/* Nutrition CTA */}
             <Link to={`/nutrition?budget=${budget}&stores=${encodeURIComponent(stores)}&diet=${diet}&people=${people}&calories=${calories}&junkPercent=${junkPercent}`} className="block">
               <div className="flex items-center gap-4 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 hover:bg-primary/20 transition-colors cursor-pointer">
                 <div className="bg-primary rounded-lg p-2 shrink-0">
                   <BarChart2 className="h-5 w-5 text-primary-foreground" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-heading font-semibold text-foreground text-sm">{t("viewNutritionAnalysis")}</p>
                   <p className="text-xs text-muted-foreground">{t("nutritionSubtitle")}</p>
                 </div>
                 <span className="text-primary font-semibold text-sm shrink-0">→</span>
               </div>
             </Link>

             {/* Footer actions */}
             <div className="bg-muted rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
               <p className="text-xs text-muted-foreground">
                 {weeklyPlan.type === "repeat"
                   ? t("repeatNote")
                   : weeklyPlan.type === "exact"
                   ? `📅 ${t("exactDaysPlanNote", { days })}`
                   : t("unique4WeeksGenerated")}
               </p>
               <div className="flex items-center gap-2 flex-wrap">
                 <Button onClick={() => exportMealPlanPDF()} variant="outline" size="sm" className="gap-2">
                   <FileDown className="h-4 w-4" />
                   {t("downloadPlan")}
                 </Button>
                 <Button onClick={saveMealPlan} disabled={saving || saved} size="sm" className="gap-2">
                   <Save className="h-4 w-4" />
                   {saved ? t("planSaved") : saving ? t("saving") : t("savePlan")}
                 </Button>
                 <Button onClick={deleteAllMeals} variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                   <Trash2 className="h-4 w-4" />
                   {t("deleteAllMeals") || "Delete all"}
                 </Button>
               </div>
             </div>
           </div>
          )}

          {/* Estimated total summary (based on active selections) */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShoppingBasket className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("estimatedTotalForDays", { days })}</p>
                <p className="font-heading text-2xl font-bold text-primary">€{activeTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{getActiveItems().length} {t("items") || "items"}</p>
              <p className={`text-sm font-semibold ${activeTotal <= parseFloat(budget) + proteinSnackBudget ? "text-green-600" : "text-destructive"}`}>
                {activeTotal <= parseFloat(budget) + proteinSnackBudget
                  ? `€${(parseFloat(budget) + proteinSnackBudget - activeTotal).toFixed(2)} ${t("remaining")}`
                  : `€${(activeTotal - parseFloat(budget) - proteinSnackBudget).toFixed(2)} over`}
              </p>
            </div>
          </div>

          <div className="pb-8">
            <Button onClick={() => guarded(() => generateGroceries(0, true))} variant="outline" className="w-full">
              {t("regenerate")}
            </Button>
          </div>
        </>
      )}
    </div>
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal
            stores={stores}
            diet={diet}
            onAdd={handleAddItem}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {grocerySwapTarget && (
          <GrocerySwapModal
            item={grocerySwapTarget.item}
            category={grocerySwapTarget.category}
            diet={diet}
            budget={budget}
            stores={stores}
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
            onSwap={(dayIndex, mealType, alt) => handleSwap(dayIndex, mealType, alt, swapTarget.weekIndex || 0)}
            onClose={() => setSwapTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recipeTarget && (
          <RecipeModal
            meal={recipeTarget.meal}
            diet={diet}
            people={parseFloat(people)}
            initialRecipe={recipes[recipeKey(recipeTarget.weekIndex, recipeTarget.dayIndex, recipeTarget.mealType)]}
            onCache={(entry) => cacheRecipe(recipeTarget.weekIndex, recipeTarget.dayIndex, recipeTarget.mealType, entry)}
            onClose={() => setRecipeTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editTarget && (
          <MealEditModal
            meal={editTarget.meal}
            mealType={editTarget.mealType}
            dayIndex={editTarget.dayIndex}
            groceryItems={getActiveItems()}
            onSave={(dayIndex, mealType, editedMeal) => handleMealEdit(dayIndex, mealType, editedMeal, editTarget.weekIndex || 0)}
            onClose={() => setEditTarget(null)}
          />
        )}
      </AnimatePresence>

    </PullToRefresh>
  );
}