import { useState, useEffect } from "react";
import BudgetForm from "../components/BudgetForm";
import { useLanguage } from "@/lib/LanguageContext";
import { Sparkles, TrendingDown, ShoppingCart, Salad, Trash2, Zap, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/PullToRefresh";

const FEATURES_KEYS = [
  { icon: TrendingDown, titleKey: "feature1Title", descKey: "feature1Desc" },
  { icon: Salad, titleKey: "feature2Title", descKey: "feature2Desc" },
  { icon: ShoppingCart, titleKey: "feature3Title", descKey: "feature3Desc" },
];

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
          <Sparkles className="h-4 w-4" />
          {t("aiPowered")}
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
          {t("heroTitle1")}<br />
          <span className="text-primary">{t("heroTitle2")}</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          {t("heroSubtitle")}
        </p>
      </div>

      {/* Free / No login banner */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
        <div className="text-2xl">🎉</div>
        <div className="flex-1">
          <p className="font-heading font-bold text-green-800 text-base">Completely free. No account needed.</p>
          <p className="text-green-700 text-sm mt-0.5">Just fill in your budget below and get a full meal plan + grocery list instantly — no sign-up, no credit card, ever.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center shrink-0">
          <span className="flex items-center gap-1.5 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            <Zap className="h-3.5 w-3.5" /> Free forever
          </span>
          <span className="flex items-center gap-1.5 bg-white border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
            <Lock className="h-3.5 w-3.5" /> No login
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES_KEYS.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.titleKey}
              className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-sm">{t(feature.titleKey)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Budget Form */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold">{t("planYourMeals")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("planSubtitle")}
          </p>
        </div>
        <BudgetForm />
      </div>

      {/* Tips */}
      <div className="bg-secondary/50 rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-3">{t("tipsTitle")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <p>{t("tip1")}</p>
          <p>{t("tip2")}</p>
          <p>{t("tip3")}</p>
          <p>{t("tip4")}</p>
        </div>
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
    </div>
    </PullToRefresh>
  );
}