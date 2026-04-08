import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { ShoppingCart, Home, BookMarked, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isRoot = location.pathname === "/";
  const navItems = [
    { path: "/", label: t("home"), icon: Home },
    { path: "/saved-plans", label: t("savedPlans"), icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {isRoot ? (
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight">BudgetBite</span>
            </Link>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-foreground select-none"
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
      </main>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around max-w-5xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-8 py-3 text-xs font-medium transition-colors select-none ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}