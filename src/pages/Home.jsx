import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import ReceiptHero from "@/components/ReceiptHero";
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

  return (
    <div className="space-y-6">
      <ReceiptHero />

      <PlanModeChooser />

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
}