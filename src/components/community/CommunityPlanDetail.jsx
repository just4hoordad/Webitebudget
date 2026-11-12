import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Leaf, Wallet, Calendar, Users, ShoppingBasket, Loader2, X } from "lucide-react";

export default function CommunityPlanDetail({ planId, open, onClose }) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !planId) return;
    setLoading(true);
    setError("");
    base44.functions
      .invoke("getCommunityPlans", { planId })
      .then((res) => {
        setDetail(res.data);
      })
      .catch((e) => {
        setError(e?.data?.error || (t("loadError") || "Failed to load plan"));
      })
      .finally(() => setLoading(false));
  }, [open, planId]);

  const plan = detail?.plan;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{plan?.name || (t("communityTitle") || "Community plan")}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-sm text-destructive">{error}</div>
        ) : plan ? (
          <div className="space-y-5">
            {/* Owner + meta */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{detail.ownerDisplayName}</span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs font-semibold">
                <Leaf className="h-3 w-3" />{plan.diet}
              </span>
              {plan.budget != null && <span className="flex items-center gap-1"><Wallet className="h-4 w-4" />€{Number(plan.budget).toFixed(2)}</span>}
              {plan.days != null && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{plan.days} {t("days") || "days"}</span>}
              {plan.calories != null && <span>{plan.calories} kcal/day</span>}
              {plan.people != null && <span>{plan.people} {t("personS") || "person(s)"}</span>}
            </div>
            {plan.stores && (
              <p className="text-xs text-muted-foreground"><strong>{t("stores") || "Stores"}:</strong> {plan.stores}</p>
            )}

            {/* Grocery list */}
            {plan.groceryList?.categories?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4 text-primary" />
                  {t("yourGroceryList") || "Grocery list"}
                  <span className="text-xs text-muted-foreground font-normal">· €{plan.groceryList.total_estimated_cost?.toFixed?.(2) ?? Number(plan.groceryList.total_estimated_cost || 0).toFixed(2)}</span>
                </h3>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {plan.groceryList.categories.map((cat, ci) => (
                    <div key={ci} className="bg-card">
                      <div className="bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {cat.name} · {cat.items?.length || 0} {t("items") || "items"}
                      </div>
                      {cat.items?.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between px-3 py-1.5 text-sm border-t border-border">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} · {item.store}</p>
                          </div>
                          <span className="font-semibold text-foreground shrink-0 ml-2">€{Number(item.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal plan overview */}
            {Array.isArray(plan.plan) && plan.plan.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-sm">{t("yourWeeklyMealPlan") || "Meal plan"}</h3>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {plan.plan.slice(0, 7).map((day, di) => {
                    const meals = ["breakfast", "lunch", "dinner"]
                      .map((m) => (typeof day[m] === "string" ? day[m] : Array.isArray(day[m]) ? day[m].join(", ") : day[m]?.name || ""))
                      .filter(Boolean);
                    return (
                      <div key={di} className="px-3 py-2 text-sm">
                        <span className="font-semibold text-xs text-muted-foreground">{t("day") || "Day"} {di + 1}</span>
                        {meals.length > 0 && <p className="text-foreground text-xs mt-0.5">{meals.join(" · ")}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}