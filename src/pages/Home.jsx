import { useState, useEffect } from "react";
import BudgetForm from "../components/BudgetForm";
import { useLanguage } from "@/lib/LanguageContext";
import { Link } from "react-router-dom";
import { Sparkles, TrendingDown, ShoppingCart, Salad, Trash2, Zap, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import PullToRefresh from "@/components/PullToRefresh";

const FEATURES_KEYS = [
  { icon: TrendingDown, titleKey: "feature1Title", descKey: "feature1Desc", accent: "border-l-primary", iconWrap: "bg-primary/10 text-primary" },
  { icon: Salad, titleKey: "feature2Title", descKey: "feature2Desc", accent: "border-l-accent", iconWrap: "bg-accent/15 text-accent" },
  { icon: ShoppingCart, titleKey: "feature3Title", descKey: "feature3Desc", accent: "border-l-sky-500", iconWrap: "bg-sky-100 text-sky-600" },
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
      {/* Hero — full-bleed dark */}
      <div className="-mx-4 -mt-6 px-6 sm:px-10 pt-16 pb-16 bg-dark text-dark-foreground relative overflow-hidden">
        {/* Decorative grocery atmosphere */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] select-none">
          <span className="absolute top-6 left-4 text-6xl">🥬</span>
          <span className="absolute top-14 right-8 text-5xl">🥕</span>
          <span className="absolute bottom-10 left-12 text-5xl">🍞</span>
          <span className="absolute bottom-3 right-6 text-7xl">🛒</span>
          <span className="absolute top-1/2 left-1/3 text-4xl">🥑</span>
          <span className="absolute top-1/3 right-1/4 text-4xl">🧅</span>
        </div>
        {/* Soft radial glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative text-center space-y-5 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
            <Sparkles className="h-4 w-4" />
            {t("aiPowered")}
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] text-balance">
            {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
          </h1>
          <p className="text-dark-muted text-lg max-w-lg mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Free / No login banner */}
      <div className="bg-card border border-border border-l-4 border-l-primary rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
        <div className="text-2xl">🎉</div>
        <div className="flex-1">
          <p className="font-heading font-bold text-foreground text-base">{t("freeBannerTitle")}</p>
          <p className="text-muted-foreground text-sm mt-0.5">{t("freeBannerDesc")}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center shrink-0">
          <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="h-3.5 w-3.5" /> {t("freeBannerBadge1")}
          </span>
          <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5" /> {t("freeBannerBadge2")}
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
              className={`bg-card border border-border border-l-4 ${feature.accent} rounded-2xl p-5 space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${feature.iconWrap}`}>
                <Icon className="h-5 w-5" />
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
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold">{t("planYourMeals")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("planSubtitle")}
          </p>
        </div>
        <BudgetForm />
      </div>

      {/* Tips */}
      <div className="bg-card border border-border rounded-2xl p-6">
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
      {/* Footer */}
      <div className="text-center pb-4">
        <Link to="/datenschutz" className="text-xs text-muted-foreground hover:text-primary underline transition-colors">
          Datenschutzerklärung
        </Link>
      </div>
    </div>
    </PullToRefresh>
  );
}