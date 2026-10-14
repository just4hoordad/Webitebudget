import BudgetForm from "@/components/BudgetForm";
import AdSlot from "@/components/ads/AdSlot";
import CreditBar from "@/components/monetization/CreditBar";
import LastResultButton from "@/components/LastResultButton";

export default function BudgetPlanner() {
  return (
    <div className="space-y-4">
      <CreditBar />
      <LastResultButton kind="budget" className="w-full" />
      <div id="plan-form">
        <BudgetForm />
      </div>
      <AdSlot layout="fixed-height" style={{ minHeight: 90 }} />
    </div>
  );
}