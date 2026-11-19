import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useMonetization } from "@/lib/MonetizationContext";
import CommunityPlanCard from "@/components/community/CommunityPlanCard";
import CommunityPlanDetail from "@/components/community/CommunityPlanDetail";
import CommunityProLock from "@/components/community/CommunityProLock";
import ProLockBadge from "@/components/monetization/ProLockBadge";
import { Users, Loader2, LogIn, Lock } from "lucide-react";
import { motion } from "framer-motion";

const DIET_FILTERS = [
  { id: "balanced", nameKey: "balanced", emoji: "⚖️" },
  { id: "vegetarian", nameKey: "vegetarian", emoji: "🥬" },
  { id: "vegan", nameKey: "vegan", emoji: "🌱" },
  { id: "high-protein", nameKey: "highProtein", emoji: "💪" },
  { id: "pescatarian", nameKey: "pescatarian", emoji: "🐟" },
  { id: "gluten-free", nameKey: "glutenFree", emoji: "🌾" },
  { id: "halal", nameKey: "halal", emoji: "✨" },
  { id: "frozen", nameKey: "frozenFoods", emoji: "❄️" },
];

export default function Community() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const { isPro, openPricing } = useMonetization();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dietFilter, setDietFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const loadPlans = async (diet = dietFilter) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getCommunityPlans", { diet: diet || undefined });
      setPlans(res.data?.items || []);
    } catch (e) {
      setError(e?.data?.error || (t("loadError") || "Failed to load community plans"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadPlans("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Free users see a locked paywall (subscription bait) — still load plans for the blurred preview.
  if (isAuthenticated && !isPro) {
    return (
      <CommunityProLock plans={plans} onUpgrade={openPricing} />
    );
  }

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bba-t bba-locked-arcade border-[3px] border-[#111827] text-center space-y-4 py-8 px-6">
          <div className="h-14 w-14 rounded-2xl bg-[#FFB020] border-[3px] border-[#111827] shadow-[3px_3px_0_#000] flex items-center justify-center mx-auto relative">
            <Users className="h-7 w-7 text-[#111827]" />
            <span className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-[#111827] border-2 border-[#FFB020] flex items-center justify-center">
              <Lock className="h-3 w-3 text-[#FFB020]" />
            </span>
          </div>
          <div>
            <ProLockBadge label="PRO ARCADE STAGE" size="sm" onClick={openPricing} />
          </div>
          <h1 className="font-heading text-xl font-black text-[#F3F8E6]">
            {t("communityLoginNeeded") || "Sign in to browse community plans"}
          </h1>
          <p className="text-sm text-[#F3F8E6]/75">
            {t("communityLoginDesc") || "Discover grocery lists and meal plans shared by other BudgetBite users. Available on Premium."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              onClick={navigateToLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#78a71b] text-[#111827] border-2 border-[#111827] shadow-[3px_3px_0_#000] rounded-full px-6 py-2.5 font-heading font-black text-sm"
            >
              <LogIn className="h-4 w-4" />
              {t("signInNav") || "Sign in"}
            </button>
            <button
              type="button"
              onClick={openPricing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#FFB020] text-[#111827] border-2 border-[#111827] shadow-[3px_3px_0_#FF3E7F] rounded-full px-5 py-2.5 font-heading font-black text-sm"
            >
              <Lock className="h-3.5 w-3.5" />
              View Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Animated Community Header */}
      <div className="bba-t bg-[#7DD3FC] text-[#111827] space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5 min-w-0">
            <span className="bba-sticker">
              <Users className="h-3.5 w-3.5" /> {t("communityNav") || "Community"}
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-[#111827]">
              {t("communityTitle") || "Community plans"}
            </h1>
            <p className="text-sm font-medium text-[#111827]/85">
              {t("communitySubtitle") || "Browse grocery lists and meal plans shared by other users."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex -space-x-2">
              {["#78a71b", "#FF3E7F", "#FFB020", "#C084FC"].map((c, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, y: 6 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 400, damping: 18 }}
                  className="h-8 w-8 rounded-full border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] flex items-center justify-center text-sm"
                  style={{ backgroundColor: c }}
                >
                  {["🥑", "🍳", "🍝", "🥗"][i]}
                </motion.span>
              ))}
            </div>
            <span className="inline-flex items-center gap-1 bg-white border-2 border-[#111827] rounded-full px-2.5 py-1 text-[11px] font-heading font-black shadow-[2px_2px_0_#111827] text-[#111827]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3E7F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3E7F]" />
              </span>
              {plans.length} {t("planPlural") || "plans"}
            </span>
          </div>
        </div>
      </div>

      {/* Diet filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        <button
          type="button"
          onClick={() => { setDietFilter(""); loadPlans(""); }}
          className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-heading font-black border-[2.5px] border-[#111827] transition-all ${
            dietFilter === "" ? "bg-[#78a71b] text-[#111827] shadow-[3px_3px_0_#111827] -translate-y-0.5" : "bg-card text-foreground hover:bg-secondary/70 shadow-[2px_2px_0_#111827]"
          }`}
        >
          ✨ {t("allDiets") || "All"}
        </button>
        {DIET_FILTERS.map((d) => {
          const sel = dietFilter === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => { setDietFilter(d.id); loadPlans(d.id); }}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-heading font-black border-[2.5px] border-[#111827] transition-all ${
                sel ? "bg-[#78a71b] text-[#111827] shadow-[3px_3px_0_#111827] -translate-y-0.5" : "bg-card text-foreground hover:bg-secondary/70 shadow-[2px_2px_0_#111827]"
              }`}
            >
              {d.emoji} {t(d.nameKey) || d.id}
            </button>
          );
        })}
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bba-t bg-card h-40 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-destructive">{error}</div>
      ) : plans.length === 0 ? (
        <div className="bba-t bg-[#78a71b] text-[#111827] p-8 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center">
            <Users className="h-7 w-7 text-[#111827]" />
          </div>
          <p className="text-[#111827] font-semibold text-sm">
            {t("communityEmpty") || "No community plans yet. Be the first to share!"}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <CommunityPlanCard plan={plan} onOpen={(p) => setSelectedId(p.id)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <CommunityPlanDetail
        planId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}