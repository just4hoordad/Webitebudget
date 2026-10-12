import { useState } from "react";
import { Link } from "react-router-dom";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import CreditBar from "@/components/monetization/CreditBar";
import PlanModeChooser from "@/components/PlanModeChooser";
import ActivePlanCard from "@/components/home/ActivePlanCard";
import { ArrowRight, Sparkles, MapPin, Wallet, BookMarked, Store } from "lucide-react";

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
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary/8 via-card to-secondary/40">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative px-6 pt-8 pb-7 sm:px-8 sm:pt-10">
          {/* Credit bar — sits neatly at top */}
          <div className="mb-5">
            <CreditBar variant="onGlass" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-primary">
              {t("heroBadge") || "Free · No signup needed"}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground leading-[1.1] tracking-tight max-w-xl">
            {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md leading-relaxed">
            {t("planSubtitle")}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <Link
              to="/budget"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-heading font-semibold shadow-md shadow-primary/25 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              {t("heroCta") || "Start planning"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/plan-builder"
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border text-foreground px-5 py-3 text-sm font-heading font-semibold transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
            >
              {t("heroCta2") || "Browse meals"}
            </Link>
          </div>
        </div>
      </section>

      {/* Active plan — returning users only */}
      <ActivePlanCard />

      {/* Plan mode chooser — existing */}
      <PlanModeChooser />

      {/* Quick access */}
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold">{t("quickAccess") || "Quick access"}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickCard to="/saved-plans" icon={BookMarked} label={t("savedPlans")} />
          <QuickCard to="/pantry" icon={Store} label={t("pantrySection") || "Pantry"} />
          <QuickCard to="/nutrition" icon={Wallet} label={t("nutritionNav") || "Nutrition"} />
          <QuickCard to="/about" icon={MapPin} label={t("aboutNav")} />
        </div>
      </section>

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
}

function QuickCard({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-heading font-semibold text-foreground text-center leading-tight">{label}</span>
    </Link>
  );
}