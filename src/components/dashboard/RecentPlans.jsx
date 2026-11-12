import { Link } from "react-router-dom";
import { Leaf, Wallet, ArrowRight, Calendar, Flame } from "lucide-react";
import { timeAgo } from "./useCountUp";

// Prominent recent-plans feed — each plan is a large, clickable row that
// links to Saved Plans where the user can pick up where they left off.
export default function RecentPlans({ plans, loading, t }) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!plans.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm">
          {t("noRecentPlans") || "No saved plans yet — create your first one below."}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {plans.map((plan) => (
        <Link
          key={plan.id}
          to="/saved-plans"
          className="group bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Leaf className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-bold text-foreground text-sm leading-tight line-clamp-1">
              {plan.name}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              {plan.diet && <span className="font-medium text-foreground/80">{plan.diet}</span>}
              {plan.budget != null && (
                <span className="flex items-center gap-0.5">
                  <Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}
                </span>
              )}
              {plan.days != null && <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{plan.days}d</span>}
              {plan.calories != null && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3" />{plan.calories}</span>}
              <span className="text-muted-foreground/70">· {timeAgo(plan.created_date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary shrink-0 group-hover:gap-2 transition-all">
            {t("continue") || "Continue"}
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}