import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, ShoppingCart, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { filledDishes } from "@/lib/planDishes";

const TYPES = ["breakfast", "lunch", "dinner"];
const FACT_BGS = ["bg-[#78a71b]", "bg-[#FFB020]", "bg-[#FF8FB5]", "bg-[#7DD3FC]", "bg-[#C084FC]", "bg-[#F3F8E6]"];

export default function PlanConfirm({ plan, people, diet, stores, prepEnabled, onBack, onConfirm }) {
  const { t } = useLanguage();
  const L = (k, fb) => { const v = t(k); return v === k || !v ? fb : v; };
  const total = plan.reduce((n, day) => n + TYPES.reduce((m, ty) => m + filledDishes(day, ty).length, 0), 0);
  const facts = [
    [L("days", "Days"), plan.length],
    [L("people", "People"), people],
    [L("diet", "Diet"), diet ? L(diet, diet) : "–"],
    [L("dishes", "Dishes"), total],
    [L("storesSection", "Stores"), stores?.length ? stores.join(", ") : "–"],
    [L("prepGuide", "Prep guide"), prepEnabled ? "✓ ON" : "–"],
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#111827] bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] rounded-full px-3.5 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {L("editPlan", "Edit my meals")}
      </button>

      <div className="bba-t bg-[#7DD3FC] text-[#111827] space-y-1.5">
        <span className="bba-sticker">
          <Sparkles className="h-3.5 w-3.5" /> Ready Check
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#111827]">
          {L("confirmPlanTitle", "Confirm your meal plan")}
        </h2>
        <p className="text-sm font-medium text-[#111827]/85">
          {L("confirmPlanDesc", "Check your dishes below. Once you confirm, we calculate every ingredient you need, combine the quantities and turn them into one priced grocery list for your stores.")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {facts.map(([k, v], idx) => (
          <div
            key={k}
            className={`${FACT_BGS[idx % FACT_BGS.length]} text-[#111827] border-[2.5px] border-[#111827] rounded-2xl px-3.5 py-3 shadow-[3px_3px_0_#111827]`}
          >
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-[#111827]/75">{k}</p>
            <p className="text-base font-heading font-black text-[#111827] truncate mt-0.5">{v}</p>
          </div>
        ))}
      </div>

      <div className="bba-t bg-card p-0 overflow-hidden divide-y-2 divide-[#111827]/15">
        {plan.map((day, i) => (
          <div key={i} className="px-4 py-3.5">
            <span className="inline-block font-heading font-black text-xs bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full mb-2">
              {L("day", "Day")} {i + 1}
            </span>
            {TYPES.map((ty) => {
              const dishes = filledDishes(day, ty);
              return (
                <div key={ty} className="flex gap-3 text-sm py-0.5">
                  <span className="w-24 shrink-0 font-heading font-bold text-muted-foreground">{L(ty, ty)}</span>
                  <span className={dishes.length ? "font-semibold text-foreground" : "font-bold text-destructive"}>
                    {dishes.length ? dishes.map((d) => d.name).join(", ") : L("noMealSet", "Nothing planned")}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs font-bold text-muted-foreground px-1">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        {L("confirmPlanHint", "Empty meals are skipped. Go back if anything is missing or wrong.")}
      </div>

      <Button onClick={onConfirm} disabled={total === 0} variant="destructive" className="w-full h-14 text-base">
        <ShoppingCart className="h-5 w-5" /> {L("confirmAndGenerate", "Confirm & generate grocery list")} <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}