import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import CookieBanner from "./CookieBanner";
import { ShoppingCart, Home, BookMarked, ArrowLeft, ArrowRight, Download, Utensils, Info, Mail, Lock, MoreHorizontal, User, LogIn, LogOut, Trash2, Wallet, Package } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ProBadge from "@/components/monetization/ProBadge";
import SupportUsButton from "@/components/monetization/SupportUsButton";
import UpgradeBanner from "@/components/monetization/UpgradeBanner";
import { useMonetization } from "@/lib/MonetizationContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import Footer from "@/components/Footer";
import HomePage from "../pages/Home";
import BudgetPlannerPage from "@/pages/BudgetPlanner";
import { modeText } from "@/lib/translations_modes";
import SavedMealPlansPage from "../pages/SavedMealPlans";
import MealPlanPage from "../pages/MealPlan";
import PlanBuilderPage from "../pages/PlanBuilder";
import GenerationBadge from "@/components/GenerationBadge";
import { useState, useEffect } from "react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { isPro, credits, openPricing, openDonation, clearProStatus } = useMonetization();
  const { isAuthenticated, user, logout, navigateToLogin } = useAuth();
  const showUpgrade = !isPro;

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

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

  const PERSIST_PATHS = ["/", "/budget", "/saved-plans", "/meal-plan", "/plan-builder"];
  const budgetLabel = modeText(currentLanguage?.code).budgetTitle;
  const isPersistRoute = PERSIST_PATHS.includes(location.pathname);
  const isRoot = location.pathname === "/";
  const navItems = [
    { path: "/", label: t("home"), sub: t("navHomeSub"), icon: Home, activeFor: ["/", "/budget", "/plan-builder", "/meal-plan", "/nutrition", "/plan-review"] },
    { path: "/account", label: t("accountNav"), sub: t("navAccountSub"), icon: User, activeFor: ["/account", "/saved-plans", "/pantry", "/about", "/contact", "/datenschutz", "/repo-stats"] },
  ];

  const secondaryNavItems = [
    { path: "/budget", label: budgetLabel, icon: Wallet },
    { path: "/plan-builder", label: t("planBuilderNav"), icon: Utensils },
    { path: "/pantry", label: t("pantryNav"), icon: Package },
    { path: "/about", label: t("aboutNav"), icon: Info },
    { path: "/contact", label: t("contactNav"), icon: Mail },
    { path: "/datenschutz", label: t("privacyNav"), icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border sticky top-0 h-screen shrink-0 z-50">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-foreground">
              Budget<span className="text-primary">Bite</span>
            </span>
            {isPro && <ProBadge className="ml-1" />}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = (item.activeFor || [item.path]).includes(location.pathname);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors select-none ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div className="min-w-0 leading-tight">
                  <span className="truncate block">{item.label}</span>
                  <span className={`truncate block text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>{item.sub}</span>
                </div>
              </Link>
            );
          })}
          {!isAuthenticated && (
            <button
              onClick={navigateToLogin}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors select-none w-full"
            >
              <LogIn className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("signInNav")}</span>
            </button>
          )}
          <div className="pt-4 mt-4 border-t border-border space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors select-none ${
                    isActive
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0 space-y-3">
          {isAuthenticated && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.full_name || user?.email || t("accountNav")}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button onClick={logout} className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title={t("logoutNav")} aria-label={t("logoutNav")}>
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-muted-foreground/70 hover:text-destructive transition-colors w-full"
              >
                <Trash2 className="h-3 w-3" />
                {t("deleteAccount") || "Delete account"}
              </button>
            </>
          )}
          {showUpgrade && <UpgradeBanner onClick={openPricing} />}
          <SupportUsButton onClick={openDonation} />
          {installPrompt && !isInstalled && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-primary transition-colors w-full"
            >
              <Download className="h-4 w-4" />
              {t("installApp")}
            </button>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex-1 min-w-0">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header — mobile only */}
        <header
          className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="px-4 h-14 flex items-center justify-between">
            {isRoot ? (
              <Link to="/" className="flex items-center gap-2.5 select-none">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                  <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-lg tracking-tight text-foreground">
                  Budget<span className="text-primary">Bite</span>
                </span>
                {isPro && <ProBadge className="ml-1" />}
              </Link>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors select-none -ml-2 px-2 min-h-[44px] py-2"
              >
                <ArrowLeft className="h-5 w-5" />
                {t("back")}
              </button>
            )}
            <div className="flex items-center gap-1.5">
              {!isAuthenticated && (
                <button
                  onClick={navigateToLogin}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors shrink-0"
                  aria-label={t("signInNav")}
                >
                  <LogIn className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[11px] font-semibold">{t("signInNav")}</span>
                </button>
              )}
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-36 md:px-8 md:pb-8">
          {/* Always-mounted tab pages — hidden via CSS to preserve state */}
          <div style={{ display: location.pathname === "/" ? "block" : "none" }}>
            <HomePage />
          </div>
          <div style={{ display: location.pathname === "/budget" ? "block" : "none" }}>
            <BudgetPlannerPage />
          </div>
          <div style={{ display: location.pathname === "/saved-plans" ? "block" : "none" }}>
            <SavedMealPlansPage />
          </div>
          <div style={{ display: location.pathname === "/meal-plan" ? "block" : "none" }}>
            <MealPlanPage />
          </div>
          <div style={{ display: location.pathname === "/plan-builder" ? "block" : "none" }}>
            <PlanBuilderPage />
          </div>
          {/* Non-persistent routes (About, Contact, etc.) */}
          {!isPersistRoute && (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}
          <Footer />
        </main>

        <GenerationBadge />
        <CookieBanner />

        {/* Floating Pill Dock — mobile only */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        >
          <div className="pointer-events-auto w-full max-w-[390px] rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl shadow-black/30 overflow-hidden">
            <div className="flex items-stretch">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = (item.activeFor || [item.path]).includes(location.pathname);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors select-none ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-[10px] font-heading font-bold leading-none">{item.label}</span>
                    <span className={`text-[8px] leading-none truncate max-w-full text-center ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>{item.sub}</span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-border" />
            <Link
              to="/plan-builder"
              className="flex items-center justify-center gap-2 py-2.5 mx-2 mb-2 mt-1 rounded-full bg-[#A8F21D] text-black font-heading font-bold text-sm hover:brightness-95 transition-all"
            >
              <Utensils className="h-4 w-4" />
              {t("createMealPlan")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>

      </div>
    </div>
  );
}