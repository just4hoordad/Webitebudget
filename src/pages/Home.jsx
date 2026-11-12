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
    <div className="space-y-10">
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
    <div className="group bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 bb-shadow hover:bb-shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-heading font-bold text-foreground text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}