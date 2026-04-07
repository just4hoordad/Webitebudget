import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, SlidersHorizontal, Loader2, ChefHat } from "lucide-react";
import RecipeCard from "../components/RecipeCard";
import RecipeModal from "../components/RecipeModal";

const DIET_FILTERS = ["all", "balanced", "vegetarian", "vegan", "high-protein", "halal", "gluten-free"];
const SORT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "calories", label: "Calories" },
  { id: "cost", label: "Cost" },
  { id: "prepTime", label: "Prep Time" },
];

const SAMPLE_RECIPES = [
  {
    id: 1, name: "Overnight Oats", diet: "vegan", description: "Creamy oats with fruits and seeds, prepared the night before.", prepTime: 5, calories: 380, cost: 0.90,
    tags: ["breakfast", "no-cook", "quick"],
    ingredients: ["80g rolled oats", "200ml oat milk", "1 banana", "1 tbsp chia seeds", "1 tbsp peanut butter", "Handful of berries"],
    instructions: ["Mix oats and oat milk in a jar.", "Stir in chia seeds and peanut butter.", "Refrigerate overnight.", "Top with banana slices and berries before serving."],
    nutrition: { protein: 14, carbs: 58, fat: 12, fiber: 8 },
  },
  {
    id: 2, name: "Lentil Soup", diet: "vegan", description: "Hearty red lentil soup with German spices and fresh bread.", prepTime: 25, calories: 420, cost: 1.20,
    tags: ["lunch", "high-fiber", "warm"],
    ingredients: ["200g red lentils", "1 onion", "2 garlic cloves", "1 carrot", "400ml vegetable broth", "1 tsp cumin", "Salt & pepper"],
    instructions: ["Sauté onion and garlic in olive oil.", "Add diced carrot and cook 3 min.", "Add lentils and broth, bring to boil.", "Simmer 20 min until lentils are soft.", "Season with cumin, salt and pepper."],
    nutrition: { protein: 22, carbs: 64, fat: 4, fiber: 16 },
  },
  {
    id: 3, name: "Egg & Potato Hash", diet: "vegetarian", description: "Pan-fried potatoes with eggs, peppers and herbs.", prepTime: 20, calories: 490, cost: 1.10,
    tags: ["breakfast", "filling", "easy"],
    ingredients: ["3 medium potatoes", "2 eggs", "1 bell pepper", "1 onion", "Olive oil", "Paprika", "Salt"],
    instructions: ["Dice potatoes and boil 10 min.", "Fry onions and pepper in oil.", "Add potatoes, fry until golden.", "Make wells, crack eggs in, cover and cook 3 min.", "Season with paprika and salt."],
    nutrition: { protein: 18, carbs: 55, fat: 16, fiber: 6 },
  },
  {
    id: 4, name: "Chicken & Rice Bowl", diet: "high-protein", description: "Juicy grilled chicken breast over brown rice with steamed veggies.", prepTime: 30, calories: 580, cost: 2.50,
    tags: ["lunch", "meal-prep", "protein"],
    ingredients: ["200g chicken breast", "150g brown rice", "Broccoli", "2 garlic cloves", "Soy sauce", "Olive oil"],
    instructions: ["Cook brown rice per package instructions.", "Season chicken with garlic, oil and soy sauce.", "Grill chicken 6-7 min per side.", "Steam broccoli 5 min.", "Slice chicken and serve over rice and veggies."],
    nutrition: { protein: 48, carbs: 62, fat: 10, fiber: 5 },
  },
  {
    id: 5, name: "Pasta Primavera", diet: "vegetarian", description: "Classic Italian pasta with seasonal vegetables and parmesan.", prepTime: 20, calories: 520, cost: 1.40,
    tags: ["dinner", "italian", "quick"],
    ingredients: ["200g pasta", "1 zucchini", "Cherry tomatoes", "1 onion", "Garlic", "Parmesan", "Olive oil", "Basil"],
    instructions: ["Cook pasta al dente.", "Sauté onion and garlic.", "Add zucchini and tomatoes, cook 5 min.", "Toss with pasta and olive oil.", "Top with parmesan and fresh basil."],
    nutrition: { protein: 18, carbs: 78, fat: 12, fiber: 7 },
  },
  {
    id: 6, name: "Halal Beef Stir Fry", diet: "halal", description: "Tender halal beef strips with vegetables in savory sauce over rice.", prepTime: 25, calories: 610, cost: 3.20,
    tags: ["dinner", "halal", "asian"],
    ingredients: ["250g halal beef strips", "200g jasmine rice", "Bell peppers", "Snap peas", "Soy sauce", "Ginger", "Garlic"],
    instructions: ["Cook jasmine rice.", "Marinate beef in soy sauce and ginger.", "Stir-fry beef on high heat 4 min.", "Add vegetables, cook 3 min.", "Serve over rice with extra sauce."],
    nutrition: { protein: 42, carbs: 60, fat: 16, fiber: 4 },
  },
  {
    id: 7, name: "Gluten-Free Buddha Bowl", diet: "gluten-free", description: "Colorful bowl with quinoa, roasted veggies, and tahini dressing.", prepTime: 35, calories: 460, cost: 2.80,
    tags: ["lunch", "gluten-free", "colorful"],
    ingredients: ["150g quinoa", "Sweet potato", "Chickpeas", "Spinach", "Tahini", "Lemon juice", "Olive oil"],
    instructions: ["Cook quinoa per package.", "Roast sweet potato and chickpeas at 200°C for 25 min.", "Mix tahini, lemon and water for dressing.", "Assemble bowl with all ingredients.", "Drizzle with dressing."],
    nutrition: { protein: 20, carbs: 68, fat: 14, fiber: 12 },
  },
  {
    id: 8, name: "Quark Pancakes", diet: "vegetarian", description: "Fluffy German-style quark pancakes — high protein and budget-friendly.", prepTime: 15, calories: 340, cost: 0.80,
    tags: ["breakfast", "german", "sweet"],
    ingredients: ["250g Quark", "2 eggs", "4 tbsp flour", "1 tbsp sugar", "Pinch of salt", "Butter for frying"],
    instructions: ["Mix quark, eggs, flour, sugar and salt.", "Heat butter in a pan on medium heat.", "Spoon batter into small pancakes.", "Fry 3 min per side until golden.", "Serve with jam or fresh fruit."],
    nutrition: { protein: 26, carbs: 34, fat: 10, fiber: 2 },
  },
];

