import BudgetForm from "@/components/BudgetForm";
import AdSlot from "@/components/ads/AdSlot";
import CreditBar from "@/components/monetization/CreditBar";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";

export default function BudgetPlanner() {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">{m.budgetTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{m.budgetDesc}</p>
        <CreditBar className="mt-3" />
      </div>
      <div id="plan-form">
        <BudgetForm />
      </div>
      <AdSlot layout="fixed-height" style={{ minHeight: 90 }} />
    </div>
  );
}