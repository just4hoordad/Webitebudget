import { useState, useEffect, useRef } from "react";
import { X, ChefHat, Clock, Users, ListOrdered, Loader2, Snowflake, AlertCircle, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/aiClient";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "sonner";

// On-demand cooking recipe for a single meal. Pro-only — the parent only
// renders this for Pro users; free users get the Pro upsell instead.
// Generated recipes are reported back via onCache so the parent persists
// them with the meal plan (no re-generation on re-open).

// Self-contained strings (these keys aren't in the shared translations file,
// so a local dictionary keeps every supported language covered).
const RECIPE_L = {
  en: { recipe: "Recipe", recipeGenerating: "Generating your recipe…", readyToHeat: "Ready-to-heat product", reheatNote: "This is a frozen ready-to-heat meal — just follow the heating instructions on the packaging.", prepTime: "Prep", cookTime: "Cook", servings: "Serves", ingredients: "Ingredients", steps: "Steps", recipeIncomplete: "The recipe came back incomplete — try regenerating.", close: "Close", recipeError: "Couldn't generate the recipe. Try again.", saveToLibrary: "Save to library", saved: "Saved to your recipes", saveFailed: "Could not save recipe" },
  de: { recipe: "Rezept", recipeGenerating: "Rezept wird erstellt…", readyToHeat: "Fertigprodukt zum Erwärmen", reheatNote: "Dies ist eine gefrostete fertige Mahlzeit — einfach die Erwärmanleitung auf der Verpackung befolgen.", prepTime: "Vorbereitung", cookTime: "Kochen", servings: "Portionen", ingredients: "Zutaten", steps: "Schritte", recipeIncomplete: "Das Rezept wurde unvollständig zurückgegeben — bitte neu generieren.", close: "Schließen", recipeError: "Rezept konnte nicht erstellt werden. Bitte erneut versuchen.", saveToLibrary: "In Bibliothek speichern", saved: "In deinen Rezepten gespeichert", saveFailed: "Rezept konnte nicht gespeichert werden" },
  fr: { recipe: "Recette", recipeGenerating: "Génération de la recette…", readyToHeat: "Produit à réchauffer", reheatNote: "C'est un plat surgelé prêt à réchauffer — suivez les instructions sur l'emballage.", prepTime: "Préparation", cookTime: "Cuisson", servings: "Portions", ingredients: "Ingrédients", steps: "Étapes", recipeIncomplete: "La recette est incomplète — essayez de régénérer.", close: "Fermer", recipeError: "Impossible de générer la recette. Réessayez." },
  es: { recipe: "Receta", recipeGenerating: "Generando tu receta…", readyToHeat: "Producto listo para calentar", reheatNote: "Es una comida congelada lista para calentar — sigue las instrucciones del envase.", prepTime: "Preparación", cookTime: "Cocción", servings: "Porciones", ingredients: "Ingredientes", steps: "Pasos", recipeIncomplete: "La receta quedó incompleta — intenta regenerar.", close: "Cerrar", recipeError: "No se pudo generar la receta. Intenta de nuevo." },
  ar: { recipe: "وصفة", recipeGenerating: "جارٍ إنشاء الوصفة…", readyToHeat: "منتج جاهز للتسخين", reheatNote: "هذه وجبة مجمدة جاهزة للتسخين — اتبع تعليمات التسخين على العبوة.", prepTime: "تحضير", cookTime: "طبخ", servings: "حصص", ingredients: "مكونات", steps: "خطوات", recipeIncomplete: "عادت الوصفة غير مكتملة — حاول إعادة الإنشاء.", close: "إغلاق", recipeError: "تعذر إنشاء الوصفة. حاول مرة أخرى." },
  ru: { recipe: "Рецепт", recipeGenerating: "Генерация рецепта…", readyToHeat: "Продукт для разогрева", reheatNote: "Это замороженное готовое блюдо — следуйте инструкции на упаковке.", prepTime: "Подготовка", cookTime: "Готовка", servings: "Порции", ingredients: "Ингредиенты", steps: "Шаги", recipeIncomplete: "Рецепт вернулся неполным — попробуйте снова.", close: "Закрыть", recipeError: "Не удалось создать рецепт. Попробуйте снова." },
  uk: { recipe: "Рецепт", recipeGenerating: "Генерація рецепта…", readyToHeat: "Продукт для розігріву", reheatNote: "Це заморожена готова страва — дотримуйтесь інструкції на упаковці.", prepTime: "Підготовка", cookTime: "Готування", servings: "Порції", ingredients: "Інгредієнти", steps: "Кроки", recipeIncomplete: "Рецепт повернувся неповним — спробуйте знову.", close: "Закрити", recipeError: "Не вдалося створити рецепт. Спробуйте ще раз." },
  fa: { recipe: "دستور پخت", recipeGenerating: "در حال تولید دستور پخت…", readyToHeat: "محصول آماده گرم کردن", reheatNote: "این یک غذای منجرد آماده گرم کردن است — دستورالعمل روی بسته‌بندی را دنبال کنید.", prepTime: "آماده‌سازی", cookTime: "پخت", servings: "وعده‌ها", ingredients: "مواد اولیه", steps: "مراحل", recipeIncomplete: "دستور پخت ناقص برگشت — دوباره تولید کنید.", close: "بستن", recipeError: "تولید دستور پخت ناموفق بود. دوباره امتحان کنید." },
  zh: { recipe: "食谱", recipeGenerating: "正在生成食谱…", readyToHeat: "即热产品", reheatNote: "这是一份冷冻即热餐 — 按照包装上的加热说明操作即可。", prepTime: "准备", cookTime: "烹饪", servings: "份数", ingredients: "食材", steps: "步骤", recipeIncomplete: "食谱不完整 — 请重新生成。", close: "关闭", recipeError: "无法生成食谱，请重试。" },
  vi: { recipe: "Công thức", recipeGenerating: "Đang tạo công thức…", readyToHeat: "Sản phẩm hâm nóng", reheatNote: "Đây là bữa ăn đông lạnh sẵn sàng hâm nóng — làm theo hướng dẫn trên bao bì.", prepTime: "Chuẩn bị", cookTime: "Nấu", servings: "Phần ăn", ingredients: "Nguyên liệu", steps: "Bước", recipeIncomplete: "Công thức không đầy đủ — hãy tạo lại.", close: "Đóng", recipeError: "Không thể tạo công thức. Thử lại." },
  tr: { recipe: "Tarif", recipeGenerating: "Tarif oluşturuluyor…", readyToHeat: "Isıtmaya hazır ürün", reheatNote: "Bu hazır ısıtılacak dondurulmuş bir öğündür — ambalajdaki talimatları izleyin.", prepTime: "Hazırlık", cookTime: "Pişirme", servings: "Porsiyon", ingredients: "Malzemeler", steps: "Adımlar", recipeIncomplete: "Tarif eksik geldi — yeniden oluşturmayı deneyin.", close: "Kapat", recipeError: "Tarif oluşturulamadı. Tekrar deneyin." },
};

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    prep_time: { type: "number", description: "prep time in minutes" },
    cook_time: { type: "number", description: "cook time in minutes" },
    servings: { type: "number" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, quantity: { type: "string" } },
      },
    },
    steps: { type: "array", items: { type: "string" } },
  },
};

