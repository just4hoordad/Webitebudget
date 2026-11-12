import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Package, BarChart3, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import PantryUsageAlerts from "@/components/PantryUsageAlerts";
import PantryManager from "@/components/PantryManager";

// Keyword-based categorizer (en + de + a little fr/es) since pantry items
// are stored without a category. Falls back to "Other".
const CATEGORY_RULES = [
  { name: "Oils & Vinegars", keywords: ["oil", "olive", "vinegar", "essig", "öl", "olivenöl", "huile", "aceite"] },
  { name: "Spices & Seasonings", keywords: ["salt", "pepper", "sugar", "spice", "paprika", "herb", "cinnamon", "cumin", "turmeric", "salz", "pfeffer", "zucker", "gewürz", "sel", "poivre", "sucre", "sal", "pimienta", "azúcar"] },
  { name: "Grains & Pasta", keywords: ["rice", "pasta", "flour", "noodle", "bread", "oat", "quinoa", "couscous", "barley", "reis", "nudel", "mehl", "brot", "hafer", "riz", "farine", "pâtes", "arroz", "harina", "pan"] },
  { name: "Canned & Jarred", keywords: ["canned", "tin", "beans", "chickpea", "lentil", "jar", "tomato", "dose", "konserve", "bohne", "kichererbse", "linse", "conserve", "tomate", "lata", "frijol"] },
  { name: "Dairy & Eggs", keywords: ["milk", "cheese", "butter", "yogurt", "egg", "cream", "milch", "käse", "joghurt", "ei", "sahne", "lait", "fromage", "beurre", "oeuf", "leche", "queso", "huevo"] },
  { name: "Sauces & Condiments", keywords: ["sauce", "soy", "ketchup", "mustard", "mayo", "dressing", "paste", "soße", "sojasoße", "senf", "soya", "mostaza", "mayonesa"] },
  { name: "Produce", keywords: ["garlic", "onion", "potato", "carrot", "vegetable", "fruit", "apple", "lemon", "knoblauch", "zwiebel", "kartoffel", "karotte", "gemüse", "obst", "apfel", "ail", "oignon", "ajo", "cebolla", "patata", "verdura", "fruta"] },
  { name: "Beverages", keywords: ["water", "juice", "tea", "coffee", "wasser", "saft", "tee", "kaffee", "eau", "jus", "thé", "café", "agua", "jugo"] },
];

const COLORS = ["#78a71b", "#7DD3FC", "#FF3E7F", "#FFB020", "#C084FC", "#FF8FB5", "#34d399", "#60a5fa", "#94a3b8"];

function categorize(name) {
  const n = (name || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.name;
  }
  return "Other";
}

// Map the internal English category names used by CATEGORY_RULES to their
// translation keys, so the chart axis and cards render in the active language.
const CATEGORY_KEY = {
  "Oils & Vinegars": "cat_oils",
  "Spices & Seasonings": "cat_spices",
  "Grains & Pasta": "cat_grains",
  "Canned & Jarred": "cat_canned",
  "Dairy & Eggs": "cat_dairy",
  "Sauces & Condiments": "cat_sauces",
  "Produce": "cat_produce",
  "Beverages": "cat_beverages",
  "Other": "cat_other",
};

