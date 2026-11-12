import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import CreditBar from "@/components/monetization/CreditBar";
import { Plus, Users, ArrowRight, Leaf, Wallet, Calendar, Flame, TrendingUp } from "lucide-react";
import { useCountUp, formatNumber, timeAgo } from "@/components/dashboard/useCountUp";
import ProgressRing from "@/components/dashboard/ProgressRing";
import BarChart from "@/components/dashboard/BarChart";
import LineChart from "@/components/dashboard/LineChart";

export default function DashboardView() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ count: 0, totalBudget: 0, dietCounts: [], budgetSeries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [recentRes, aggRes] = await Promise.allSettled([
        base44.entities.MealPlan.filter({}, { sort: "-created_date", limit: 5 }),
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
  const animatedBudget = useCountUp(stats.totalBudget || 0);
  const ringPercent = Math.min((stats.count / 10) * 100, 100);

  return (
    <div className="bb-dash-panel rounded-[28px] p-4 sm:p-5 flex flex-col gap-4 text-[#e7ebdd]">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            {t("welcomeBack") || "Welcome back"}, {firstName} 👋
          </h1>
          <p className="text-sm text-[#8e9682] mt-0.5">
            {t("dashboardSubtitle") || "Pick up where you left off or start something new."}
          </p>
        </div>
        <CreditBar variant="card" />
      </header>

      {/* Featured stat pill: total budget + ring */}
      <div
        className="border-[1.5px] border-[#e7ebdd]/70 rounded-[36px] p-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 hover:shadow-lg hover:shadow-[#78a71b]/10 transition-shadow"
      >
        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs font-medium tracking-[0.14em] uppercase text-[#8e9682]">
            {t("totalPlanned") || "Total planned"}
          </span>
          <span className="block font-heading text-3xl sm:text-4xl font-bold tabular-nums leading-none mt-1 min-w-[6ch]">
            €{formatNumber(animatedBudget, 0)}
          </span>
          <p className="text-xs sm:text-sm text-[#e7ebdd]/80 mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[#a3d437] shrink-0" />
            {stats.count} {stats.count === 1 ? (t("planSingular") || "plan") : (t("planPlural") || "plans")}
          </p>
        </div>
        <ProgressRing percent={ringPercent} trackClass="text-[#e7ebdd]/15" labelClass="text-[#e7ebdd]" />
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Meal plans + bar chart */}
        <article className="border-[1.5px] border-[#e7ebdd]/70 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 bg-black/30 backdrop-blur-md hover:shadow-lg hover:shadow-[#78a71b]/10 transition-shadow">
          <div>
            <h3 className="text-xs font-medium tracking-wider uppercase text-[#8e9682]">
              {t("mealPlans") || "Meal plans"}
            </h3>
            <p className="text-sm text-[#8e9682] mt-0.5">{t("allTime") || "All time"}</p>
          </div>
          <BarChart data={stats.dietCounts} />
          <div>
            <span className="block text-[10px] tracking-[0.12em] text-[#8e9682]">{t("total") || "TOTAL"}</span>
            <span className="font-heading text-2xl font-bold tabular-nums">{stats.count}</span>
          </div>
        </article>

        {/* Avg budget + line chart */}
        <article className="border-[1.5px] border-[#e7ebdd]/70 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 bg-black/30 backdrop-blur-md hover:shadow-lg hover:shadow-[#78a71b]/10 transition-shadow">
          <div>
            <h3 className="text-xs font-medium tracking-wider uppercase text-[#8e9682]">
              {t("avgBudget") || "Avg budget"}
            </h3>
            <p className="text-sm text-[#8e9682] mt-0.5">{t("perPlan") || "Per plan"}</p>
          </div>
          <LineChart data={stats.budgetSeries} />
          <div>
            <span className="block text-[10px] tracking-[0.12em] text-[#8e9682]">{t("average") || "AVG"}</span>
            <span className="font-heading text-2xl font-bold tabular-nums">€{formatNumber(avgBudget, 0)}</span>
          </div>
        </article>
      </div>

      {/* Recent plans — activity feed */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base sm:text-lg font-bold">
            {t("recentPlans") || "Recent plans"}
          </h2>
          {plans.length > 0 && (
            <Link to="/saved-plans" className="text-xs sm:text-sm text-[#a3d437] font-medium hover:underline flex items-center gap-1">
              {t("viewAll") || "View all"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t-[1.5px] border-[#e7ebdd]/15 py-3 h-12 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="border-[1.5px] border-[#e7ebdd]/30 rounded-2xl p-6 text-center space-y-2">
            <div className="h-11 w-11 rounded-2xl bg-[#78a71b]/20 flex items-center justify-center mx-auto">
              <Calendar className="h-5 w-5 text-[#a3d437]" />
            </div>
            <p className="text-sm text-[#8e9682]">
              {t("noRecentPlans") || "No saved plans yet — create your first one below."}
            </p>
          </div>
        ) : (
          <ul className="m-0 p-0 list-none">
            {plans.map((plan, i) => (
              <motion.li
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] }}
              >
                <Link
                  to="/saved-plans"
                  className="group grid items-center gap-1.5 sm:gap-3 py-3 border-t-[1.5px] border-[#e7ebdd]/15 hover:border-[#a3d437]/40 transition-colors"
                  style={{ gridTemplateColumns: "1fr auto" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-3.5 w-3.5 text-[#a3d437] shrink-0" />
                      <span className="font-heading font-bold text-sm leading-tight line-clamp-1">{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-[#8e9682] mt-0.5 flex-wrap pl-6">
                      {plan.diet && <span className="font-medium text-[#e7ebdd]/80">{plan.diet}</span>}
                      {plan.budget != null && <span className="flex items-center gap-0.5"><Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}</span>}
                      {plan.days != null && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{plan.days}d</span>}
                      {plan.calories != null && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{plan.calories}</span>}
                      <span className="text-[#8e9682]/70">· {timeAgo(plan.created_date)}</span>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#a3d437] shrink-0 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    {t("continue") || "Continue"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 pt-1">
        <Link
          to="/budget"
          className="bg-[#78a71b] text-[#1a1a1a] rounded-2xl p-4 flex items-center gap-4 hover:bg-[#8bb821] transition-colors font-heading font-bold"
        >
          <div className="h-11 w-11 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold">{t("createNewPlan") || "Create a new plan"}</h3>
            <p className="text-xs sm:text-sm text-[#1a1a1a]/70 truncate font-body font-normal">
              {t("planSubtitle") || "Set your budget and preferences to get a personalized meal plan."}
            </p>
          </div>
        </Link>
        <Link
          to="/community"
          className="border-[1.5px] border-[#e7ebdd]/30 rounded-2xl p-4 flex items-center gap-4 hover:border-[#a3d437] transition-colors"
        >
          <div className="h-11 w-11 rounded-xl bg-[#78a71b]/20 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-[#a3d437]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold">{t("browseCommunityTitle") || "Browse community plans"}</h3>
            <p className="text-xs sm:text-sm text-[#8e9682] truncate">
              {t("browseCommunityDesc") || "Discover grocery lists and meal plans shared by others."}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}