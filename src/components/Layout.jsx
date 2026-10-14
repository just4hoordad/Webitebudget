import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import CookieBanner from "./CookieBanner";
import { ShoppingCart, Home, BookMarked, ArrowLeft, Download, Utensils, Info, Mail, Lock, MoreHorizontal, User, LogIn, LogOut, Trash2, Wallet, Package } from "lucide-react";
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
  const [moreOpen, setMoreOpen] = useState(false);
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
    { path: "/", label: t("home"), icon: Home },
    { path: "/budget", label: budgetLabel, icon: Wallet },
    { path: "/plan-builder", label: t("planBuilderNav"), icon: Utensils },
    { path: "/saved-plans", label: t("savedPlans"), icon: BookMarked },
  ];

  const secondaryNavItems = [
    { path: "/pantry", label: "Pantry", icon: Package },
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
            const isActive = location.pathname === item.path;
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
                <span className="truncate">{item.label}</span>
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
          <div className="pointer-events-auto flex items-center gap-1 w-full max-w-[390px] rounded-full bg-card/95 backdrop-blur-md border border-border shadow-2xl shadow-black/30 p-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (isActive) navigate(item.path, { replace: true }); }}
                  className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-full text-[9px] font-heading font-semibold uppercase tracking-tight transition-colors select-none ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate max-w-full text-center leading-none">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-0.5"
              title={t("more") || "More"}
              aria-label={t("more") || "More"}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </nav>

        {/* More sheet — mobile only */}
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoreOpen(false)}
                className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border p-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
                {!isAuthenticated ? (
                  <button
                    onClick={() => { setMoreOpen(false); navigateToLogin(); }}
                    className="flex items-center justify-between gap-3 mb-3 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 w-full"
                  >
                    <span className="flex items-center gap-2.5">
                      <LogIn className="h-5 w-5" />
                      {t("signInNav")}
                    </span>
                    <span className="text-xs opacity-90">&rarr;</span>
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3 px-3 py-3 rounded-2xl bg-secondary">
                      <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || user?.email || t("accountNav")}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <button onClick={logout} className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors text-xs font-medium">
                        <LogOut className="h-4 w-4" />
                        {t("logoutNav")}
                      </button>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-xl text-xs text-muted-foreground/70 hover:text-destructive transition-colors w-full"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("deleteAccount") || "Delete account"}
                    </button>
                  </>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${
                          isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-foreground"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-2">
                  {showUpgrade && <UpgradeBanner onClick={() => { setMoreOpen(false); openPricing(); }} variant="sheet" />}
                  <SupportUsButton onClick={() => { setMoreOpen(false); openDonation(); }} variant="sheet" />
                </div>
                {installPrompt && !isInstalled && (
                  <button
                    onClick={() => { handleInstall(); setMoreOpen(false); }}
                    className="mt-3 w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                  >
                    <Download className="h-5 w-5" />
                    {t("installApp")}
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}