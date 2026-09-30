import { useState } from "react";
import BudgetForm from "../components/BudgetForm";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/PullToRefresh";
import CreditBar from "@/components/monetization/CreditBar";
import AdSlot from "@/components/ads/AdSlot";
import PlanModeChooser from "@/components/PlanModeChooser";

export default function Home() {
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_completed")
  );

  const closeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const handleRefresh = async () => {};

  const scrollToForm = () => {
    document.getElementById("plan-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Hero Banner — shorter on mobile so the planner peeks into view */}
        <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 border border-border">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
            alt="Fresh groceries"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
          <div className="absolute bottom-6 left-5 right-5 sm:left-6 sm:right-6 sm:max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-6 overflow-hidden">
            {/* Credit header — inline on the glass card */}
            <CreditBar variant="onGlass" className="mb-3" />
            <div className="border-t border-white/15 mb-4" />
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
              {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
            </h1>
            <p className="text-sm text-white/80 mt-2">{t("planSubtitle")}</p>
            <Button
              onClick={scrollToForm}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-semibold"
            >
              {t("planYourMeals")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <PlanModeChooser onBudget={scrollToForm} />

        {/* Budget Form */}
        <div id="plan-form">
          <BudgetForm />
        </div>

        {/* Display ad — below the planner so it doesn't interrupt the plan flow */}
        <AdSlot layout="fixed-height" style={{ minHeight: 90 }} />

        <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
      </div>
    </PullToRefresh>
  );
}