export default function Recipes() {
  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [maxCost, setMaxCost] = useState(5);

  const allRecipes = [...SAMPLE_RECIPES, ...aiRecipes];

  const filtered = allRecipes
    .filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchesDiet = dietFilter === "all" || r.diet === dietFilter;
      const matchesCost = r.cost <= maxCost;
      return matchesSearch && matchesDiet && matchesCost;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (a[sortBy] || 0) - (b[sortBy] || 0);
    });

  const loadMoreWithAI = async () => {
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate 4 diverse budget-friendly recipes for students in Germany. Diet types to cover: vegetarian, vegan, high-protein, halal. Focus on cheap German supermarket ingredients. Return ONLY valid JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          recipes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                diet: { type: "string" },
                description: { type: "string" },
                prepTime: { type: "number" },
                calories: { type: "number" },
                cost: { type: "number" },
                tags: { type: "array", items: { type: "string" } },
                ingredients: { type: "array", items: { type: "string" } },
                instructions: { type: "array", items: { type: "string" } },
                nutrition: { type: "object" },
              },
            },
          },
        },
      },
    });
    const newRecipes = (result.recipes || []).map((r, i) => ({ ...r, id: 1000 + i }));
    setAiRecipes((prev) => [...prev, ...newRecipes]);
    setAiLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">Recipe Database</h1>
        <p className="text-muted-foreground">Browse budget-friendly recipes for students in Germany.</p>
      </div>

      {/* Search & filter bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search recipes, tags, ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Diet</label>
            <div className="flex flex-wrap gap-2">
              {DIET_FILTERS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDietFilter(d)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                    dietFilter === d ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort by</label>
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    sortBy === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/40"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max cost per serving: €{maxCost.toFixed(2)}</label>
            <input
              type="range" min={0.5} max={5} step={0.5} value={maxCost}
              onChange={(e) => setMaxCost(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">{filtered.length} recipe{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
        ))}
      </div>

      {/* Load more with AI */}
      <div className="flex justify-center pt-2">
        <button
          onClick={loadMoreWithAI}
          disabled={aiLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-sm font-medium hover:border-primary/40 transition-colors disabled:opacity-60"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4 text-primary" />}
          {aiLoading ? "Loading more recipes..." : "Load more AI recipes"}
        </button>
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}