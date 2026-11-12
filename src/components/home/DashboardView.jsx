import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import CreditBar from "@/components/monetization/CreditBar";
import { Plus, Users, ArrowRight, Calendar, Leaf, Wallet } from "lucide-react";

export default function DashboardView() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.MealPlan.filter(
          {},
          { sort: "-created_date", limit: 3 }
        );
        setPlans(page.items || []);
      } catch {
        /* non-critical */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const firstName = (user?.full_name || user?.email || "").split(" ")[0] || (t("accountNav") || "there");

  return (
    <div className="space-y-6">
      {/* Greeting + credits */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {t("welcomeBack") || "Welcome back"}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("dashboardSubtitle") || "Pick up where you left off or start something new."}
            </p>
          </div>
          <CreditBar variant="card" />
        </div>
      </div>

      {/* Recent plans — primary action: continue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("recentPlans") || "Recent plans"}
          </h2>
          {plans.length > 0 && (
            <Link
              to="/saved-plans"
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              {t("viewAll") || "View all"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-5 h-36 animate-pulse"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("noRecentPlans") || "No saved plans yet — create your first one below."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                to="/saved-plans"
                className="bg-card border border-border rounded-2xl p-5 space-y-2 hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Leaf className="h-3 w-3" />
                    {plan.diet || t("balanced") || "Balanced"}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-foreground text-base leading-tight line-clamp-2">
                  {plan.name}
                </h3>
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  {plan.budget != null && (
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}
                    </span>
                  )}
                  {plan.days != null && <span>{plan.days} {t("days") || "days"}</span>}
                  {plan.calories != null && <span>{plan.calories} kcal</span>}
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary pt-2 group-hover:gap-2 transition-all">
                  {t("continue") || "Continue"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid gap-3 md:grid-cols-2">
        <Link
          to="/budget"
          className="bg-primary text-primary-foreground rounded-2xl p-5 flex items-center gap-4 hover:opacity-95 transition-opacity"
        >
          <div className="h-11 w-11 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold">{t("createNewPlan") || "Create a new plan"}</h3>
            <p className="text-sm text-primary-foreground/80">{t("planSubtitle") || "Set your budget and preferences to get a personalized meal plan."}</p>
          </div>
        </Link>
        <Link
          to="/community"
          className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary transition-colors"
        >
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground">{t("browseCommunityTitle") || "Browse community plans"}</h3>
            <p className="text-sm text-muted-foreground">
              {t("browseCommunityDesc") || "Discover grocery lists and meal plans shared by others."}
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}