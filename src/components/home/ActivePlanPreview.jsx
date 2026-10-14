import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Leaf } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";

export default function ActivePlanPreview() {
  const { t } = useLanguage();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.MealPlan.filter({}, { sort: "-created_date", limit: 1, fields: ["name", "diet", "budget", "calories", "days", "people", "created_date"] });
        setPlan(items[0] || null);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold">{t("activePlanPreview")}</h2>
        <div className="rounded-2xl border border-border bg-card p-6 animate-pulse h-28" />
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold">{t("activePlanPreview")}</h2>
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{t("noActivePlan")}</p>
            <Link to="/plan-builder" className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-1">
              {t("createOneNow")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold">{t("activePlanPreview")}</h2>
      <Link to="/saved-plans" className="block rounded-2xl border border-border bg-card p-5 hover:border-primary transition-colors">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-foreground truncate">{plan.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {plan.diet && <span className="flex items-center gap-1"><Leaf className="h-3 w-3" />{plan.diet}</span>}
              {plan.budget != null && <span>€{plan.budget?.toFixed(2)}</span>}
              {plan.calories != null && <span>{plan.calories} kcal</span>}
              {plan.days != null && <span>{plan.days} {t("days")}</span>}
              {plan.people != null && <span>{plan.people} {t("personS")}</span>}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </Link>
    </section>
  );
}