export default function PantryDashboard() {
  const { t } = useLanguage();
  const translateCategory = (name) => t(CATEGORY_KEY[name] || "cat_other");
  const itemCount = (n) => (n === 1 ? t("itemSingular") : t("itemPlural"));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (authed) {
          const data = await base44.entities.PantryItem.list();
          setItems(data);
        } else {
          setItems(JSON.parse(localStorage.getItem("pantry_items") || "[]"));
        }
      } catch {
        setItems(JSON.parse(localStorage.getItem("pantry_items") || "[]"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) { setPlans([]); return; }
        const data = await base44.entities.MealPlan.list();
        setPlans(data);
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  const usageCounts = useMemo(() => {
    const counts = {};
    items.forEach((it) => { counts[(it.name || "").toLowerCase().trim()] = 0; });
    plans.forEach((plan) => {
      const names = new Set();
      plan.groceryList?.categories?.forEach((cat) =>
        cat.items?.forEach((i) => {
          const n = (i.name || "").toLowerCase().trim();
          if (n) names.add(n);
        })
      );
      names.forEach((n) => { if (n in counts) counts[n]++; });
    });
    return counts;
  }, [items, plans]);

  const updateThreshold = async (item, value) => {
    const minUsage = Math.max(0, parseInt(value, 10) || 0);
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, minUsage } : it)));
    try {
      const authed = await base44.auth.isAuthenticated();
      if (authed && item.id && !String(item.id).includes("Date")) {
        await base44.entities.PantryItem.update(item.id, { minUsage });
      } else {
        const stored = JSON.parse(localStorage.getItem("pantry_items") || "[]");
        const next = stored.map((it) => (it.id === item.id ? { ...it, minUsage } : it));
        localStorage.setItem("pantry_items", JSON.stringify(next));
      }
    } catch {
      // silent
    }
  };

  const byCategory = {};
  items.forEach((item) => {
    const cat = item.category || categorize(item.name);
    (byCategory[cat] = byCategory[cat] || []).push(item);
  });

  const chartData = Object.keys(byCategory)
    .map((name) => ({ name, count: byCategory[name].length, items: byCategory[name] }))
    .sort((a, b) => b.count - a.count);

  const total = items.length;
  const topCat = chartData[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bba-t bg-[#FFB020] text-[#111827] space-y-1.5">
        <span className="bba-sticker">
          <Package className="h-3.5 w-3.5" /> Pantry Stash
        </span>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#111827]">
          {t("pantryDashboard") || "Pantry Dashboard"}
        </h1>
        <p className="text-sm font-medium text-[#111827]/85">
          {t("pantryDashboardDesc") || "What you rely on most, grouped by category"}
        </p>
      </div>

      <div className="bba-t bg-card p-4">
        <PantryManager onPantryChange={(list) => { setItems(list); setLoading(false); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="bba-t bg-card p-8 text-center text-muted-foreground">
          {t("pantryEmptyDashboard") ||
            "Your pantry is empty. Add staples from the home page to see your breakdown."}
        </div>
      ) : (
        <>
          <PantryUsageAlerts
            items={items}
            usageCounts={usageCounts}
            onUpdateThreshold={updateThreshold}
            loadingPlans={loadingPlans}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bba-t bg-[#78a71b] text-[#111827] p-4">
              <p className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/75">{t("totalItems") || "Total items"}</p>
              <p className="font-heading text-3xl font-black text-[#111827] mt-1">{total}</p>
            </div>
            <div className="bba-t bg-[#7DD3FC] text-[#111827] p-4">
              <p className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/75">{t("categories") || "Categories"}</p>
              <p className="font-heading text-3xl font-black text-[#111827] mt-1">{chartData.length}</p>
            </div>
            <div className="bba-t bg-[#FF8FB5] text-[#111827] p-4 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/75">{t("topCategory") || "Top category"}</p>
              <p className="font-heading text-xl font-black text-[#111827] truncate mt-1">{topCat ? translateCategory(topCat.name) : ""}</p>
            </div>
          </div>

          <div className="bba-t bg-card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-xl bg-[#78a71b] border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] flex items-center justify-center text-[#111827]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h3 className="font-heading font-black text-sm uppercase tracking-wider text-foreground">
                {t("itemsPerCategory") || "Items per category"}
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 38 + 10, 120)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tickFormatter={(name) => translateCategory(name)}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontFamily: "var(--font-heading)", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#111827" strokeWidth={1.5} />
                  ))}
                </Bar>
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-popover border-2 border-[#111827] shadow-[2px_2px_0_#111827] rounded-xl px-3 py-2 text-xs">
                        <p className="font-heading font-black text-foreground">{translateCategory(p.name)}</p>
                        <p className="font-medium text-muted-foreground">
                          {p.count} {itemCount(p.count)}
                        </p>
                      </div>
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {chartData.map((cat, i) => (
              <div key={cat.name} className="bba-t bg-card p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-4 w-4 rounded-md border-[1.5px] border-[#111827] shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-heading font-black text-sm text-foreground truncate">{translateCategory(cat.name)}</span>
                    {i === 0 && (
                      <span className="text-[10px] uppercase font-heading font-black text-[#111827] bg-[#FFB020] border border-[#111827] px-2 py-0.5 rounded-full shrink-0">
                        {t("top") || "Top"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-heading font-bold shrink-0 ml-2">
                    {cat.count} {itemCount(cat.count)} · {Math.round((cat.count / total) * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((it) => (
                    <span
                      key={it.id}
                      className="bg-[#F3F8E6] dark:bg-secondary text-[#111827] dark:text-foreground border-[1.5px] border-[#111827] dark:border-[#78a71b] text-xs font-heading font-bold px-2.5 py-1 rounded-full"
                    >
                      {it.name}
                      {it.amount && it.amount !== "some" ? ` (${it.amount})` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}