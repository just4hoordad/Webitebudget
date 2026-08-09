import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import CookieBanner from "./CookieBanner";
import { ShoppingCart, Home, BookMarked, ArrowLeft, Download, Utensils } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import HomePage from "../pages/Home";
import SavedMealPlansPage from "../pages/SavedMealPlans";
import { useState, useEffect } from "react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

  const TAB_PATHS = ["/", "/saved-plans"];
  const isTabRoute = TAB_PATHS.includes(location.pathname);
  const isRoot = location.pathname === "/";
  const navItems = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/plan-builder", label: t("planBuilderNav"), icon: Utensils },
    { path: "/saved-plans", label: t("savedPlans"), icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 bg-dark/95 backdrop-blur-xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-28">
        {/* Always-mounted tab pages — hidden via CSS to preserve state */}
        <div style={{ display: location.pathname === "/" ? "block" : "none" }}>
          <HomePage />
        </div>
        <div style={{ display: location.pathname === "/saved-plans" ? "block" : "none" }}>
          <SavedMealPlansPage />
        </div>
        {/* Non-tab routes (e.g. /meal-plan) */}
        {!isTabRoute && (
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

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-xl border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch w-full overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (isActive) navigate(item.path, { replace: true }); }}
                className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2.5 text-xs font-medium transition-colors select-none ${
                  isActive ? "text-primary" : "text-dark-muted hover:text-dark-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate w-full text-center px-1">{item.label}</span>
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
                )}
              </Link>
            );
          })}
          <Link
            to="/about"
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2.5 text-xs font-medium transition-colors select-none ${
              location.pathname === "/about" ? "text-primary" : "text-dark-muted hover:text-dark-foreground"
            }`}
          >
            <span className="text-lg leading-none shrink-0">ℹ️</span>
            <span className="truncate w-full text-center px-1">About</span>
            {location.pathname === "/about" && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
            )}
          </Link>
          <Link
            to="/contact"
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2.5 text-xs font-medium transition-colors select-none ${
              location.pathname === "/contact" ? "text-primary" : "text-dark-muted hover:text-dark-foreground"
            }`}
          >
            <span className="text-lg leading-none shrink-0">✉️</span>
            <span className="truncate w-full text-center px-1">Contact</span>
            {location.pathname === "/contact" && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
            )}
          </Link>
          <Link
            to="/datenschutz"
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2.5 text-xs font-medium transition-colors select-none ${
              location.pathname === "/datenschutz" ? "text-primary" : "text-dark-muted hover:text-dark-foreground"
            }`}
          >
            <span className="text-lg leading-none shrink-0">🔒</span>
            <span className="truncate w-full text-center px-1">{t("privacyNav")}</span>
            {location.pathname === "/datenschutz" && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
            )}
          </Link>
          {installPrompt && !isInstalled && (
            <button
              onClick={handleInstall}
              className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2.5 text-xs font-medium transition-colors select-none text-dark-muted hover:text-primary"
            >
              <Download className="h-5 w-5 shrink-0" />
              <span className="truncate w-full text-center px-1">Install</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}