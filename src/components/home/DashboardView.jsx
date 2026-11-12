import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import CreditBar from "@/components/monetization/CreditBar";
import { Plus, Users, ArrowRight } from "lucide-react";
import FeaturedStat from "@/components/dashboard/FeaturedStat";
import StatCard from "@/components/dashboard/StatCard";
import BarChart from "@/components/dashboard/BarChart";
import LineChart from "@/components/dashboard/LineChart";
import RecentPlans from "@/components/dashboard/RecentPlans";
import { formatNumber } from "@/components/dashboard/useCountUp";

export default function DashboardView() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ count: 0, totalBudget: 0, dietCounts: [], budgetSeries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [recentRes, aggRes] = await Promise.allSettled([
        base44.entities.MealPlan.filter({}, { sort: "-created_date", limit: 7 }),
        base44.entities.MealPlan.aggregate({ groupBy: "diet", sum: ["budget"] }),
      ]);
      const recent = recentRes.status === "fulfilled" ? (recentRes.value.items || []) : [];
      setPlans(recent);
      if (aggRes.status === "fulfilled") {
        const rows = aggRes.value.rows || [];
        const count = rows.reduce((s, r) => s + (r.count || 0), 0);
        const totalBudget = rows.reduce((s, r) => s + (r.sum_budget || 0), 0);
        const dietCounts = rows.map((r) => r.count || 0).sort((a, b) => b - a);
        setStats({ count, totalBudget, dietCounts, budgetSeries: recent.map((p) => Number(p.budget) || 0).reverse() });
      } else {
        setStats({
          count: recent.length,
          totalBudget: recent.reduce((s, p) => s + (Number(p.budget) || 0), 0),
          dietCounts: [recent.length],
          budgetSeries: recent.map((p) => Number(p.budget) || 0).reverse(),
        });
      }
      setLoading(false);
    })();
  }, []);

  const firstName = (user?.full_name || user?.email || "").split(" ")[0] || (t("there") || "there");
  const avgBudget = stats.count ? stats.totalBudget / stats.count : 0;

  return (
    <div className="space-y-5">
      {/* Header: greeting + credits */}
      <div className="bg-card border border-border rounded-3xl p-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            {t("welcomeBack") || "Welcome back"}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("dashboardSubtitle") || "Pick up where you left off or start something new."}
          </p>
        </div>
        <CreditBar variant="card" />
      </div>

      {/* Recent plans — PROMINENT */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("recentPlans") || "Recent plans"}
          </h2>
          {plans.length > 0 && (
            <Link to="/saved-plans" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              {t("viewAll") || "View all"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <RecentPlans plans={plans.slice(0, 4)} loading={loading} t={t} />
      </section>

      {/* Featured stat */}
      <FeaturedStat totalBudget={stats.totalBudget} planCount={stats.count} t={t} />

      {/* Stat cards */}
      <section className="grid gap-3 grid-cols-2">
        <StatCard title={t("mealPlans") || "Meal plans"} subtitle={t("allTime") || "All time"}>
          <BarChart data={stats.dietCounts} />
          <div className="flex flex-col gap-1.5 mt-1">
            <div>
              <span className="block text-xs tracking-wider text-muted-foreground">{t("total") || "TOTAL"}</span>
              <span className="font-heading text-2xl font-bold text-foreground tabular-nums">{stats.count}</span>
            </div>
          </div>
        </StatCard>
        <StatCard title={t("avgBudget") || "Avg budget"} subtitle={t("perPlan") || "Per plan"}>
          <LineChart data={stats.budgetSeries} />
          <div className="flex flex-col gap-1.5 mt-1">
            <div>
              <span className="block text-xs tracking-wider text-muted-foreground">{t("average") || "AVG"}</span>
              <span className="font-heading text-2xl font-bold text-foreground tabular-nums">€{formatNumber(avgBudget, 0)}</span>
            </div>
          </div>
        </StatCard>
      </section>

      {/* Quick actions */}
      <section className="grid gap-3">
        <Link to="/budget" className="bg-primary text-primary-foreground rounded-2xl p-4 flex items-center gap-4 hover:opacity-95 transition-opacity">
          <div className="h-11 w-11 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold">{t("createNewPlan") || "Create a new plan"}</h3>
            <p className="text-sm text-primary-foreground/80 truncate">
              {t("planSubtitle") || "Set your budget and preferences to get a personalized meal plan."}
            </p>
          </div>
        </Link>
        <Link to="/community" className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary transition-colors">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-foreground">{t("browseCommunityTitle") || "Browse community plans"}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {t("browseCommunityDesc") || "Discover grocery lists and meal plans shared by others."}
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}