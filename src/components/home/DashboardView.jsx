import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useMonetization } from "@/lib/MonetizationContext";
import { base44 } from "@/api/base44Client";
import CreditBar from "@/components/monetization/CreditBar";
import ProLockBadge from "@/components/monetization/ProLockBadge";
import {
  Plus, Users, ArrowRight, Leaf, Wallet, Calendar, Flame, TrendingUp,
  Trophy, ChefHat, Package, Utensils, Sparkles,
} from "lucide-react";
import { useCountUp, formatNumber, timeAgo } from "@/components/dashboard/useCountUp";
import ProgressRing from "@/components/dashboard/ProgressRing";
import BarChart from "@/components/dashboard/BarChart";
import LineChart from "@/components/dashboard/LineChart";

function getPlayerRank(planCount) {
  if (planCount >= 10) return { level: 4, title: "Budget Legend", nextAt: 15, color: "bg-[#FFB020]" };
  if (planCount >= 5) return { level: 3, title: "Meal Architect", nextAt: 10, color: "bg-[#C084FC]" };
  if (planCount >= 2) return { level: 2, title: "Flyer Scout", nextAt: 5, color: "bg-[#7DD3FC]" };
  return { level: 1, title: "Rookie Saver", nextAt: 2, color: "bg-[#78a71b]" };
}

