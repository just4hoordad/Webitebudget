import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import PlanModeChooser from "@/components/PlanModeChooser";
import HeroSection from "@/components/HeroSection";
import DashboardView from "@/components/home/DashboardView";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Wallet, Leaf, ShoppingBasket, ArrowRight } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_completed")
  );

  const closeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  if (isAuthenticated) {
    return (
      <div className="space-y-6">
        <DashboardView />
        <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeroSection />

      {/* Feature highlights */}
      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Wallet}
          title={t("feature1Title") || "Real German prices"}
          desc={t("feature1Desc") || "Compare prices across Aldi, Lidl, REWE, Edeka, Penny & Netto"}
        />
        <FeatureCard
          icon={Leaf}
          title={t("feature2Title") || "Personalized diets"}
          desc={t("feature2Desc") || "Meal plans tailored to your diet, budget, and preferences"}
        />
        <FeatureCard
          icon={ShoppingBasket}
          title={t("feature3Title") || "Smart shopping list"}
          desc={t("feature3Desc") || "Weekly shopping lists with the best store for each item"}
        />
      </section>

      <PlanModeChooser />

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-heading font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}