import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckSquare, Square, Loader2, Euro, ShoppingCart } from "lucide-react";

export default function SuggestedGroceries() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groceries, setGroceries] = useState([]);
  const [checked, setChecked] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const budget = urlParams.get("budget") || "150";
  const stores = urlParams.get("stores") || "aldi,lidl";
  const diet = urlParams.get("diet") || "balanced";
  const people = urlParams.get("people") || "1";
  const calories = urlParams.get("calories") || "2000";

  const weeklyBudget = (parseFloat(budget) / 4.33).toFixed(0);
  const storeList = stores.split(",").join(", ");

  useEffect(() => {
    const fetchGroceries = async () => {
      setLoading(true);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a grocery expert for students in Germany.
Suggest a weekly grocery list for a ${diet} diet for ${people} person(s) with a weekly budget of €${weeklyBudget}.
Only suggest items available at: ${storeList}.
Target ~${calories} kcal/day.
Return 15-25 practical grocery items.`,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  price: { type: "number" },
                  store: { type: "string" },
                  category: { type: "string" },
                },
              },
            },
          },
        },
        model: "gemini_3_flash",
      });
      const items = result?.items || [];
      setGroceries(items);
      // Select all by default
      const allChecked = {};
      items.forEach((_, i) => { allChecked[i] = true; });
      setChecked(allChecked);
      setLoading(false);
    };
    fetchGroceries();
  }, []);

  const toggleItem = (index) => setChecked((prev) => ({ ...prev, [index]: !prev[index] }));

  const selectedItems = groceries.filter((_, i) => checked[i]);
  const totalCost = selectedItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleGenerate = () => {
    const ingredientNames = selectedItems.map((item) => item.name).join(",");
    const params = new URLSearchParams({
      budget,
      stores,
      diet,
      people,
      calories,
      ingredients: ingredientNames,
    });
    navigate(`/meal-plan?${params.toString()}`);
  };

  // Group by category
  const grouped = groceries.reduce((acc, item, i) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ ...item, index: i });
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="font-heading font-semibold text-lg">Building your grocery list...</h2>
          <p className="text-sm text-muted-foreground mt-1">Finding best items at {storeList}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold">Your Grocery List</h1>
            <p className="text-sm text-muted-foreground">
              {diet} diet • €{budget}/month • {people} person(s)
            </p>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{selectedItems.length} of {groceries.length} items selected</span>
        </div>
        <div className="flex items-center gap-1 font-heading font-bold text-primary">
          <Euro className="h-4 w-4" />
          {totalCost.toFixed(2)}
        </div>
      </div>

      {/* Select all / deselect all */}
      <div className="flex gap-2">
        <button
          onClick={() => { const all = {}; groceries.forEach((_, i) => { all[i] = true; }); setChecked(all); }}
          className="text-xs text-primary hover:underline"
        >
          Select all
        </button>
        <span className="text-xs text-muted-foreground">·</span>
        <button
          onClick={() => setChecked({})}
          className="text-xs text-muted-foreground hover:underline"
        >
          Deselect all
        </button>
      </div>

      {/* Items grouped by category */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-secondary/40 border-b border-border">
              <span className="font-heading font-semibold text-sm">{category}</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <button
                  key={item.index}
                  onClick={() => toggleItem(item.index)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/30 ${
                    !checked[item.index] ? "opacity-50" : ""
                  }`}
                >
                  {checked[item.index]
                    ? <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                    : <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{item.store}</span>
                    <span className="text-sm font-semibold flex items-center gap-0.5">
                      <Euro className="h-3 w-3 text-muted-foreground" />
                      {item.price?.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleGenerate}
            disabled={selectedItems.length === 0}
            className="w-full h-14 text-base font-heading font-semibold rounded-xl"
            size="lg"
          >
            Generate My Diet Plan ({selectedItems.length} items)
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}