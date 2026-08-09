import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Leaf, Beef, Fish, Wheat, Scale, Microwave, ArrowRight, ArrowLeft,
  Users, CalendarDays, Sparkles, ShoppingCart, RefreshCw, Euro, Store,
} from "lucide-react";

const DIET_KEYS = [
  { id: "balanced", nameKey: "balanced", icon: Scale, descKey: "balancedDesc", blurb: "A bit of everything — meat, grains, veg, dairy." },
  { id: "vegetarian", nameKey: "vegetarian", icon: Leaf, descKey: "vegetarianDesc", blurb: "No meat or fish. Eggs & dairy are fine." },
  { id: "vegan", nameKey: "vegan", icon: Leaf, descKey: "veganDesc", blurb: "100% plant-based — no animal products at all." },
  { id: "high-protein", nameKey: "highProtein", icon: Beef, descKey: "highProteinDesc", blurb: "Protein-forward: meat, eggs, skyr, lentils." },
  { id: "pescatarian", nameKey: "pescatarian", icon: Fish, descKey: "pescatarianDesc", blurb: "Fish & plants, no other meat." },
  { id: "gluten-free", nameKey: "glutenFree", icon: Wheat, descKey: "glutenFreeDesc", blurb: "No wheat, barley or rye." },
  { id: "halal", nameKey: "halal", icon: null, descKey: "halalDesc", blurb: "Certified halal — no pork or alcohol." },
  { id: "frozen", nameKey: "frozenFoods", icon: Microwave, descKey: "frozenFoodsDesc", blurb: "Ready-to-heat frozen convenience foods." },
];

const STORES = ["Aldi", "Lidl", "REWE", "Edeka", "Penny", "Netto"];

export default function DietGrocery() {
  const { t } = useLanguage();
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [people, setPeople] = useState(1);
  const [days, setDays] = useState(7);
  const [selectedStores, setSelectedStores] = useState(["Aldi", "Lidl"]);

  const [loading, setLoading] = useState(false);
  const [groceryList, setGroceryList] = useState(null);
  const [error, setError] = useState(null);

  const toggleStore = (s) =>
    setSelectedStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const generate = async () => {
    if (!selectedDiet) return;
    setLoading(true);
    setError(null);
    setGroceryList(null);
    try {
      const dietName = t(DIET_KEYS.find((d) => d.id === selectedDiet).nameKey);
      const prompt = `You are a German grocery shopping expert. Generate a complete grocery list for one person eating a ${dietName} diet for ${days} day(s), scaled to ${people} person(s).
Rules:
- Use REAL product names sold in German supermarkets: ${STORES.join(", ")}. Prefer the cheapest reasonable store for each item.
- Every item must be compatible with a ${dietName} diet. ${selectedDiet === "frozen" ? "ONLY include frozen, ready-to-heat products." : ""}
- Give realistic package sizes and German euro prices for each item.
- Group items into sensible categories.
- The total should be budget-friendly for a student.

Return JSON with this exact shape:
{
  "categories": [
    {
      "category": "Category name",
      "items": [
        { "name": "Product name", "amount": "e.g. 500g", "price": 1.99, "store": "Aldi", "regular_price": 2.49 }
      ]
    }
  ],
  "estimated_total": 45.20,
  "diet": "${selectedDiet}"
}`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        amount: { type: "string" },
                        price: { type: "number" },
                        store: { type: "string" },
                        regular_price: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
            estimated_total: { type: "number" },
            diet: { type: "string" },
          },
        },
      });

      setGroceryList(res);
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGroceryList(null);
    setError(null);
    setSelectedDiet(null);
  };

  /* ---------- Result view ---------- */
  if (groceryList) {
    const total = groceryList.estimated_total || 0;
    return (
      <div className="space-y-5">
        <button onClick={reset} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("back")}
        </button>

        <div className="rounded-2xl bg-dark p-6 text-dark-foreground">
          <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
            <Sparkles className="h-4 w-4" /> {t("dietGroceryResultTitle") || "Your grocery list"}
          </div>
          <h1 className="font-heading font-bold text-2xl">
            {t(DIET_KEYS.find((d) => d.id === (groceryList.diet || selectedDiet)).nameKey)} · {days} {t("days")}
          </h1>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-heading font-bold text-3xl text-primary">€{total.toFixed(2)}</span>
            <span className="text-sm text-dark-muted">/ {people} {people === 1 ? t("person") : t("people")}</span>
          </div>
        </div>

        <div className="space-y-4">
          {groceryList.categories?.map((cat) => (
            <div key={cat.category} className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/40">
                <h3 className="font-heading font-semibold text-sm">{cat.category}</h3>
              </div>
              <div className="divide-y divide-border">
                {cat.items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{item.amount}</span>
                        <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {item.store}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-sm">€{(item.price || 0).toFixed(2)}</p>
                      {item.regular_price && item.regular_price > item.price && (
                        <p className="text-xs text-muted-foreground line-through">€{item.regular_price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={reset} variant="outline" className="w-full h-12 rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> {t("regenerate") || "Regenerate"}
        </Button>
      </div>
    );
  }

  /* ---------- Selection + generation view ---------- */
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <ShoppingCart className="h-4 w-4" /> {t("dietGroceryBadge") || "Diet-first grocery lists"}
        </div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-balance">
          {t("dietGroceryTitle") || "Pick a diet. Get a grocery list."}
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 text-balance">
          {t("dietGrocerySubtitle") || "Choose how you want to eat, and we'll build a complete shopping list tailored to that diet."}
        </p>
      </div>

      {/* Diet grid */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" /> {t("dietPreference")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DIET_KEYS.map((diet) => {
            const Icon = diet.icon;
            const isSelected = selectedDiet === diet.id;
            return (
              <button
                key={diet.id}
                onClick={() => setSelectedDiet(diet.id)}
                className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl text-left transition-all duration-200 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary-foreground/15" : "bg-primary/10"}`}>
                  {diet.id === "halal" ? (
                    <span className="text-xl font-bold leading-none">حلال</span>
                  ) : Icon ? (
                    <Icon className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                  ) : null}
                </div>
                <span className={`font-heading font-semibold text-sm leading-tight ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                  {t(diet.nameKey)}
                </span>
                <span className={`text-xs leading-snug ${isSelected ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                  {diet.blurb}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options — appear after diet is picked */}
      {selectedDiet && (
        <div className="space-y-6 border border-border rounded-2xl p-5 bg-card">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">{t("dietGroceryOptions") || "Tune your list"}</span>
          </div>

          {/* People */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> {t("numberOfPeople")}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setPeople(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    people === n ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {n} {n === 1 ? t("person") : t("people")}
                </button>
              ))}
            </div>
          </div>

          {/* Days */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> {t("durationDays") || "Duration"} ({t("days")})
            </label>
            <div className="flex items-center gap-4">
              <Slider value={[days]} onValueChange={([v]) => setDays(v)} min={1} max={30} step={1} className="flex-1" />
              <span className="font-heading font-bold text-lg w-16 text-right">{days} {t("days")}</span>
            </div>
          </div>

          {/* Stores */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Store className="h-4 w-4" /> {t("preferredStores")}
            </label>
            <div className="flex flex-wrap gap-2">
              {STORES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStore(s)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedStores.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <Button
        onClick={generate}
        disabled={!selectedDiet || loading || selectedStores.length === 0}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
        size="lg"
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            {t("generatingGroceries")}
          </>
        ) : (
          <>
            {t("generateGroceryList") || "Generate my grocery list"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
}