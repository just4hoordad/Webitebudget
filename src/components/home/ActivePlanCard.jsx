import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Leaf, Calendar, ChevronRight } from "lucide-react";

export default function ActivePlanCard() {
  const { t } = useLanguage();
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.auth.isAuthenticated().then(async (ok) => {
      if (!ok) { setLoading(false); return; }
      try {
        const page = await base44.entities.MealPlan.filter({}, { sort: "-created_date", limit: 1, fields: ["name", "diet", "budget", "days", "people", "created_date"] });
        if (alive) setLatest(page.items?.[0] || null);
      } catch { /* ignore */ }
      finally { if (alive) setLoading(false); }
    });
    return () => { alive = false; };
  }, []);

  if (loading || !latest) return null;

  const created = new Date(latest.created_date).toLocaleDateString();

  return (
    <Link
      to="/saved-plans"
      className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-primary/80 mb-1">
            {t("welcomeBack") || "Welcome back"}
          </p>
          <h3 className="font-heading font-bold text-lg text-foreground leading-tight truncate">
            {latest.name}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {latest.diet && <span className="inline-flex items-center gap-1"><Leaf className="h-3 w-3" />{latest.diet}</span>}
            {latest.days && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{latest.days} {t("days")}</span>}
            {latest.budget != null && <span>€{latest.budget.toFixed(0)}</span>}
            <span>{created}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1 text-primary">
          <span className="text-sm font-heading font-semibold">{t("continue") || "Continue"}</span>
          <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}