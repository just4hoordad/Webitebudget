import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, Wallet, CalendarDays, Users, Flame, Leaf,
  MapPin, Scale, AlertTriangle, Sparkles, ShoppingBasket, ChefHat, Check, Tag,
} from "lucide-react";

const DIET_NAME = {
  balanced: "balanced", vegetarian: "vegetarian", vegan: "vegan",
  "high-protein": "highProtein", pescatarian: "pescatarian",
  "gluten-free": "glutenFree", halal: "halal", frozen: "frozenFoods",
  "half-cooked": "halfCooked",
};
const GOAL_NAME = { lose: "loseWeight", maintain: "maintain", gain: "gainWeight", muscle: "buildMuscle" };

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground leading-snug break-words">{value}</p>
      </div>
    </div>
  );
}

function CheckRow({ children }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
        <Check className="h-3 w-3 text-primary-foreground" />
      </div>
      <p className="text-sm text-foreground leading-snug">{children}</p>
    </div>
  );
}

export default function PlanReview() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);

  const budget = parseFloat(params.get("budget") || "150");
  const days = parseInt(params.get("days") || "30", 10);
  const people = parseInt(params.get("people") || "1", 10);
  const calories = parseInt(params.get("calories") || "2000", 10);
  const goal = params.get("goal") || "maintain";
  const diet = params.get("diet") || "balanced";
  const stores = params.get("stores") ? params.get("stores").split(",").map(s => s.trim()).filter(Boolean) : [];
  const macrosParam = params.get("macros");
  const macros = macrosParam ? macrosParam.split(",").map(Number) : null;
  const bio = params.get("bio") === "true";
  const allergies = params.get("allergies") ? params.get("allergies").split(",").filter(Boolean) : [];
  const saleHunt = params.get("saleHunt") === "true";
  const junkPercent = parseInt(params.get("junkPercent") || "0", 10);
  const proteinSnackBudget = parseInt(params.get("proteinSnackBudget") || "0", 10);
  const owned = params.get("owned") ? params.get("owned").split(",").filter(Boolean) : [];

  const dietLabel = t(DIET_NAME[diet] || "balanced");
  const goalLabel = t(GOAL_NAME[goal] || "maintain");
  const meals = days * 3;
  const search = window.location.search;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors -ml-1"
      >
        <ArrowLeft className="h-4 w-4" /> {t("reviewBack") || "Back to edit"}
      </button>

      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("reviewTitle") || "Confirm your plan"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("reviewSubtitle") || "Here's exactly what we'll create for you."}</p>
      </div>

      {/* Hero — what you'll get */}
      <div className="rounded-3xl bg-primary text-primary-foreground p-6 shadow-lg shadow-primary/20 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider opacity-80 mb-2">
            <ShoppingBasket className="h-4 w-4" /> {t("reviewYouWillGet") || "What you'll get"}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-4xl font-extrabold leading-none">€{budget.toFixed(0)}</span>
            <span className="text-sm opacity-80">/ {days} {t("days") || "days"} · {people} {people === 1 ? t("person") : t("people")}</span>
          </div>
          <div className="mt-4 space-y-0.5 divide-primary-foreground/20">
            <CheckRow>
              <span className="font-medium">{days}</span> {t("days") || "days"} · <span className="font-medium">{meals}</span> {t("reviewMeals") || "meals"} (3 / {t("day") || "day"})
            </CheckRow>
            <CheckRow>
              {t("planGroceryTitle") || "Grocery list"} · {stores.length} {stores.length === 1 ? (t("store") || "store") : (t("stores") || "stores")}
            </CheckRow>
            <CheckRow>
              {t("reviewWillGetBudget") || "Tailored to"} ~{calories} kcal/{t("day") || "day"} · €{budget} {t("yourBudget") || "budget"}
            </CheckRow>
            <CheckRow>
              {t("reviewWillGetReady") || "Ready to cook, save & share"}
            </CheckRow>
          </div>
        </div>
      </div>

      {/* Selections */}
      <div className="bg-card border border-border rounded-2xl px-5 py-1">
        <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground pt-3 pb-1">
          {t("reviewYouSelected") || "Your selections"}
        </h2>
        <Row icon={Wallet} label={t("monthlyBudget") || "Budget"} value={`€${budget.toFixed(2)} · ${goalLabel}`} />
        <Row icon={CalendarDays} label={t("durationDays") || "Duration"} value={`${days} ${t("days") || "days"}`} />
        <Row icon={Users} label={t("numberOfPeople") || "People"} value={`${people}`} />
        <Row icon={Flame} label={t("calorieGoal") || "Calories"} value={`~${calories} kcal/${t("day") || "day"}`} />
        <Row icon={Leaf} label={t("dietPreference") || "Diet"} value={`${dietLabel}${bio ? " · Bio" : ""}`} />
        {macros && <Row icon={Scale} label={t("macrosTitle") || "Macros"} value={`P ${macros[0]}% · C ${macros[1]}% · F ${macros[2]}%`} />}
        {stores.length > 0 && <Row icon={MapPin} label={t("preferredStores") || "Stores"} value={stores.join(", ")} />}
        {allergies.length > 0 && <Row icon={AlertTriangle} label={t("allergiesTitle") || "Allergies"} value={allergies.join(", ")} />}
        {(saleHunt || junkPercent > 0 || proteinSnackBudget > 0) && (
          <Row
            icon={Sparkles}
            label={t("lifestyleSection") || "Lifestyle"}
            value={[
              saleHunt && t("saleHunt"),
              junkPercent > 0 && `${junkPercent}% junk`,
              proteinSnackBudget > 0 && `€${proteinSnackBudget} protein`,
            ].filter(Boolean).join(" · ")}
          />
        )}
        {owned.length > 0 && (
          <Row icon={Tag} label={t("pantrySection") || "Pantry"} value={`${owned.length} ${t("items") || "items"} ${t("ownedAtHome") || "already at home"}`} />
        )}
      </div>

      <Button
        onClick={() => navigate(`/meal-plan${search}`)}
        className="w-full h-14 text-base font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
        size="lg"
      >
        {t("reviewConfirm") || "Confirm & generate"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}