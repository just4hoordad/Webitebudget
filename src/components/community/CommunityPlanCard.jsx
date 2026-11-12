import { Leaf, Wallet, Calendar, Users, ShoppingBasket, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function CommunityPlanCard({ plan, onOpen }) {
  const { t } = useLanguage();
  return (
    <button
      onClick={() => onOpen(plan)}
      className="bba-t text-left bg-card p-5 space-y-3 group w-full"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <Leaf className="h-3 w-3" />
          {plan.diet || (t("balanced") || "Balanced")}
        </span>
        {plan.totalCost != null && (
          <span className="text-xs font-bold text-foreground">€{Number(plan.totalCost).toFixed(2)}</span>
        )}
      </div>
      <h3 className="font-heading font-bold text-foreground text-base leading-tight line-clamp-2">
        {plan.name}
      </h3>
      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
        {plan.budget != null && (
          <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}</span>
        )}
        {plan.days != null && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{plan.days} {t("days") || "days"}</span>}
        {plan.itemCount > 0 && <span className="flex items-center gap-1"><ShoppingBasket className="h-3 w-3" />{plan.itemCount} {t("items") || "items"}</span>}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{plan.ownerDisplayName}</span>
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all shrink-0">
          {t("viewPlan") || "View"}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}