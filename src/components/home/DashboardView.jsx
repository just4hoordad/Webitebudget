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
    <div className="flex flex-col gap-4 text-[#111827]">
      {/* Header Hero Tile */}
      <header className="bba-t bg-white flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="bba-sticker mb-2">Dashboard</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight leading-tight text-[#111827]">
            {t("welcomeBack") || "Welcome back"}, {firstName} 👋
          </h1>
          <p className="text-sm text-[#1f2937] mt-1 font-medium">
            {t("dashboardSubtitle") || "Pick up where you left off or start something new."}
          </p>
        </div>
        <CreditBar variant="onLight" />
      </header>

      {/* Featured stat tile: total budget + ring */}
      <div className="bba-t bg-[#78a71b] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-black tracking-[0.12em] uppercase text-[#111827]/80">
            {t("totalPlanned") || "Total planned"}
          </span>
          <span className="block font-heading text-4xl font-black tabular-nums leading-none mt-1 text-[#111827]">
            €{formatNumber(animatedBudget, 0)}
          </span>
          <p className="text-xs sm:text-sm text-[#111827] font-bold mt-2 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#111827] shrink-0" />
            {stats.count} {stats.count === 1 ? (t("planSingular") || "plan") : (t("planPlural") || "plans")}
          </p>
        </div>
        <div className="bg-white border-[3px] border-[#111827] rounded-2xl p-2 shadow-[3px_3px_0_#111827]">
          <ProgressRing percent={ringPercent} trackClass="text-[#111827]/15" labelClass="text-[#111827]" />
        </div>
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Meal plans + bar chart */}
        <article className="bba-t bg-[#FF8FB5] flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-[#111827]">
              {t("mealPlans") || "Meal plans"}
            </h3>
            <p className="text-xs font-bold text-[#111827]/75 mt-0.5">{t("allTime") || "All time"}</p>
          </div>
          <div className="bg-white border-2 border-[#111827] rounded-xl p-2.5">
            <BarChart data={stats.dietCounts} />
          </div>
          <div>
            <span className="block text-[10px] font-black tracking-[0.12em] text-[#111827]/75">{t("total") || "TOTAL"}</span>
            <span className="font-heading text-2xl font-black tabular-nums text-[#111827]">{stats.count}</span>
          </div>
        </article>

        {/* Avg budget + line chart */}
        <article className="bba-t bg-[#7DD3FC] flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-[#111827]">
              {t("avgBudget") || "Avg budget"}
            </h3>
            <p className="text-xs font-bold text-[#111827]/75 mt-0.5">{t("perPlan") || "Per plan"}</p>
          </div>
          <div className="bg-white border-2 border-[#111827] rounded-xl p-2.5">
            <LineChart data={stats.budgetSeries} />
          </div>
          <div>
            <span className="block text-[10px] font-black tracking-[0.12em] text-[#111827]/75">{t("average") || "AVG"}</span>
            <span className="font-heading text-2xl font-black tabular-nums text-[#111827]">€{formatNumber(avgBudget, 0)}</span>
          </div>
        </article>
      </div>

      {/* Recent plans — activity feed */}
      <section className="bba-t bg-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-black text-[#111827]">
            {t("recentPlans") || "Recent plans"}
          </h2>
          {plans.length > 0 && (
            <Link to="/saved-plans" className="text-xs font-extrabold text-[#111827] bg-[#78a71b] border-2 border-[#111827] px-3 py-1 rounded-full shadow-[2px_2px_0_#111827] flex items-center gap-1">
              {t("viewAll") || "View all"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-t-2 border-[#111827]/15 py-3 h-12 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="border-2 border-dashed border-[#111827]/40 rounded-2xl p-6 text-center space-y-2 bg-[#F3F8E6]">
            <div className="h-11 w-11 rounded-2xl bg-[#78a71b] border-2 border-[#111827] flex items-center justify-center mx-auto shadow-[2px_2px_0_#111827]">
              <Calendar className="h-5 w-5 text-[#111827]" />
            </div>
            <p className="text-sm font-bold text-[#111827]">
              {t("noRecentPlans") || "No saved plans yet — create your first one below."}
            </p>
          </div>
        ) : (
          <ul className="m-0 p-0 list-none divide-y-2 divide-[#111827]/15">
            {plans.map((plan, i) => (
              <motion.li
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] }}
              >
                <Link
                  to="/saved-plans"
                  className="group grid items-center gap-2 py-3 hover:bg-[#F3F8E6] px-2 -mx-2 rounded-xl transition-colors"
                  style={{ gridTemplateColumns: "1fr auto" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-[#111827] shrink-0" />
                      <span className="font-heading font-black text-sm leading-tight line-clamp-1 text-[#111827]">{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-[#1f2937] mt-1 flex-wrap pl-6">
                      {plan.diet && <span className="bg-[#78a71b] border border-[#111827] px-1.5 py-0.2 rounded-md text-[#111827]">{plan.diet}</span>}
                      {plan.budget != null && <span className="flex items-center gap-0.5"><Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}</span>}
                      {plan.days != null && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{plan.days}d</span>}
                      {plan.calories != null && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{plan.calories}</span>}
                      <span className="text-[#1f2937]/70">· {timeAgo(plan.created_date)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#111827] bg-[#FFB020] border-2 border-[#111827] px-2.5 py-1 rounded-full shadow-[2px_2px_0_#111827] shrink-0 flex items-center gap-1">
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
      <div className="grid grid-cols-1 gap-3.5">
        <Link
          to="/budget"
          className="bba-t bg-[#FF3E7F] text-white flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-white border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center shrink-0">
            <Plus className="h-6 w-6 text-[#111827]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-black text-lg text-white">{t("createNewPlan") || "Create a new plan"}</h3>
            <p className="text-xs sm:text-sm text-white/90 truncate font-medium">
              {t("planSubtitle") || "Set your budget and preferences to get a personalized meal plan."}
            </p>
          </div>
        </Link>
        <Link
          to="/community"
          className="bba-t bg-[#FFB020] text-[#111827] flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-white border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-[#111827]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-black text-lg text-[#111827]">{t("browseCommunityTitle") || "Browse community plans"}</h3>
            <p className="text-xs sm:text-sm text-[#111827]/85 truncate font-medium">
              {t("browseCommunityDesc") || "Discover grocery lists and meal plans shared by others."}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}