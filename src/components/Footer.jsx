import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-14 border-t border-border pt-10 pb-4">
      <div className="space-y-8">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/75 flex items-center justify-center shrink-0 bb-shadow-glow">
            <ShoppingCart className="h-[18px] w-[18px] text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-lg text-foreground tracking-tight">
              Budget<span className="text-primary">Bite</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xs">{t("planSubtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="space-y-2.5">
            <p className="font-heading font-semibold text-foreground uppercase tracking-[0.14em] text-[11px]">
              {t("footerProduct") || "Product"}
            </p>
            <Link to="/plan-builder" className="block text-muted-foreground hover:text-primary transition-colors">{t("planBuilderNav")}</Link>
            <Link to="/saved-plans" className="block text-muted-foreground hover:text-primary transition-colors">{t("savedPlans")}</Link>
            <Link to="/nutrition" className="block text-muted-foreground hover:text-primary transition-colors">{t("nutritionNav") || "Nutrition"}</Link>
          </div>
          <div className="space-y-2.5">
            <p className="font-heading font-semibold text-foreground uppercase tracking-[0.14em] text-[11px]">
              {t("footerResources") || "Resources"}
            </p>
            <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">{t("aboutNav")}</Link>
            <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">{t("contactNav")}</Link>
            <Link to="/repo-stats" className="block text-muted-foreground hover:text-primary transition-colors">{t("repoStatsNav") || "Repo Stats"}</Link>
          </div>
          <div className="space-y-2.5">
            <p className="font-heading font-semibold text-foreground uppercase tracking-[0.14em] text-[11px]">
              {t("footerLegal") || "Legal"}
            </p>
            <Link to="/datenschutz" className="block text-muted-foreground hover:text-primary transition-colors">{t("privacyNav")}</Link>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} BudgetBite</p>
          <p className="text-[11px] text-muted-foreground/70">Made with care for budget-conscious foodies</p>
        </div>
      </div>
    </footer>
  );
}