export default function DashboardView() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isPro } = useMonetization();
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ count: 0, totalBudget: 0, dietCounts: [], budgetSeries: [] });
  const [loading, setLoading] = useState(true);
  const [highFives, setHighFives] = useState(0);

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
  const rank = getPlayerRank(stats.count);
  const xpProgress = Math.min(100, Math.round((stats.count / rank.nextAt) * 100));

  return (
    <div className="flex flex-col gap-4 text-[#111827]">
      {/* Player Header Bento Tile */}
      <header className="bba-t bg-card text-card-foreground flex flex-col gap-4 relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bba-sticker">
                <Trophy className="h-3.5 w-3.5 text-[#FFB020]" /> Player Hub
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full ${rank.color} text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827]`}>
                LVL {rank.level} · {rank.title}
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight leading-tight text-foreground">
              {t("welcomeBack") || "Welcome back"}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {t("dashboardSubtitle") || "Pick up where you left off or start something new."}
            </p>
          </div>
          <CreditBar variant="onLight" />
        </div>

        {/* XP Rank Progress Bar */}
        <div className="rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] p-3 flex flex-col sm:flex-row sm:items-center gap-2.5 shadow-[2px_2px_0_#111827]">
          <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
            <span className="text-xs font-heading font-black uppercase tracking-wider text-[#111827] dark:text-foreground">
              ⚡ Quest XP
            </span>
            <span className="text-xs font-heading font-bold text-[#111827]/75 dark:text-muted-foreground tabular-nums">
              {stats.count}/{rank.nextAt} {t("planPlural") || "plans"}
            </span>
          </div>
          <div className="h-3 flex-1 rounded-full bg-white border-2 border-[#111827] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(xpProgress, 8)}%` }}
              transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
              className="h-full bg-[#78a71b] bba-progress-stripes rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Top Asymmetric Bento Row: Featured Budget Vault + Chef Arcade Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-[1.35fr_1fr] gap-4">
        {/* Featured stat tile: total budget + ring */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bba-t bg-[#78a71b] flex items-center justify-between gap-4"
        >
          <div className="min-w-0 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-heading font-black tracking-[0.1em] uppercase bg-white/80 text-[#111827] px-2.5 py-0.5 rounded-full border-2 border-[#111827]">
              💰 {t("totalPlanned") || "Total planned"}
            </span>
            <span className="block font-heading text-4xl sm:text-5xl font-black tabular-nums leading-none pt-1 text-[#111827]">
              €{formatNumber(animatedBudget, 0)}
            </span>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-[#111827] font-extrabold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#111827] shrink-0" />
                {stats.count} {stats.count === 1 ? (t("planSingular") || "plan") : (t("planPlural") || "plans")}
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.88, rotate: -6 }}
                onClick={() => setHighFives((n) => n + 1)}
                className="text-[11px] font-heading font-black bg-[#FFB020] text-[#111827] border-2 border-[#111827] rounded-full px-2.5 py-0.5 shadow-[2px_2px_0_#111827] cursor-pointer"
              >
                🙌 Boost {highFives > 0 ? `×${highFives}` : ""}
              </motion.button>
            </div>
          </div>
          <div className="bg-white border-[3px] border-[#111827] rounded-2xl p-2.5 shadow-[3px_3px_0_#111827] shrink-0">
            <ProgressRing percent={ringPercent} trackClass="text-[#111827]/15" labelClass="text-[#111827]" />
          </div>
        </motion.div>

        {/* Chef Power-Ups Tile */}
        <div className="bba-t bg-[#C084FC] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-black tracking-wider uppercase text-[#111827] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Power-Up Shortcuts
            </h3>
            <span className="text-[10px] font-heading font-black bg-white border-2 border-[#111827] px-2 py-0.5 rounded-full text-[#111827]">
              3 Tools
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/plan-builder"
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border-2 border-[#111827] p-2.5 text-[#111827] shadow-[2.5px_2.5px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#111827] transition-all"
            >
              <Utensils className="h-5 w-5 text-[#78a71b]" />
              <span className="text-[11px] font-heading font-extrabold text-center leading-tight">Meal Deck</span>
            </Link>
            <Link
              to="/recipes"
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border-2 border-[#111827] p-2.5 text-[#111827] shadow-[2.5px_2.5px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#111827] transition-all"
            >
              <ChefHat className="h-5 w-5 text-[#FF3E7F]" />
              <span className="text-[11px] font-heading font-extrabold text-center leading-tight">{t("recipesTitle") || "Recipes"}</span>
            </Link>
            <Link
              to="/pantry"
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white border-2 border-[#111827] p-2.5 text-[#111827] shadow-[2.5px_2.5px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#111827] transition-all"
            >
              <Package className="h-5 w-5 text-[#FFB020]" />
              <span className="text-[11px] font-heading font-extrabold text-center leading-tight">Pantry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Bento HUD Chart Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Meal plans + bar chart */}
        <motion.article whileHover={{ y: -3 }} className="bba-t bg-[#FF8FB5] flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-heading font-black tracking-wider uppercase text-[#111827]">
                {t("mealPlans") || "Meal plans"}
              </h3>
              <p className="text-xs font-bold text-[#111827]/75 mt-0.5">{t("allTime") || "All time"}</p>
            </div>
            <span className="font-heading text-2xl font-black tabular-nums bg-white border-2 border-[#111827] rounded-xl px-2.5 py-0.5 shadow-[2px_2px_0_#111827] text-[#111827]">
              {stats.count}
            </span>
          </div>
          <div className="bg-white border-[2.5px] border-[#111827] rounded-2xl p-3 shadow-[2px_2px_0_#111827]">
            <BarChart data={stats.dietCounts} />
          </div>
        </motion.article>

        {/* Avg budget + line chart */}
        <motion.article whileHover={{ y: -3 }} className="bba-t bg-[#7DD3FC] flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-heading font-black tracking-wider uppercase text-[#111827]">
                {t("avgBudget") || "Avg budget"}
              </h3>
              <p className="text-xs font-bold text-[#111827]/75 mt-0.5">{t("perPlan") || "Per plan"}</p>
            </div>
            <span className="font-heading text-2xl font-black tabular-nums bg-white border-2 border-[#111827] rounded-xl px-2.5 py-0.5 shadow-[2px_2px_0_#111827] text-[#111827]">
              €{formatNumber(avgBudget, 0)}
            </span>
          </div>
          <div className="bg-white border-[2.5px] border-[#111827] rounded-2xl p-3 shadow-[2px_2px_0_#111827]">
            <LineChart data={stats.budgetSeries} />
          </div>
        </motion.article>
      </div>

      {/* Recent plans — Quest Log Feed */}
      <section className="bba-t bg-card text-card-foreground flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-[#FFB020] border-2 border-[#111827] flex items-center justify-center shadow-[2px_2px_0_#111827] text-[#111827]">
              <Calendar className="h-4 w-4" />
            </span>
            <h2 className="font-heading text-lg font-black text-foreground">
              {t("recentPlans") || "Recent plans"}
            </h2>
          </div>
          {plans.length > 0 && (
            <Link
              to="/saved-plans"
              className="text-xs font-heading font-extrabold text-[#111827] bg-[#78a71b] border-2 border-[#111827] px-3 py-1.5 rounded-full shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform flex items-center gap-1"
            >
              {t("viewAll") || "View all"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-[#111827]/15 bg-muted/50 h-16 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="border-[2.5px] border-dashed border-[#111827]/40 dark:border-[#78a71b]/40 rounded-2xl p-6 text-center space-y-2.5 bg-[#F3F8E6] dark:bg-secondary">
            <div className="h-12 w-12 rounded-2xl bg-[#78a71b] border-2 border-[#111827] flex items-center justify-center mx-auto shadow-[3px_3px_0_#111827]">
              <Calendar className="h-5 w-5 text-[#111827]" />
            </div>
            <p className="text-sm font-heading font-extrabold text-[#111827] dark:text-foreground">
              {t("noRecentPlans") || "No saved plans yet — create your first one below."}
            </p>
          </div>
        ) : (
          <ul className="m-0 p-0 list-none space-y-2.5">
            {plans.map((plan, i) => (
              <motion.li
                key={plan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.33, 1, 0.68, 1] }}
              >
                <Link
                  to="/saved-plans"
                  className="group flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] shadow-[3px_3px_0_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#111827] transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-[#78a71b] border border-[#111827] flex items-center justify-center shrink-0">
                        <Leaf className="h-3.5 w-3.5 text-[#111827]" />
                      </span>
                      <span className="font-heading font-black text-sm leading-tight line-clamp-1 text-[#111827] dark:text-foreground">
                        {plan.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#111827]/80 dark:text-muted-foreground mt-1.5 flex-wrap pl-8">
                      {plan.diet && (
                        <span className="bg-white text-[#111827] border border-[#111827] px-2 py-0.5 rounded-full font-heading font-extrabold">
                          {plan.diet}
                        </span>
                      )}
                      {plan.budget != null && (
                        <span className="inline-flex items-center gap-0.5 bg-[#FFB020]/30 text-[#111827] dark:text-foreground px-2 py-0.5 rounded-full">
                          <Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}
                        </span>
                      )}
                      {plan.days != null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Calendar className="h-3 w-3" />{plan.days}d
                        </span>
                      )}
                      {plan.calories != null && (
                        <span className="inline-flex items-center gap-0.5">
                          <Flame className="h-3 w-3" />{plan.calories}
                        </span>
                      )}
                      <span className="opacity-70">· {timeAgo(plan.created_date)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-heading font-black text-[#111827] bg-[#FFB020] border-2 border-[#111827] px-3 py-1.5 rounded-full shadow-[2px_2px_0_#111827] shrink-0 flex items-center gap-1 group-hover:bg-[#78a71b] transition-colors">
                    {t("continue") || "Continue"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick Launch Arcade Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/budget"
          className="bba-t bg-[#FF3E7F] text-white flex items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-white border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center shrink-0">
            <Plus className="h-6 w-6 text-[#111827]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-heading font-black uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full">
              New Quest
            </span>
            <h3 className="font-heading font-black text-lg text-white mt-0.5">{t("createNewPlan") || "Create a new plan"}</h3>
            <p className="text-xs sm:text-sm text-white/90 line-clamp-2 font-medium">
              {t("planSubtitle") || "Set your budget and preferences to get a personalized meal plan."}
            </p>
          </div>
        </Link>

        <Link
          to="/community"
          className={`bba-t flex items-center gap-4 ${
            isPro
              ? "bg-[#FFB020] text-[#111827]"
              : "bba-locked-arcade border-[#111827] dark:border-[#FFB020]/70"
          }`}
        >
          <div
            className={`h-12 w-12 rounded-2xl border-[3px] flex items-center justify-center shrink-0 ${
              isPro
                ? "bg-white border-[#111827] shadow-[3px_3px_0_#111827] text-[#111827]"
                : "bg-[#111827] border-[#FFB020] shadow-[3px_3px_0_#000] text-[#FFB020]"
            }`}
          >
            <Users className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isPro
                    ? "bg-white/60 border border-[#111827] text-[#111827]"
                    : "bg-white/10 border border-white/20 text-[#F3F8E6]/80"
                }`}
              >
                Multiplayer
              </span>
              {!isPro && <ProLockBadge label="PRO STAGE" size="xs" />}
            </div>
            <h3 className={`font-heading font-black text-lg mt-0.5 ${isPro ? "text-[#111827]" : "text-[#F3F8E6]"}`}>
              {t("browseCommunityTitle") || "Browse community plans"}
            </h3>
            <p className={`text-xs sm:text-sm line-clamp-2 font-medium ${isPro ? "text-[#111827]/85" : "text-[#F3F8E6]/70"}`}>
              {t("browseCommunityDesc") || "Discover grocery lists and meal plans shared by others."}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}