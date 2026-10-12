import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { categoryTranslations } from "@/lib/translations";
import { euCategoryTranslations } from "@/lib/translations_eu";
import {
  ArrowLeft,
  RefreshCw,
  ShoppingBasket,
  ChefHat,
  Loader2,
  Clock,
  Lock,
  Sparkles,
  Info,
  PiggyBank,
  TrendingDown,
  Share2,
  FileText,
  FileDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeModal from "@/components/RecipeModal";
import GroceryItemRow from "@/components/GroceryItemRow";
import StoreBadge from "@/components/StoreBadge";
import GrocerySortToggle from "@/components/GrocerySortToggle";
import GrocerySwapModal from "@/components/GrocerySwapModal";
import AddItemModal from "@/components/AddItemModal";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const allCategoryTranslations = { ...categoryTranslations, ...euCategoryTranslations };

const SHARE_L = {
  de: { share: "Teilen", copied: "Einkaufsliste in Zwischenablage kopiert!" },
  en: { share: "Share", copied: "Grocery list copied to clipboard!" },
  fr: { share: "Partager", copied: "Liste de courses copiée !" },
  es: { share: "Compartir", copied: "¡Lista de compras copiada!" },
  it: { share: "Condividi", copied: "Lista della spesa copiata!" },
};

const MEAL_SLOTS = [
  { key: "breakfast", labelKey: "breakfast" },
  { key: "lunch", labelKey: "lunch" },
  { key: "dinner", labelKey: "dinner" },
];

export default function PlanGroceryResult({
  grocery,
  prep,
  days = 7,
  people = 1,
  diet = "balanced",
  stores = [],
  onReset,
  readOnly = false,
  footer,
  onGroceryChange,
}) {
  const { t, currentLanguage } = useLanguage();
  const { isPro, openPricing } = useMonetization();

  // Active view: "grocery" or "prep"
  const [activeTab, setActiveTab] = useState("grocery");

  // Groceries state allows adding, removing, and swapping items
  const [groceries, setGroceries] = useState(grocery);
  useEffect(() => {
    setGroceries(grocery);
  }, [grocery]);

  const [removedItems, setRemovedItems] = useState(new Set());
  const [sortByStore, setSortByStore] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [grocerySwapTarget, setGrocerySwapTarget] = useState(null);

  // Recipes state for prep guide
  const [recipes, setRecipes] = useState({});
  const [recipeTarget, setRecipeTarget] = useState(null);

  const storesStr = useMemo(() => {
    if (Array.isArray(stores)) return stores.join(", ");
    return String(stores || "Aldi, Lidl, REWE, Edeka, Penny, Netto");
  }, [stores]);

  const planKey = useMemo(() => `bb_bought_pb_${diet}_${days}_${people}`, [diet, days, people]);
  const [boughtItems, setBoughtItems] = useState(() => {
    try {
      const raw = localStorage.getItem(planKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBought = (key) => {
    setBoughtItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(planKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const getActiveItems = () =>
    (groceries?.categories || []).flatMap((cat) =>
      (cat.items || [])
        .filter((item) => !removedItems.has(`${cat.name}::${item.name}`))
        .map((item) => ({ ...item, category: cat.name }))
    );

  const activeTotal = getActiveItems().reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const totalSaved = getActiveItems().reduce((sum, item) => {
    if (item.normal_price != null && item.normal_price > item.price) {
      return sum + (item.normal_price - item.price);
    }
    return sum;
  }, 0);

  const normalTotal = activeTotal + totalSaved;
  const pct = normalTotal > 0 ? Math.round((totalSaved / normalTotal) * 100) : 0;

  // Pro upsell: only for non-Pro users whose savings exceed the subscription
  // price, so the "still save €X" claim is always true.
  const PRO_PRICE = 3.99;
  const stillSaved = totalSaved - PRO_PRICE;
  const showProUpsell = !isPro && totalSaved > PRO_PRICE;

  const catMap = allCategoryTranslations[currentLanguage?.code] || {};
  const trCat = (name) => catMap[name] || name;

  const DIET_LABEL_KEYS = {
    balanced: "balanced",
    vegetarian: "vegetarian",
    vegan: "vegan",
    "high-protein": "highProtein",
    pescatarian: "pescatarian",
    "gluten-free": "glutenFree",
    halal: "halal",
    frozen: "frozenFoods",
    "half-cooked": "halfCooked",
  };
  const dietLabel = t(DIET_LABEL_KEYS[diet] || "balanced");

  const removeItem = (categoryName, itemName) => {
    setRemovedItems((prev) => new Set([...prev, `${categoryName}::${itemName}`]));
  };

  const handleAddItem = (item) => {
    const targetCat = item.category || "Custom";
    setGroceries((prev) => {
      let newCategories = prev?.categories || [];
      const existingCat = newCategories.find((c) => c.name === targetCat);
      if (existingCat) {
        newCategories = newCategories.map((c) =>
          c.name === targetCat ? { ...c, items: [...(c.items || []), item] } : c
        );
      } else {
        newCategories = [...newCategories, { name: targetCat, items: [item] }];
      }
      const newTotal = newCategories.flatMap((c) => c.items || []).reduce((sum, i) => sum + (i.price || 0), 0);
      const updated = { ...prev, categories: newCategories, total_estimated_cost: newTotal };
      if (onGroceryChange) onGroceryChange(updated);
      return updated;
    });
  };

  const handleGrocerySwap = (categoryName, oldItem, newItem) => {
    setGroceries((prev) => {
      const newCategories = (prev?.categories || []).map((cat) => {
        if (cat.name !== categoryName) return cat;
        return {
          ...cat,
          items: (cat.items || []).map((i) => (i.name === oldItem.name ? { ...newItem, category: categoryName } : i)),
        };
      });
      const newTotal = newCategories.flatMap((c) => c.items || []).reduce((sum, i) => sum + (i.price || 0), 0);
      const updated = { ...prev, categories: newCategories, total_estimated_cost: newTotal };
      if (onGroceryChange) onGroceryChange(updated);
      return updated;
    });
  };

  const recipeKey = (dayIdx, mealType) => `${dayIdx}:${mealType}`;
  const handleRecipe = (dayIdx, mealType, mealName) => {
    if (!isPro) {
      openPricing?.();
      return;
    }
    setRecipeTarget({ dayIdx, mealType, meal: { name: mealName, mealType, ingredients: [] } });
  };
  const cacheRecipe = (dayIdx, mealType, entry) =>
    setRecipes((prev) => ({ ...prev, [recipeKey(dayIdx, mealType)]: entry }));

  const shareGroceryList = async () => {
    const items = getActiveItems();
    const byCategory = {};
    items.forEach((it) => {
      (byCategory[it.category] = byCategory[it.category] || []).push(it);
    });
    const lines = [];
    lines.push(`🛒 BudgetBite — ${t("yourGroceryList")}`);
    lines.push(`${dietLabel} · ${days} ${t("days")} · ${people} ${people === 1 ? t("person") : t("people")}`);
    lines.push("");
    Object.entries(byCategory).forEach(([cat, catItems]) => {
      lines.push(`▶ ${trCat(cat)}`);
      catItems.forEach((it) => {
        const storeStr = it.store ? ` [${it.store}]` : "";
        lines.push(`  • ${it.name} — ${it.quantity} — €${(it.price || 0).toFixed(2)}${storeStr}`);
      });
      lines.push("");
    });
    lines.push(`💰 ${t("estimatedTotalForDays", { days })}: €${activeTotal.toFixed(2)}`);
    const text = lines.join("\n");
    const s = SHARE_L[currentLanguage?.code] || SHARE_L.en;
    if (navigator.share) {
      try {
        await navigator.share({ title: t("yourGroceryList"), text });
        return;
      } catch {
        /* fallback to clipboard */
      }
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
    items.forEach((item) =>
      rows.push([
        item.category,
        item.name,
        item.quantity,
        (item.price || 0).toFixed(2),
        item.store || "",
        item.calories_info || "",
      ])
    );
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "TOTAL", "", activeTotal.toFixed(2), "", ""]);
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grocery-list-${diet}-${days}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const items = getActiveItems();
    const categories = {};
    items.forEach((item) => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    const pageWidth = 794;
    const pageHeight = 1123;
    const pagePadding = 48;
    const contentWidth = pageWidth - pagePadding * 2;

    const esc = (s) =>
      String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const headerHtml = `
      <div style="margin:0 -48px 28px;padding:24px 48px 26px;background:#0f4c35;color:white;">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;letter-spacing:.08em;margin-bottom:12px;">
          <span>BUDGETBITE</span>
          <span>${new Date().toLocaleDateString(currentLanguage?.code || "en-DE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</span>
        </div>
        <h1 style="font-size:28px;line-height:1.2;margin:0 0 8px;font-weight:800;">${t("yourGroceryList")}</h1>
        <p style="margin:0;font-size:14px;opacity:.9;">${esc(dietLabel)} · ${days} ${t("days")} · ${people} ${
      people === 1 ? t("person") : t("people")
    }</p>
      </div>
    `;

    const itemHtml = (item) => `
      <div style="display:flex;justify-content:space-between;gap:18px;padding:12px 16px;border-top:1px solid #f3f4f6;break-inside:avoid;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#111827;">${esc(item.name || "")}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:3px;">${esc(item.quantity || "")}</div>
        </div>
        <div style="text-align:right;min-width:90px;">
          <div style="font-size:15px;font-weight:800;color:#0f4c35;">€${(item.price || 0).toFixed(2)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:3px;">${esc(item.store || "")}</div>
        </div>
      </div>
    `;

    const sectionHtml = (catName, catItems) => `
      <section style="break-inside:avoid;margin-bottom:18px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <h2 style="margin:0;padding:12px 16px;background:#f0fdf4;color:#0f4c35;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;">${esc(
          trCat(catName)
        )}</h2>
        ${catItems.map(itemHtml).join("")}
      </section>
    `;

    const totalHtml = `
      <div style="margin-top:24px;padding:16px 18px;background:#0f4c35;color:white;border-radius:14px;display:flex;justify-content:space-between;font-size:18px;font-weight:800;break-inside:avoid;">
        <span>${t("estimatedTotal") || "Estimated Total"}</span>
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
      pages.push(currentBlocks.join(""));
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

      const heading = `<section style="margin-bottom:18px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;"><h2 style="margin:0;padding:12px 16px;background:#f0fdf4;color:#0f4c35;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;">${esc(
        trCat(catName)
      )}</h2>`;
      const close = `</section>`;
      let sectionBlocks = [heading];
      let sectionHeight = measure(heading + close);

      catItems.forEach((item) => {
        const block = itemHtml(item);
        const blockHeight = measure(block);
        if (sectionHeight + blockHeight > maxContentHeight && sectionBlocks.length > 1) {
          currentBlocks.push(sectionBlocks.join("") + close);
          currentHeight = measure(currentBlocks.join(""));
          pushPage();
          sectionBlocks = [heading];
          sectionHeight = measure(heading + close);
        }
        sectionBlocks.push(block);
        sectionHeight += blockHeight;
      });

      currentBlocks.push(sectionBlocks.join("") + close);
      currentHeight = measure(currentBlocks.join(""));
    });

    const tHeight = measure(totalHtml);
    if (currentHeight + tHeight > maxContentHeight) pushPage();
    currentBlocks.push(totalHtml);
    pages.push(currentBlocks.join(""));
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
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pdf.internal.pageSize.getWidth(),
        pdf.internal.pageSize.getHeight()
      );
    }

    pdf.save(`grocery-list-${diet}-${days}days.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header navigation & title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          {!readOnly && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </button>
          )}
          <h1 className="font-heading text-2xl font-bold">{t("yourGroceryList")}</h1>
          <p className="text-sm text-muted-foreground">
            {dietLabel} · {days} {t("days")} · {people} {people === 1 ? t("person") : t("people")}
          </p>
        </div>
      </div>

      {/* Tabs if prep guide is enabled */}
      {prep && (
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("grocery")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "grocery"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBasket className="h-4 w-4 text-primary" />
            <span>{t("planGroceryTitle") || "Grocery List"}</span>
          </button>
          <button
            onClick={() => setActiveTab("prep")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "prep"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="h-4 w-4 text-primary" />
            <span>{t("planPrepTitle") || "Meal Prep Guide"}</span>
          </button>
        </div>
      )}

      {/* TAB 1: GROCERY LIST */}
      {activeTab === "grocery" && (
        <>
          {/* List intro notice */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("groceryListIntro", { diet: dietLabel, days, goal: t("balanced") })}
            </p>
          </div>

          <p className="text-xs text-muted-foreground px-1 -mt-2 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{t("priceEstimateNote")}</span>
          </p>

          {/* Budget & Savings Summary Cards */}
          <div className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-primary" />
                <span className="font-heading font-semibold text-foreground">
                  {t("estimatedTotalForDays", { days })}
                </span>
              </div>
              <span className="font-heading text-2xl font-bold text-primary">
                €{activeTotal.toFixed(2)}
              </span>
            </div>

            {totalSaved > 0 && (
              <div className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute -right-2 top-10 h-16 w-16 rounded-full bg-white/10" />
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                    <PiggyBank className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-bold uppercase tracking-wider opacity-80">
                      {t("savedVsRegular")}
                    </p>
                    <p className="font-heading text-4xl font-extrabold leading-none mt-1">
                      €{totalSaved.toFixed(2)}
                    </p>
                    <p className="text-sm opacity-90 mt-2 leading-relaxed">
                      {t("savedCelebration", { amount: `€${totalSaved.toFixed(2)}`, pct })}
                    </p>
                    {showProUpsell && (
                      <button
                        type="button"
                        onClick={() => openPricing?.()}
                        className="mt-3 flex w-full items-center gap-2 rounded-xl bg-foreground/10 px-3 py-2 text-left backdrop-blur-sm transition-colors hover:bg-foreground/15"
                      >
                        <span className="text-sm opacity-95 leading-snug">
                          {t("proUpsellSavings", { price: PRO_PRICE.toFixed(2), saved: `€${stillSaved.toFixed(2)}` })}
                        </span>
                        <span className="ml-auto shrink-0 rounded-lg bg-foreground px-3 py-1.5 text-xs font-heading font-bold text-background">
                          {t("proUpsellCta")}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-center justify-center bg-white/20 rounded-2xl px-3 py-2 backdrop-blur-sm shrink-0">
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-heading text-2xl font-bold leading-none mt-0.5">{pct}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export and Share Actions */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button onClick={shareGroceryList} size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              {(SHARE_L[currentLanguage?.code] || SHARE_L.en).share}
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

          {/* Sort toggle & Category / Store listings */}
          <div className="space-y-3">
            <GrocerySortToggle sortByStore={sortByStore} setSortByStore={setSortByStore} />
            {!sortByStore ? (
              (groceries?.categories || []).map((category) => {
                const visibleItems = (category.items || []).filter(
                  (item) => !removedItems.has(`${category.name}::${item.name}`)
                );
                if (!visibleItems.length) return null;
                return (
                  <div key={category.name} className="bg-card border border-border rounded-xl overflow-hidden mb-3">
                    <div className="bg-secondary px-5 py-3">
                      <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
                        {trCat(category.name)}
                      </h2>
                    </div>
                    <div className="divide-y divide-border">
                      {visibleItems.map((item, idx) => (
                        <GroceryItemRow
                          key={idx}
                          item={item}
                          categoryName={category.name}
                          stores={storesStr}
                          bought={boughtItems.has(`${category.name}::${item.name}`)}
                          onToggleBought={() => toggleBought(`${category.name}::${item.name}`)}
                          onSwap={(it, cat) => setGrocerySwapTarget({ item: it, category: cat })}
                          onRemove={removeItem}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              (() => {
                const items = getActiveItems();
                const groups = {};
                items.forEach((it) => {
                  const key = it.store || "__other__";
                  (groups[key] = groups[key] || []).push(it);
                });
                return Object.keys(groups).sort().map((storeName) => (
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
                          stores={storesStr}
                          bought={boughtItems.has(`${item.category}::${item.name}`)}
                          onToggleBought={() => toggleBought(`${item.category}::${item.name}`)}
                          onSwap={(it, cat) => setGrocerySwapTarget({ item: it, category: cat })}
                          onRemove={removeItem}
                          readOnly={readOnly}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>

          {/* Add item button */}
          {!readOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border border-dashed border-primary/40 rounded-xl text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("addItemWithAI")}
            </button>
          )}

          {/* Active summary footer */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShoppingBasket className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t("estimatedTotalForDays", { days })}</p>
                <p className="font-heading text-2xl font-bold text-primary">€{activeTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {getActiveItems().length} {t("items") || "items"}
              </p>
              {totalSaved > 0 && (
                <p className="text-sm font-semibold text-green-600">
                  {t("savingsAmount", { amount: totalSaved.toFixed(2) })}
                </p>
              )}
            </div>
          </div>

          {/* Regenerate button */}
          {!readOnly && (
            <div className="pt-2">
              <Button onClick={onReset} variant="outline" className="w-full gap-2">
                <RefreshCw className="h-4 w-4" />
                {t("regenerate")}
              </Button>
            </div>
          )}

          {footer}
        </>
      )}

      {/* TAB 2: PREP GUIDE */}
      {activeTab === "prep" && prep && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <ChefHat className="h-4 w-4" /> {t("planPrepTitle")}
          </div>
          <p className="text-xs text-muted-foreground">{t("planPrepSubtitle")}</p>

          <div className="space-y-3">
            {prep.days?.map((d, i) => {
              const meals = MEAL_SLOTS.map((s) => ({ ...s, data: d[s.key] })).filter(
                (s) => s.data && s.data.meal
              );
              if (!meals.length) return null;
              return (
                <div key={i} className="border border-border rounded-2xl bg-card p-4">
                  <h4 className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    {t("day") || "Day"} {i + 1}
                  </h4>
                  <div className="space-y-3">
                    {meals.map((s) => (
                      <div key={s.key} className="border-t border-border pt-2 first:border-0 first:pt-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground flex-1 min-w-0">
                            {s.data.meal}
                          </p>
                          <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">
                            {t(s.labelKey)}
                          </span>
                          <button
                            onClick={() => handleRecipe(i, s.key, s.data.meal)}
                            className="relative text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/10 shrink-0"
                            title={isPro ? t("recipe") || "Recipe" : t("recipePro") || "Recipe — Pro"}
                          >
                            <ChefHat className="h-3.5 w-3.5" />
                            {!isPro && (
                              <Lock className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-foreground bg-card rounded-full p-0.5" />
                            )}
                          </button>
                        </div>
                        {s.data.portion && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{t("portionLabel")}:</span>{" "}
                            {s.data.portion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{s.data.prep}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal
            stores={storesStr}
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
            stores={storesStr}
            onSwap={handleGrocerySwap}
            onClose={() => setGrocerySwapTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recipeTarget && (
          <RecipeModal
            meal={recipeTarget.meal}
            diet={diet || ""}
            people={people}
            initialRecipe={recipes[recipeKey(recipeTarget.dayIdx, recipeTarget.mealType)]}
            onCache={(entry) => cacheRecipe(recipeTarget.dayIdx, recipeTarget.mealType, entry)}
            onClose={() => setRecipeTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}