import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import CommunityPlanCard from "@/components/community/CommunityPlanCard";
import CommunityPlanDetail from "@/components/community/CommunityPlanDetail";
import { Users, Loader2, LogIn, Search } from "lucide-react";

export default function Community() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
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

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold">
          {t("communityLoginNeeded") || "Sign in to browse community plans"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("communityLoginDesc") || "Discover grocery lists and meal plans shared by other BudgetBite users. Log in to start exploring."}
        </p>
        <button
          onClick={navigateToLogin}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-semibold text-sm hover:opacity-95 transition-opacity"
        >
          <LogIn className="h-4 w-4" />
          {t("signInNav") || "Sign in"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-2 text-xs font-heading font-semibold tracking-[0.18em] uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
          <Users className="h-3.5 w-3.5" />
          {t("communityNav") || "Community"}
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("communityTitle") || "Community plans"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("communitySubtitle") || "Browse grocery lists and meal plans shared by other users."}
        </p>
      </div>

      {/* Diet filter */}
      <div className="flex gap-2">
        <select
          value={dietFilter}
          onChange={(e) => {
            setDietFilter(e.target.value);
            loadPlans(e.target.value);
          }}
          className="flex-1 px-3 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t("allDiets") || "All diets"}</option>
          <option value="balanced">{t("balanced") || "Balanced"}</option>
          <option value="vegetarian">{t("vegetarian") || "Vegetarian"}</option>
          <option value="vegan">{t("vegan") || "Vegan"}</option>
          <option value="high-protein">{t("highProtein") || "High-protein"}</option>
          <option value="pescatarian">{t("pescatarian") || "Pescatarian"}</option>
          <option value="gluten-free">{t("glutenFree") || "Gluten-free"}</option>
          <option value="halal">{t("halal") || "Halal"}</option>
          <option value="frozen">{t("frozenFoods") || "Frozen"}</option>
        </select>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-destructive">{error}</div>
      ) : plans.length === 0 ? (
        <div className="bba-t bg-[#A3E635] p-8 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-white border-3 border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center">
            <Users className="h-7 w-7 text-[#111827]" />
          </div>
          <p className="text-muted-foreground text-sm">
            {t("communityEmpty") || "No community plans yet. Be the first to share!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <CommunityPlanCard key={plan.id} plan={plan} onOpen={(p) => setSelectedId(p.id)} />
          ))}
        </div>
      )}

      <CommunityPlanDetail
        planId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}