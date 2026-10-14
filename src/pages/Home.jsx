import { useState } from "react";
import { Link } from "react-router-dom";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";
import CreditBar from "@/components/monetization/CreditBar";
import LastResultButton from "@/components/LastResultButton";
import { ArrowRight, Wallet } from "lucide-react";

export default function Home() {
  const { t, currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);
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

      {/* Single guided flow — one entry point instead of a mode chooser */}
      <Link
        to="/budget"
        className="block rounded-3xl border border-border bg-card p-6 hover:border-primary transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-lg font-bold text-foreground">{m.budgetTitle}</h2>
            <p className="text-sm text-muted-foreground">{m.budgetDesc}</p>
          </div>
          <span className="inline-flex items-center gap-2 font-heading font-semibold text-sm bg-primary text-primary-foreground rounded-full px-4 py-2.5 shrink-0 group-hover:gap-3 transition-all">
            {m.budgetCta} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      <LastResultButton kind="budget" />

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
}