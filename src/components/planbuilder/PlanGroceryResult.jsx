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
import GroceryGroupedList from "@/components/GroceryGroupedList";
import GrocerySwapModal from "@/components/GrocerySwapModal";
import AddItemModal from "@/components/AddItemModal";
import { AnimatePresence } from "framer-motion";
import ExtendableList from "@/components/ExtendableList";
import FreeGroceryCapNotice from "@/components/FreeGroceryCapNotice";
import GroceryCalorieWarning from "@/components/GroceryCalorieWarning";
import { toast } from "sonner";
import { downloadGroceryListPDF } from "@/lib/groceryPdfExport";

const allCategoryTranslations = { ...categoryTranslations, ...euCategoryTranslations };

const SHARE_L = {
  de: { share: "Teilen", copied: "Einkaufsliste in Zwischenablage kopiert!" },
  en: { share: "Share", copied: "Grocery list copied to clipboard!" },
  fr: { share: "Partager", copied: "Liste de courses copiée !" },
  es: { share: "Compartir", copied: "¡Lista de compras copiada!" },
  it: { share: "Condividi", copied: "Lista della spesa copiata!" },
};

const MEAL_SLOTS = [
  { key: "breakfast", labelKey: "breakfast", pillBg: "bg-[#FFB020]" },
  { key: "lunch", labelKey: "lunch", pillBg: "bg-[#78a71b]" },
  { key: "dinner", labelKey: "dinner", pillBg: "bg-[#C084FC]" },
];

