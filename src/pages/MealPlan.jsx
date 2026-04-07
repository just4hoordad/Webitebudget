import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShoppingBasket, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MealPlan() {
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") || 150;
  const stores = params.get("stores") || "aldi,lidl";
  const diet = params.get("diet") || "balanced";
  const people = params.get("people") || 1;
  const calories = params.get("calories") || 2000;

  const [groceries, setGroceries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removedItems, setRemovedItems] = useState(new Set());

  useEffect(() => {
    generateGroceries();
  }, []);

  const generateGroceries = async () => {
    setRemovedItems(new Set());
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a list of groceries for a ${diet} diet for ${people} person(s) in Germany with a monthly budget of €${budget}.
The target is ~${calories} kcal/day per person. Preferred stores: ${stores}.
Return realistic German supermarket products with approximate prices in euros.
Group items by category (e.g. Proteins, Vegetables, Grains, Dairy, Snacks).
Keep prices realistic for German discount supermarkets like Aldi/Lidl/Rewe.
Make sure the total cost fits within the €${budget} monthly budget.`,
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
                      price: { type: "number" },
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
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Your Grocery List</h1>
          <p className="text-sm text-muted-foreground">
            {diet} diet · €{budget}/month · {calories} kcal/day · {people} person(s)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Generating your personalized grocery list...</p>
        </div>
      ) : (
        <>
          {/* Budget Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5 text-primary" />
              <span className="font-heading font-semibold text-foreground">Estimated Total</span>
            </div>
            <span className="font-heading text-2xl font-bold text-primary">
              €{groceries?.total_estimated_cost?.toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
            </span>
          </div>

          {/* Categories */}
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
                        <p className="font-semibold text-foreground">€{item.price?.toFixed(2)}</p>
                        {item.store && <p className="text-xs text-muted-foreground">{item.store}</p>}
                      </div>
                      <button
                        onClick={() => removeItem(category.name, item.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pb-8">
            <Button onClick={generateGroceries} variant="outline" className="w-full">
              Regenerate List
            </Button>
          </div>
        </>
      )}
    </div>
  );
}