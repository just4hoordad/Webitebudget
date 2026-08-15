import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import CookieBanner from "./CookieBanner";
import { ShoppingCart, Home, BookMarked, ArrowLeft, Download, Utensils, Info, Mail, Lock, Package, MoreHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import HomePage from "../pages/Home";
import SavedMealPlansPage from "../pages/SavedMealPlans";
import MealPlanPage from "../pages/MealPlan";
import PlanBuilderPage from "../pages/PlanBuilder";
import { useState, useEffect } from "react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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

  const PERSIST_PATHS = ["/", "/saved-plans", "/meal-plan", "/plan-builder"];
  const isPersistRoute = PERSIST_PATHS.includes(location.pathname);
  const isRoot = location.pathname === "/";
  const navItems = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/plan-builder", label: t("planBuilderNav"), icon: Utensils },
    { path: "/saved-plans", label: t("savedPlans"), icon: BookMarked },
    { path: "/pantry-dashboard", label: t("pantryNav") || "Pantry", icon: Package },
  ];

  const secondaryNavItems = [
    { path: "/about", label: t("aboutNav"), icon: Info },
    { path: "/contact", label: t("contactNav"), icon: Mail },
    { path: "/datenschutz", label: t("privacyNav"), icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-64 bg-dark border-r border-white/10 sticky top-0 h-screen shrink-0 z-50">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-white/5 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-dark-foreground">
              Budget<span className="text-primary">Bite</span>
            </span>
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
                    : "text-dark-muted hover:text-dark-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors select-none ${
                    isActive
                      ? "bg-white/10 text-primary"
                      : "text-dark-muted hover:text-dark-foreground hover:bg-white/5"
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
        <div className="p-4 border-t border-white/5 shrink-0">
          {installPrompt && !isInstalled && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-3 py-2 mb-3 rounded-xl text-sm text-dark-muted hover:text-primary transition-colors w-full"
            >
              <Download className="h-4 w-4" />
              {t("installApp")}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header — mobile only */}
        <header
          className="md:hidden sticky top-0 z-50 bg-dark/95 backdrop-blur-xl border-b border-white/10"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="px-4 h-14 flex items-center justify-between">
            {isRoot ? (
              <Link to="/" className="flex items-center gap-2.5 select-none">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                  <ShoppingCart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-heading font-bold text-lg tracking-tight text-dark-foreground">
                  Budget<span className="text-primary">Bite</span>
                </span>
              </Link>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-sm font-medium text-dark-foreground hover:text-primary transition-colors select-none"
              >
                <ArrowLeft className="h-5 w-5" />
                {t("back")}
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-28 md:px-8 md:pb-8">
          {/* Always-mounted tab pages — hidden via CSS to preserve state */}
          <div style={{ display: location.pathname === "/" ? "block" : "none" }}>
            <HomePage />
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
        </main>

        <CookieBanner />

        {/* Floating Pill Dock — mobile only */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        >
          <div className="flex items-center gap-1 rounded-full bg-[#1C1F27] border border-white/10 shadow-2xl shadow-black/40 px-2 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (isActive) navigate(item.path, { replace: true }); }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full text-[9px] font-heading font-semibold uppercase tracking-wide transition-colors select-none ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate max-w-[56px] text-center leading-none">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-[#242731] text-white/70 hover:text-white transition-colors shrink-0"
              title={t("more") || "More"}
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
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-white/10 p-4"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
              >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
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
                          isActive ? "bg-primary/10 border-primary/30 text-primary" : "bg-secondary border-border text-dark-foreground"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
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