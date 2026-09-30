import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { filledDishes } from "@/lib/planDishes";

const TYPES = ["breakfast", "lunch", "dinner"];

export default function PlanConfirm({ plan, people, diet, stores, prepEnabled, onBack, onConfirm }) {
  const { t } = useLanguage();
  const L = (k, fb) => { const v = t(k); return v === k || !v ? fb : v; };
  const total = plan.reduce((n, day) => n + TYPES.reduce((m, ty) => m + filledDishes(day[ty]).length, 0), 0);
  const facts = [
    [L("days", "Days"), plan.length],
    [L("people", "People"), people],
    [L("diet", "Diet"), diet ? L(diet, diet) : "–"],
    [L("dishes", "Dishes"), total],
    [L("storesSection", "Stores"), stores?.length ? stores.join(", ") : "–"],
    [L("prepGuide", "Prep guide"), prepEnabled ? "✓" : "–"],
  ];

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {L("editPlan", "Edit my meals")}
      </button>
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">{L("confirmPlanTitle", "Confirm your meal plan")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {L("confirmPlanDesc", "Check your dishes below. Once you confirm, we calculate every ingredient you need, combine the quantities and turn them into one priced grocery list for your stores.")}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {facts.map(([k, v]) => (
          <div key={k} className="bg-card border border-border rounded-xl px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="text-sm font-semibold text-foreground truncate">{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {plan.map((day, i) => (
          <div key={i} className="px-4 py-3">
            <p className="font-heading font-semibold text-sm text-foreground mb-1.5">{L("day", "Day")} {i + 1}</p>
            {TYPES.map((ty) => {
              const dishes = filledDishes(day[ty]);
              return (
                <div key={ty} className="flex gap-3 text-sm py-0.5">
                  <span className="w-24 shrink-0 text-muted-foreground">{L(ty, ty)}</span>
                  <span className={dishes.length ? "text-foreground" : "text-destructive"}>
                    {dishes.length ? dishes.map((d) => d.name).join(", ") : L("noMealSet", "Nothing planned")}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        {L("confirmPlanHint", "Empty meals are skipped. Go back if anything is missing or wrong.")}
      </div>
      <Button onClick={onConfirm} disabled={total === 0} className="w-full h-14 text-base font-heading font-semibold rounded-xl">
        <ShoppingCart className="h-5 w-5" /> {L("confirmAndGenerate", "Confirm & generate grocery list")} <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}