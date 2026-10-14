import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import PlanModeChooser from "@/components/PlanModeChooser";
import { useLanguage } from "@/lib/LanguageContext";
import CreditBar from "@/components/monetization/CreditBar";

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
      <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 border border-border">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
          alt="Fresh groceries"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        <div className="absolute bottom-6 left-5 right-5 sm:left-6 sm:right-6 sm:max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-6 overflow-hidden">
          <CreditBar variant="onGlass" className="mb-3" />
          <div className="border-t border-white/15 mb-4" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
            {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
          </h1>
          <p className="text-sm text-white/80 mt-2">{t("planSubtitle")}</p>
        </div>
      </div>

      <PlanModeChooser />

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
}