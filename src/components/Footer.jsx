import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-10 border-t border-border pt-8 pb-2">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-base text-foreground">
              Budget<span className="text-primary">Bite</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("planSubtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-heading font-semibold text-foreground uppercase tracking-wide text-[11px]">
              {t("footerProduct") || "Product"}
            </p>
            <Link to="/plan-builder" className="block text-muted-foreground hover:text-primary transition-colors">{t("planBuilderNav")}</Link>
            <Link to="/saved-plans" className="block text-muted-foreground hover:text-primary transition-colors">{t("savedPlans")}</Link>
            <Link to="/nutrition" className="block text-muted-foreground hover:text-primary transition-colors">{t("nutritionNav") || "Nutrition"}</Link>
          </div>
          <div className="space-y-2">
            <p className="font-heading font-semibold text-foreground uppercase tracking-wide text-[11px]">
              {t("footerResources") || "Resources"}
            </p>
            <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">{t("aboutNav")}</Link>
            <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">{t("contactNav")}</Link>
            <Link to="/repo-stats" className="block text-muted-foreground hover:text-primary transition-colors">{t("repoStatsNav") || "Repo Stats"}</Link>
          </div>
          <div className="space-y-2">
            <p className="font-heading font-semibold text-foreground uppercase tracking-wide text-[11px]">
              {t("footerLegal") || "Legal"}
            </p>
            <Link to="/datenschutz" className="block text-muted-foreground hover:text-primary transition-colors">{t("privacyNav")}</Link>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} BudgetBite</p>
      </div>
    </footer>
  );
}