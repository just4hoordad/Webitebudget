import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import CreditBar from "@/components/monetization/CreditBar";
import UpgradeBanner from "@/components/monetization/UpgradeBanner";
import ProBadge from "@/components/monetization/ProBadge";
import SupportUsButton from "@/components/monetization/SupportUsButton";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Package, BookMarked, Info, Mail, Lock, User, LogIn, LogOut, Trash2, Crown, Bell, Sliders } from "lucide-react";

export default function Account() {
  const { t } = useLanguage();
  const { isAuthenticated, user, logout, navigateToLogin } = useAuth();
  const { isPro, openPricing, openDonation, clearProStatus } = useMonetization();

  const handleDeleteAccount = async () => {
    if (!confirm(t("deleteAccountConfirm") || "Are you sure you want to delete your account? This cannot be undone.")) return;
    clearProStatus();
    try {
      if (typeof base44.auth.deleteAccount === "function") {
        await base44.auth.deleteAccount();
      } else {
        alert(t("deleteAccountUnavailable") || "Account deletion is not available yet. Please contact support.");
      }
    } catch { /* ignore */ }
  };

  const savedLinks = [
    { path: "/pantry", label: t("savedPreferences"), icon: Package, sub: t("pantryNav") },
    { path: "/saved-plans", label: t("savedPlans"), icon: BookMarked, sub: t("navMyPlan") },
  ];

  const secondaryLinks = [
    { path: "/about", label: t("aboutNav"), icon: Info },
    { path: "/contact", label: t("contactNav"), icon: Mail },
    { path: "/datenschutz", label: t("privacyNav"), icon: Lock },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="font-heading text-2xl font-bold">{t("accountNav")}</h1>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-5">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate">{user?.full_name || user?.email || t("accountNav")}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive transition-colors border border-border">
              <LogOut className="h-4 w-4" />
              {t("logoutNav")}
            </button>
          </div>
        ) : (
          <button onClick={navigateToLogin} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            <LogIn className="h-5 w-5" />
            {t("signInNav")}
          </button>
        )}
      </div>

      {/* Saved Preferences & Saved Plans */}
      <div>
        <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{t("savedPreferences")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {savedLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} className="flex flex-col gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-muted transition-colors">
                <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Premium & Billing */}
      <div>
        <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{t("premiumBilling")}</h2>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-semibold">{isPro ? t("premium") : t("upgrade")}</h3>
            {isPro && <ProBadge />}
          </div>
          <CreditBar />
          {!isPro && <UpgradeBanner onClick={openPricing} />}
          <SupportUsButton onClick={openDonation} />
        </div>
      </div>

      {/* Settings & Notifications */}
      <div>
        <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">{t("settingsNotifications")}</h2>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex-1 min-w-0">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{t("notifications")}</p>
              <p className="text-xs text-muted-foreground">{t("settings")}</p>
            </div>
            <Sliders className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </div>

      {/* Secondary links */}
      <div className="flex items-center gap-2 flex-wrap pt-2">
        {secondaryLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground bg-muted/50 hover:bg-muted transition-colors">
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Delete account */}
      {isAuthenticated && (
        <button onClick={handleDeleteAccount} className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground/70 hover:text-destructive transition-colors w-full justify-center">
          <Trash2 className="h-3.5 w-3.5" />
          {t("deleteAccount")}
        </button>
      )}
    </div>
  );
}