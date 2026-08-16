import { useState, useEffect } from "react";
import BudgetForm from "../components/BudgetForm";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/PullToRefresh";
import CreditPill from "@/components/monetization/CreditPill";
import { useMonetization } from "@/lib/MonetizationContext";

export default function Home() {
  const { t } = useLanguage();
  const { credits, isPro } = useMonetization();
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
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden h-72 sm:h-80 border border-border">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
            alt="Fresh groceries"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
          <div className="absolute top-4 right-4 z-10">
            <CreditPill credits={credits} isPro={isPro} />
          </div>
          <div className="absolute bottom-6 left-6 right-6 sm:max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <ShoppingCart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-white">
                Budget<span className="text-primary">Bite</span>
              </span>
            </div>
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