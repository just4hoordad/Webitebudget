import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Euro, Users, Leaf, Beef, Fish, Wheat } from "lucide-react";

const STORES = [
  { id: "aldi", name: "Aldi", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "lidl", name: "Lidl", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { id: "rewe", name: "REWE", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "edeka", name: "Edeka", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "penny", name: "Penny", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "netto", name: "Netto", color: "bg-gray-100 text-gray-700 border-gray-200" },
];

const DIETS = [
  { id: "balanced", name: "Balanced", icon: Users },
  { id: "vegetarian", name: "Vegetarian", icon: Leaf },
  { id: "vegan", name: "Vegan", icon: Leaf },
  { id: "high-protein", name: "High Protein", icon: Beef },
  { id: "pescatarian", name: "Pescatarian", icon: Fish },
  { id: "gluten-free", name: "Gluten Free", icon: Wheat },
];

export default function BudgetForm() {
  const navigate = useNavigate();
  const [budget, setBudget] = useState([150]);
  const [selectedStores, setSelectedStores] = useState(["aldi", "lidl"]);
  const [selectedDiet, setSelectedDiet] = useState("balanced");
  const [people, setPeople] = useState(1);

  const toggleStore = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((s) => s !== storeId)
        : [...prev, storeId]
    );
  };

  const handleGenerate = () => {
    const params = new URLSearchParams({
      budget: budget[0],
      stores: selectedStores.join(","),
      diet: selectedDiet,
      people: people,
    });
    navigate(`/meal-plan?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Budget Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Monthly Budget</label>
          <div className="flex items-center gap-1 bg-primary/10 text-primary font-heading font-bold text-xl px-4 py-1.5 rounded-xl">
            <Euro className="h-5 w-5" />
            {budget[0]}
          </div>
        </div>
        <Slider
          value={budget}
          onValueChange={setBudget}
          max={400}
          min={50}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>€50</span>
          <span>€150 avg. student</span>
          <span>€400</span>
        </div>
      </div>

      {/* People */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Number of People</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setPeople(n)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                people === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {n} {n === 1 ? "person" : "people"}
            </button>
          ))}
        </div>
      </div>

      {/* Store Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Preferred Stores</label>
        <div className="flex flex-wrap gap-2">
          {STORES.map((store) => (
            <button
              key={store.id}
              onClick={() => toggleStore(store.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                selectedStores.includes(store.id)
                  ? store.color + " border-current"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {store.name}
            </button>
          ))}
        </div>
      </div>

      {/* Diet Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Diet Preference</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETS.map((diet) => {
            const Icon = diet.icon;
            return (
              <button
                key={diet.id}
                onClick={() => setSelectedDiet(diet.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  selectedDiet === diet.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {diet.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={selectedStores.length === 0}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300"
        size="lg"
      >
        Generate My Meal Plan
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}