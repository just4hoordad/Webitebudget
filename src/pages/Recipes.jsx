import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ChefHat, Clock, Users, Trash2, Edit2, Sparkles, X, Filter, ArrowUpDown, Utensils, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/RecipeCard";
import RecipeEditor from "@/components/RecipeEditor";
import CookModeView from "@/components/CookModeView";
import RECIPE_L from "@/lib/translations_recipes";

const DIET_OPTIONS = [
  { value: "", labelKey: "allDiets" },
  { value: "balanced", labelKey: "balanced" },
  { value: "vegetarian", labelKey: "vegetarian" },
  { value: "vegan", labelKey: "vegan" },
  { value: "high-protein", labelKey: "highProtein" },
  { value: "pescatarian", labelKey: "pescatarian" },
  { value: "gluten-free", labelKey: "glutenFree" },
  { value: "halal", labelKey: "halal" },
  { value: "frozen", labelKey: "frozen" },
  { value: "custom", labelKey: "custom" },
];

const TYPE_OPTIONS = [
  { value: "", labelKey: "allTypes" },
  { value: "breakfast", labelKey: "breakfast" },
  { value: "lunch", labelKey: "lunch" },
  { value: "dinner", labelKey: "dinner" },
  { value: "snack", labelKey: "snack" },
];

const SORT_OPTIONS = [
  { value: "newest", labelKey: "newest" },
  { value: "alpha", labelKey: "alphabetical" },
  { value: "quick", labelKey: "quickRecipes" },
];

export default function Recipes() {
  const { t, currentLanguage } = useLanguage();
  const L = (k) => (RECIPE_L[currentLanguage.code] || RECIPE_L.en)[k] || (RECIPE_L.en)[k];

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [cookTarget, setCookTarget] = useState(null);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const query = {};
      if (search.trim()) {
        const rx = { $regex: search.trim(), $options: "i" };
        query.$or = [{ title: rx }, { "ingredients.name": rx }, { steps: rx }];
      }
      if (dietFilter) query.diet = dietFilter;
      if (typeFilter) query.mealType = typeFilter;
      const opts = { sort: sortBy === "newest" ? "-created_date" : sortBy === "alpha" ? "title" : "-created_date", limit: 100 };
      const page = await base44.entities.Recipe.filter(query, opts);
      let items = page.items || [];
      if (sortBy === "quick") {
        items = items.filter(r => (r.prepTime || 0) + (r.cookTime || 0) <= 30 && (r.prepTime || 0) + (r.cookTime || 0) > 0);
      }
      setRecipes(items);
    } catch (e) {
      console.error("Failed to load recipes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecipes(); }, [search, dietFilter, typeFilter, sortBy]);

  const handleSave = async (data) => {
    try {
      if (editingRecipe?.id) {
        await base44.entities.Recipe.update(editingRecipe.id, data);
        toast.success(L("recipeUpdated"));
      } else {
        await base44.entities.Recipe.create(data);
        toast.success(L("recipeSaved"));
      }
      setShowEditor(false);
      setEditingRecipe(null);
      loadRecipes();
    } catch (e) {
      toast.error(e?.message || "Failed to save recipe");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(L("deleteConfirm"))) return;
    try {
      await base44.entities.Recipe.delete(id);
      setRecipes(prev => prev.filter(r => r.id !== id));
      toast.success(L("recipeDeleted"));
    } catch (e) {
      toast.error("Failed to delete recipe");
    }
  };

  const handleRemix = (recipe) => {
    setEditingRecipe({
      ...recipe,
      id: null,
      title: `${recipe.title} ${L("remixed")}`,
      source: "remix",
    });
    setShowEditor(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary" />
            </span>
            {L("recipesTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{L("recipesSubtitle")}</p>
        </div>
        <Button onClick={() => { setEditingRecipe(null); setShowEditor(true); }} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{L("addRecipe")}</span>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L("searchRecipes")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={dietFilter}
            onChange={(e) => setDietFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {DIET_OPTIONS.map(o => <option key={o.value} value={o.value}>{L(o.labelKey)}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{L(o.labelKey)}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ml-auto"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{L(o.labelKey)}</option>)}
          </select>
        </div>
      </div>

      {/* Recipe list */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">{L("recipesTitle")}…</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-4 bb-shadow">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">{search || dietFilter || typeFilter ? L("libraryEmpty") : L("noRecipes")}</p>
          {!search && !dietFilter && !typeFilter && (
            <Button onClick={() => { setEditingRecipe(null); setShowEditor(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              {L("createFirst")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={() => { setEditingRecipe(recipe); setShowEditor(true); }}
              onRemix={() => handleRemix(recipe)}
              onDelete={() => handleDelete(recipe.id)}
              onCook={() => setCookTarget(recipe)}
              L={L}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {showEditor && (
          <RecipeEditor
            recipe={editingRecipe}
            onSave={handleSave}
            onClose={() => { setShowEditor(false); setEditingRecipe(null); }}
            L={L}
          />
        )}
      </AnimatePresence>

      {/* Cook mode */}
      <AnimatePresence>
        {cookTarget && (
          <CookModeView
            recipe={cookTarget}
            onClose={() => setCookTarget(null)}
            L={L}
          />
        )}
      </AnimatePresence>
    </div>
  );
}