export default function RecipeModal({ meal, diet, people, initialRecipe, onCache, onClose }) {
  const { currentLanguage } = useLanguage();
  const tr = (key) => (RECIPE_L[currentLanguage.code] || RECIPE_L.en)[key] || RECIPE_L.en[key];
  const [recipe, setRecipe] = useState(
    initialRecipe && initialRecipe.mealName === meal.name ? initialRecipe.recipe : null
  );
  const [loading, setLoading] = useState(!recipe);
  const reported = useRef(false);
  const [savingLib, setSavingLib] = useState(false);
  const [savedLib, setSavedLib] = useState(false);
  const isFrozen = diet === "frozen";

  const persistRecipe = async (rec, { showError = false } = {}) => {
    if (!rec) return;
    setSavingLib(true);
    try {
      await base44.entities.Recipe.create({
        title: rec.title || meal.name,
        mealType: meal.mealType || "dinner",
        diet: diet || "custom",
        servings: rec.servings || people || 1,
        prepTime: rec.prep_time || 0,
        cookTime: rec.cook_time || 0,
        ingredients: Array.isArray(rec.ingredients) ? rec.ingredients : [],
        steps: Array.isArray(rec.steps) ? rec.steps : [],
        source: "from_plan",
      });
      setSavedLib(true);
      toast.success(tr("saved"));
    } catch (e) {
      if (showError) toast.error(tr("saveFailed"));
    } finally {
      setSavingLib(false);
    }
  };

  const saveToLibrary = () => persistRecipe(recipe, { showError: true });

  const ingredientList = Array.isArray(meal.ingredients)
    ? meal.ingredients.map((i) => `${i.name}${i.quantity ? ` (${i.quantity})` : ""}`).join(", ")
    : "";

  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Write a cooking recipe for "${meal.name}" in ${currentLanguage.label}.
Available ingredients: ${ingredientList || "not specified"}. Diet: ${diet}. Serves: ${people || 1}.
Return: title, prep_time (min), cook_time (min), servings, ingredients[{name, quantity}], steps[] (concise, ordered). Use the planned ingredients; add salt/oil/pepper only if essential. No calorie count.`;

      const result = await invokeAI({
        prompt,
        response_json_schema: RECIPE_SCHEMA,
      });
      setRecipe(result);
      setLoading(false);
      if (!reported.current) {
        reported.current = true;
        onCache({ mealName: meal.name, recipe: result });
        persistRecipe(result);
      }
    } catch (e) {
      setLoading(false);
      toast.error(tr("recipeError"));
      onClose();
    }
  };

  useEffect(() => {
    if (isFrozen) return; // frozen meals show a reheat note, no LLM call
    if (!recipe) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mealTypeLabel =
    meal.mealType === "breakfast" ? "🌅" : meal.mealType === "lunch" ? "☀️" : "🌙";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative bg-card text-card-foreground border-[3px] border-[#111827] dark:border-[#78a71b] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg flex flex-col shadow-[6px_6px_0_#111827] dark:shadow-[6px_6px_0_#000] overflow-hidden"
        style={{ maxHeight: "82vh" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#FF8FB5] text-[#111827] border-b-[3px] border-[#111827] px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="bba-sticker mb-1">
              <ChefHat className="h-3.5 w-3.5" /> {mealTypeLabel} {tr("recipe")}
            </span>
            <h2 className="font-heading font-black text-lg text-[#111827] mt-0.5 line-clamp-2">{meal.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827] shrink-0 mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {isFrozen ? (
            <div className="flex flex-col items-center text-center py-8 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-[#7DD3FC] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center">
                <Snowflake className="h-7 w-7 text-[#111827]" />
              </div>
              <p className="font-heading font-black text-foreground">{tr("readyToHeat")}</p>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed font-medium">
                {tr("reheatNote")}
              </p>
              {meal.name && (
                <p className="text-sm font-heading font-bold text-[#111827] bg-[#F3F8E6] border-2 border-[#111827] rounded-xl px-3.5 py-2">{meal.name}</p>
              )}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-heading font-bold text-muted-foreground">{tr("recipeGenerating")}</p>
            </div>
          ) : recipe ? (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2.5">
                <Stat icon={Clock} label={tr("prepTime")} value={recipe.prep_time != null ? `${recipe.prep_time} min` : "—"} bg="bg-[#FFB020]" />
                <Stat icon={Clock} label={tr("cookTime")} value={recipe.cook_time != null ? `${recipe.cook_time} min` : "—"} bg="bg-[#78a71b]" />
                <Stat icon={Users} label={tr("servings")} value={recipe.servings || people || 1} bg="bg-[#7DD3FC]" />
              </div>

              {/* Ingredients */}
              {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
                <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-4">
                  <h3 className="font-heading font-black text-sm text-[#111827] dark:text-foreground mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <ListOrdered className="h-4 w-4" /> {tr("ingredients")}
                  </h3>
                  <ul className="space-y-1.5">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex justify-between gap-3 text-sm border-b border-[#111827]/15 dark:border-white/15 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-semibold text-[#111827] dark:text-foreground">{ing.name}</span>
                        <span className="font-heading font-black text-xs bg-white text-[#111827] border border-[#111827] px-2 py-0.5 rounded-full shrink-0">{ing.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps */}
              {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
                <div>
                  <h3 className="font-heading font-black text-sm uppercase tracking-wide text-foreground mb-2.5">{tr("steps")}</h3>
                  <ol className="space-y-2.5">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="h-6 w-6 rounded-full bg-[#FFB020] text-[#111827] border-2 border-[#111827] text-xs font-heading font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground font-medium pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {(!Array.isArray(recipe.steps) || recipe.steps.length === 0) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl p-3 border-2 border-[#111827]/15">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{tr("recipeIncomplete")}</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="bg-card border-t-2 border-[#111827]/15 dark:border-white/15 px-5 py-4 pb-6 flex items-center gap-3 shrink-0">
          {!isFrozen && recipe && (
            <button
              type="button"
              onClick={saveToLibrary}
              disabled={savingLib || savedLib}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-heading font-black bg-[#78a71b] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
            >
              {savingLib ? <Loader2 className="h-4 w-4 animate-spin" /> : savedLib ? <Bookmark className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
              {savedLib ? tr("saved") : tr("saveToLibrary")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm font-heading font-extrabold text-[#111827] bg-white border-2 border-[#111827] rounded-full py-2.5 shadow-[2px_2px_0_#111827] hover:bg-[#F3F8E6] transition-colors"
          >
            {tr("close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, bg = "bg-[#F3F8E6]" }) {
  return (
    <div className={`${bg} text-[#111827] border-2 border-[#111827] rounded-2xl px-2.5 py-2.5 text-center shadow-[2px_2px_0_#111827]`}>
      <Icon className="h-4 w-4 text-[#111827] mx-auto mb-1" />
      <p className="text-[10px] font-heading font-black uppercase tracking-wider text-[#111827]/75">{label}</p>
      <p className="text-sm font-heading font-black text-[#111827] leading-none mt-0.5">{value}</p>
    </div>
  );
}