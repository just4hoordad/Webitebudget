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
    <div className="space-y-5">
      <div className="bba-t bg-[#FF3E7F] text-white space-y-2">
        <span className="bba-sticker">Budget Mode</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-white">{m.budgetTitle}</h1>
        <p className="text-sm text-white/90 font-medium">{m.budgetDesc}</p>
        <CreditBar className="mt-3" />
      </div>
      <LastResultButton kind="budget" className="w-full" />
      <div id="plan-form">
        <BudgetForm />
      </div>
      <AdSlot layout="fixed-height" style={{ minHeight: 90 }} />
    </div>
  );
}