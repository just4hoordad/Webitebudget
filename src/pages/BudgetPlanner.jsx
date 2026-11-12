import BudgetForm from "@/components/BudgetForm";
import AdSlot from "@/components/ads/AdSlot";
import CreditBar from "@/components/monetization/CreditBar";
import LastResultButton from "@/components/LastResultButton";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";

export default function BudgetPlanner() {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">{m.budgetTitle}</h1>
        <p className="text-sm text-muted-foreground">{m.budgetDesc}</p>
        <CreditBar className="mt-3" />
        <LastResultButton kind="budget" className="mt-3 w-full" />
      </div>
      <div id="plan-form">
        <BudgetForm />
      </div>
      <AdSlot layout="fixed-height" style={{ minHeight: 90 }} />
    </div>
  );
}