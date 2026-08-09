import { useState, useEffect } from "react";
import BudgetForm from "../components/BudgetForm";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/PullToRefresh";

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_completed")
  );

  const closeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
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

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-12">
      {/* Compact header */}
      <div className="pt-2 pb-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
          {t("planSubtitle")}
        </p>
      </div>

      {/* Budget Form */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold">{t("planYourMeals")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("planSubtitle")}
          </p>
        </div>
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
      {/* Footer */}
      <div className="text-center pb-4">
        <Link to="/datenschutz" className="text-xs text-muted-foreground hover:text-primary underline transition-colors">
          Datenschutzerklärung
        </Link>
      </div>

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
    </PullToRefresh>
  );
}