export default function PlanGroceryResult({
  grocery,
  prep,
  days = 7,
  planDays,
  people = 1,
  diet = "balanced",
  stores = [],
  calories,
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
  const activeKcal = getActiveItems().reduce((sum, item) => sum + (Number(item.total_kcal) || 0), 0);
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

  const exportPDF = () =>
    downloadGroceryListPDF({
      items: getActiveItems(),
      activeTotal,
      titleText: t("yourGroceryList"),
      subtitleText: `${dietLabel} · ${days} ${t("days")} · ${people} ${people === 1 ? t("person") : t("people")}`,
      totalLabel: t("estimatedTotal") || "Estimated Total",
      translateCategory: trCat,
      langCode: currentLanguage?.code,
      filename: `grocery-list-${diet}-${days}days.pdf`,
    });

  const activeItemsList = getActiveItems();
  const boughtCount = activeItemsList.filter((it) => boughtItems.has(`${it.category}::${it.name}`)).length;
  const boughtPct = activeItemsList.length > 0 ? Math.round((boughtCount / activeItemsList.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {!readOnly && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#111827] bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] rounded-full px-3.5 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("back")}
        </button>
      )}

      {/* Bento Arcade Hero Header */}
      <div className="bba-t bg-[#78a71b] text-[#111827] space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <span className="bba-sticker">
              <Sparkles className="h-3.5 w-3.5 text-[#FFB020]" /> Loot List Ready
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-[#111827]">
              {t("yourGroceryList")}
            </h1>
          </div>
          <div className="bg-white border-[2.5px] border-[#111827] rounded-2xl px-3.5 py-2 shadow-[3px_3px_0_#111827] text-right shrink-0">
            <span className="block text-[10px] font-heading font-black uppercase tracking-wider text-[#111827]/70">
              {activeItemsList.length} {t("items") || "items"}
            </span>
            <span className="font-heading text-2xl font-black tabular-nums text-[#111827]">
              €{activeTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center bg-white text-[#111827] border-2 border-[#111827] rounded-full px-3 py-0.5 text-xs font-heading font-extrabold shadow-[1.5px_1.5px_0_#111827]">
            🥗 {dietLabel}
          </span>
          <span className="inline-flex items-center bg-[#FFB020] text-[#111827] border-2 border-[#111827] rounded-full px-3 py-0.5 text-xs font-heading font-extrabold shadow-[1.5px_1.5px_0_#111827]">
            📅 {days} {t("days")}
          </span>
          <span className="inline-flex items-center bg-[#7DD3FC] text-[#111827] border-2 border-[#111827] rounded-full px-3 py-0.5 text-xs font-heading font-extrabold shadow-[1.5px_1.5px_0_#111827]">
            👥 {people} {people === 1 ? t("person") : t("people")}
          </span>
        </div>

        {!readOnly && activeItemsList.length > 0 && (
          <div className="rounded-2xl bg-[#F3F8E6] border-2 border-[#111827] p-2.5 flex items-center gap-3 shadow-[2px_2px_0_#111827]">
            <span className="text-xs font-heading font-black uppercase tracking-wider text-[#111827] shrink-0">
              🛒 {boughtCount}/{activeItemsList.length}
            </span>
            <div className="h-3 flex-1 rounded-full bg-white border-2 border-[#111827] overflow-hidden">
              <div
                style={{ width: `${boughtCount > 0 ? Math.max(boughtPct, 6) : 0}%` }}
                className="h-full bg-[#FF3E7F] bba-progress-stripes rounded-full transition-all duration-300"
              />
            </div>
            <span className="text-xs font-heading font-black tabular-nums text-[#111827] shrink-0">
              {boughtPct}%
            </span>
          </div>
        )}
      </div>

      {/* Tabs if prep guide is enabled */}
      {prep && (
        <div className="flex items-center gap-2 bg-card border-[2.5px] border-[#111827] dark:border-[#78a71b] p-1.5 rounded-2xl shadow-[3px_3px_0_#111827] dark:shadow-[3px_3px_0_#000]">
          <button
            type="button"
            onClick={() => setActiveTab("grocery")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-heading font-black uppercase tracking-wide transition-all ${
              activeTab === "grocery"
                ? "bg-[#FFB020] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBasket className="h-4 w-4" />
            <span>{t("planGroceryTitle") || "Grocery List"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prep")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-heading font-black uppercase tracking-wide transition-all ${
              activeTab === "prep"
                ? "bg-[#C084FC] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>{t("planPrepTitle") || "Meal Prep Guide"}</span>
          </button>
        </div>
      )}

      {/* TAB 1: GROCERY LIST */}
      {activeTab === "grocery" && (
        <>
          {/* Free-tier grocery cap notice */}
          {planDays != null && Number(planDays) > Number(days) && (
            <FreeGroceryCapNotice planDays={planDays} />
          )}

          {/* Calorie mismatch warning vs daily intake target */}
          {calories ? (
            <GroceryCalorieWarning dailyTarget={calories} generatedKcal={activeKcal} days={days} />
          ) : null}

          {/* List intro notice */}
          <div className="bba-t bg-[#F3F8E6] text-[#111827] space-y-2">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#78a71b] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-[#111827]" />
              </div>
              <p className="text-sm font-semibold text-[#111827] leading-relaxed">
                {t("groceryListIntro", { diet: dietLabel, days, goal: t("balanced") })}
              </p>
            </div>
            <p className="text-xs font-medium text-[#111827]/75 flex items-start gap-1.5 pt-1 border-t border-[#111827]/15">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{t("priceEstimateNote")}</span>
            </p>
          </div>

          {/* Budget & Savings Summary Cards */}
          <div className="space-y-4">
            <div className="bba-t bg-[#FFB020] text-[#111827] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
                  <ShoppingBasket className="h-5 w-5 text-[#111827]" />
                </div>
                <span className="font-heading font-black text-base sm:text-lg text-[#111827]">
                  {t("estimatedTotalForDays", { days })}
                </span>
              </div>
              <span className="font-heading text-2xl sm:text-3xl font-black tabular-nums bg-white text-[#111827] border-[2.5px] border-[#111827] px-3.5 py-1 rounded-2xl shadow-[2px_2px_0_#111827]">
                €{activeTotal.toFixed(2)}
              </span>
            </div>

            {totalSaved > 0 && (
              <div className="bba-t bg-[#FF3E7F] text-white relative overflow-hidden">
                <div className="relative flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]">
                    <PiggyBank className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-heading font-black uppercase tracking-wider bg-[#111827] text-[#F3F8E6] px-2.5 py-0.5 rounded-full">
                      {t("savedVsRegular")}
                    </span>
                    <p className="font-heading text-3xl sm:text-4xl font-black leading-none mt-1.5 text-white tabular-nums">
                      €{totalSaved.toFixed(2)}
                    </p>
                    <p className="text-sm font-semibold text-white/95 mt-2 leading-relaxed">
                      {t("savedCelebration", { amount: `€${totalSaved.toFixed(2)}`, pct })}
                    </p>
                    {showProUpsell && (
                      <button
                        type="button"
                        onClick={() => openPricing?.()}
                        className="mt-3 flex w-full items-center gap-2.5 rounded-2xl bg-white text-[#111827] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] px-3.5 py-2.5 text-left hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
                      >
                        <span className="text-xs sm:text-sm font-heading font-bold text-[#111827] leading-snug">
                          {t("proUpsellSavings", { price: PRO_PRICE.toFixed(2), saved: `€${stillSaved.toFixed(2)}` })}
                        </span>
                        <span className="ml-auto shrink-0 rounded-full bg-[#78a71b] border-2 border-[#111827] px-3 py-1 text-xs font-heading font-black text-[#111827]">
                          {t("proUpsellCta")}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-center justify-center bg-[#FFB020] text-[#111827] border-[2.5px] border-[#111827] rounded-2xl px-3.5 py-2 shadow-[3px_3px_0_#111827] shrink-0">
                    <TrendingDown className="h-5 w-5" />
                    <span className="font-heading text-2xl font-black leading-none mt-0.5">-{pct}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export and Share Actions */}
          <div className="flex flex-wrap gap-2.5 justify-end">
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
          <GroceryGroupedList
            categories={groceries?.categories || []}
            activeItems={activeItemsList}
            removedItems={removedItems}
            sortByStore={sortByStore}
            setSortByStore={setSortByStore}
            translateCategory={trCat}
            stores={storesStr}
            boughtItems={boughtItems}
            onToggleBought={toggleBought}
            onSwap={(it, cat) => setGrocerySwapTarget({ item: it, category: cat })}
            onRemove={removeItem}
            readOnly={readOnly}
          />

          {/* Add item button */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#F3F8E6] hover:bg-[#78a71b] text-[#111827] border-[2.5px] border-dashed hover:border-solid border-[#111827] rounded-2xl text-sm font-heading font-black shadow-[3px_3px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              {t("addItemWithAI")}
            </button>
          )}

          {/* Active summary footer */}
          <div className="bba-t bg-[#78a71b] text-[#111827] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
                <ShoppingBasket className="h-5 w-5 text-[#111827]" />
              </div>
              <div>
                <p className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#111827]/75">
                  {t("estimatedTotalForDays", { days })}
                </p>
                <p className="font-heading text-2xl sm:text-3xl font-black text-[#111827] tabular-nums">
                  €{activeTotal.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className="inline-block text-xs font-heading font-black bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0_#111827]">
                {activeItemsList.length} {t("items") || "items"}
              </span>
              {totalSaved > 0 && (
                <p className="text-xs sm:text-sm font-heading font-black text-[#111827]">
                  {t("savingsAmount", { amount: totalSaved.toFixed(2) })}
                </p>
              )}
            </div>
          </div>

          {/* Regenerate button */}
          {!readOnly && (
            <div className="pt-1">
              <Button onClick={onReset} variant="outline" className="w-full h-12 gap-2">
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
          <div className="bba-t bg-[#C084FC] text-[#111827] space-y-1">
            <span className="bba-sticker">
              <ChefHat className="h-3.5 w-3.5" /> Kitchen Mode
            </span>
            <h3 className="font-heading text-xl font-black text-[#111827]">{t("planPrepTitle")}</h3>
            <p className="text-xs sm:text-sm font-medium text-[#111827]/85">{t("planPrepSubtitle")}</p>
          </div>

          <div className="space-y-3.5">
            <ExtendableList
              items={prep.days || []}
              limit={7}
              renderItem={(d, i) => {
              const meals = MEAL_SLOTS.map((s) => ({ ...s, data: d[s.key] })).filter(
                (s) => s.data && s.data.meal
              );
              if (!meals.length) return null;
              return (
                <div key={i} className="bba-t bg-card text-card-foreground p-0 overflow-hidden">
                  <div className="bg-[#F3F8E6] dark:bg-secondary border-b-[2.5px] border-[#111827] dark:border-[#78a71b] px-4 py-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center font-heading font-black text-xs uppercase tracking-wider bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-3 py-0.5 rounded-full shadow-[1.5px_1.5px_0_#111827]">
                      {t("day") || "Day"} {i + 1}
                    </span>
                  </div>
                  <div className="divide-y-2 divide-[#111827]/12 dark:divide-white/15">
                    {meals.map((s) => (
                      <div key={s.key} className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-heading font-extrabold text-foreground flex-1 min-w-0">
                            {s.data.meal}
                          </p>
                          <span className={`text-[10px] font-heading font-black uppercase tracking-wider text-[#111827] ${s.pillBg} border-[1.5px] border-[#111827] rounded-full px-2.5 py-0.5 shrink-0`}>
                            {t(s.labelKey)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRecipe(i, s.key, s.data.meal)}
                            className={`relative h-7 rounded-lg border-[1.5px] flex items-center justify-center transition-all shrink-0 ${
                              isPro
                                ? "w-7 bg-white dark:bg-secondary text-foreground border-[#111827] dark:border-[#78a71b] hover:bg-[#FF8FB5] hover:text-[#111827]"
                                : "px-2 gap-1 bba-locked-arcade text-[#F3F8E6]/80 border-[#111827] dark:border-[#FFB020]/70 hover:text-white shadow-[1.5px_1.5px_0_#FFB020]"
                            }`}
                            title={isPro ? t("recipe") || "Recipe" : t("recipePro") || "Unlock AI Recipe — Pro"}
                          >
                            <ChefHat className="h-3.5 w-3.5 shrink-0" />
                            {!isPro && (
                              <span className="inline-flex items-center gap-0.5 bg-[#FFB020] text-[#111827] rounded px-1 py-0.5 text-[8px] font-heading font-black leading-none">
                                <Lock className="h-2 w-2 stroke-[3]" /> PRO
                              </span>
                            )}
                          </button>
                        </div>
                        {s.data.portion && (
                          <p className="text-xs text-muted-foreground font-medium">
                            <span className="font-heading font-black text-foreground">{t("portionLabel")}:</span>{" "}
                            {s.data.portion}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed whitespace-pre-line">{s.data.prep}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
            />
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