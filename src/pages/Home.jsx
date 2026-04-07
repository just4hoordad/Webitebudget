import BudgetForm from "../components/BudgetForm";
import { Sparkles, TrendingDown, ShoppingCart, Salad } from "lucide-react";

const FEATURES = [
  {
    icon: TrendingDown,
    title: "Real German Prices",
    description: "Compare prices across Aldi, Lidl, REWE, Edeka, Penny & Netto",
  },
  {
    icon: Salad,
    title: "Personalized Diets",
    description: "Get meal plans tailored to your diet, budget, and preferences",
  },
  {
    icon: ShoppingCart,
    title: "Smart Shopping List",
    description: "Weekly shopping lists with the best store for each item",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
          <Sparkles className="h-4 w-4" />
          AI-Powered Meal Planning
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
          Eat well on a<br />
          <span className="text-primary">student budget</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          Smart meal plans based on real German grocery store prices. Save money, eat healthy, stress less.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Budget Form */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold">Plan your meals</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set your budget and preferences to get a personalized weekly meal plan.
          </p>
        </div>
        <BudgetForm />
      </div>

      {/* Tips */}
      <div className="bg-secondary/50 rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-3">💡 Student Budget Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <p>• Shop at Aldi & Lidl for the lowest base prices</p>
          <p>• Buy seasonal produce for better nutrition per euro</p>
          <p>• Cook in batches — meal prep saves time and money</p>
          <p>• Check store flyers weekly for special offers</p>
        </div>
      </div>
    </div>
  );
}