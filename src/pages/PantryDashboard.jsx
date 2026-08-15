import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Package, BarChart3, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import PantryUsageAlerts from "@/components/PantryUsageAlerts";

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

const COLORS = ["#d4f880", "#38bdf8", "#fb7185", "#fbbf24", "#a78bfa", "#34d399", "#f472b6", "#60a5fa", "#94a3b8"];

function categorize(name) {
  const n = (name || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.name;
  }
  return "Other";
}

export default function PantryDashboard() {
  const { t } = useLanguage();
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
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          {t("pantryDashboard") || "Pantry Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("pantryDashboardDesc") || "What you rely on most, grouped by category"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
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
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs uppercase text-muted-foreground">{t("totalItems") || "Total items"}</p>
              <p className="font-heading text-2xl font-bold">{total}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs uppercase text-muted-foreground">{t("categories") || "Categories"}</p>
              <p className="font-heading text-2xl font-bold">{chartData.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
              <p className="text-xs uppercase text-muted-foreground">{t("topCategory") || "Top category"}</p>
              <p className="font-heading text-lg font-bold truncate">{topCat?.name}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
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
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-muted-foreground">
                          {p.count} {p.count === 1 ? "item" : "items"}
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
              <div key={cat.name} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="font-heading font-semibold text-sm text-foreground truncate">{cat.name}</span>
                    {i === 0 && (
                      <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                        {t("top") || "Top"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium shrink-0 ml-2">
                    {cat.count} {cat.count === 1 ? "item" : "items"} · {Math.round((cat.count / total) * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((it) => (
                    <span
                      key={it.id}
                      className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full"
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