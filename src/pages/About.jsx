import { useLanguage } from "@/lib/LanguageContext";
import { Link } from "react-router-dom";
import { Leaf, Euro, ShoppingBasket, Users } from "lucide-react";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">About BudgetBite</h1>
        <p className="text-muted-foreground text-base leading-relaxed mb-4">
          BudgetBite is a smart, AI-powered meal planning app built specifically for students living in Germany. 
          We know how challenging it can be to eat well when you're juggling lectures, assignments, and a tight budget — 
          that's exactly why BudgetBite exists.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed mb-4">
          Our app generates personalized weekly and monthly meal plans based on real, up-to-date prices from Germany's 
          most popular supermarkets including Aldi, Lidl, REWE, Edeka, Penny, and Netto. Simply enter your monthly 
          budget, select your preferred stores, choose your dietary preferences — whether that's vegan, high-protein, 
          gluten-free, or halal — and BudgetBite will instantly produce a full grocery list optimized to keep you 
          within budget while hitting your calorie goals.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed mb-4">
          Beyond grocery lists, BudgetBite generates complete day-by-day meal plans — breakfasts, lunches, and dinners — 
          using only the ingredients you've bought. You can swap meals with AI suggestions, edit dishes, export your 
          plan as a PDF or CSV, and even track your nutritional breakdown with protein, fat, and carb charts.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed">
          BudgetBite is built and maintained by a small team passionate about making healthy eating accessible and 
          affordable for everyone. It is completely free to use — no account required, no credit card, ever.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Euro, title: "Real German Prices", desc: "Based on live supermarket data from Aldi, Lidl, REWE & more" },
          { icon: Leaf, title: "Any Diet", desc: "Vegan, vegetarian, halal, gluten-free, high-protein and more" },
          { icon: ShoppingBasket, title: "Smart Lists", desc: "Optimized grocery lists with per-item store recommendations" },
          { icon: Users, title: "Built for Students", desc: "Designed around a typical student lifestyle and budget in Germany" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-card border border-border rounded-xl p-4">
            <div className="bg-primary/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="font-heading font-semibold text-sm text-foreground mb-1">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">Ready to start eating well on a budget?</p>
        <Link to="/" className="inline-block bg-primary text-primary-foreground font-heading font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          Create My Meal Plan →
        </Link>
      </div>
    </div>
  );
}