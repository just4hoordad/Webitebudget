import { useState, useEffect } from "react";
import BudgetForm from "../components/BudgetForm";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingCart, Salad, Carrot, Fish, Croissant, Apple, Egg } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/PullToRefresh";
import CreditBar from "@/components/monetization/CreditBar";

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_completed")
  );

  const closeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setDeleting(true);
    if (typeof base44.auth.deleteAccount === "function") {
      await base44.auth.deleteAccount();
    } else {
      alert("Account deletion is not available yet. Please contact support.");
    }
    setDeleting(false);
  };

  const handleRefresh = async () => {
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
  };

  const scrollToForm = () => {
    document.getElementById("plan-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Credit summary — standalone row above the hero */}
        <CreditBar />

        {/* Hero Banner */}
        <section className="relative rounded-3xl overflow-hidden border border-border bg-gradient-to-br from-card via-card to-primary/5">
          <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <div className="absolute bottom-0 -left-24 h-56 w-56 rounded-full bg-chart-2/10 blur-3xl hidden sm:block" aria-hidden />
          <div className="relative grid sm:grid-cols-[1.15fr_1fr] gap-6 p-6 sm:p-8">
            {/* Copy */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                  <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-lg tracking-tight text-foreground">
                  Budget<span className="text-primary">Bite</span>
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold leading-[1.08] text-foreground text-balance">
                {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md leading-relaxed">
                {t("planSubtitle")}
              </p>
              <Button
                onClick={scrollToForm}
                className="mt-5 w-fit font-heading font-semibold"
              >
                {t("planYourMeals")} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            {/* Food icon cluster — minimalist line-art tiles */}
            <div className="hidden sm:grid grid-cols-3 gap-3 content-center">
              {[Salad, Carrot, Fish, Croissant, Apple, Egg].map((Icon, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center aspect-square rounded-2xl border border-border bg-card/80 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Icon className="h-7 w-7 text-primary" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Budget Form */}
        <div id="plan-form">
          <BudgetForm />
        </div>

        {/* Account */}
        {user && (
          <div className="border border-destructive/20 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm text-foreground">{user.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 select-none gap-2"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        )}

        {!user && authChecked && (
          <div className="border border-border rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">{t("loginToSave") || "Log in to save plans and sync your pantry"}</p>
              <p className="text-xs text-muted-foreground">{t("loginSubtitle") || "Optional — you can still plan without an account."}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/login">
                <Button variant="outline" size="sm">{t("login") || "Log in"}</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">{t("signUp") || "Sign up"}</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pb-4">
          <Link to="/datenschutz" className="text-xs text-muted-foreground hover:text-primary underline transition-colors">
            {t("privacyNav")}
          </Link>
        </div>

        <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
      </div>
    </PullToRefresh>
  );
}