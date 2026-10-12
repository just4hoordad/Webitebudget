import { Link, useLocation } from "react-router-dom";
import { History } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getLastBudget, getLastPlan } from "@/lib/lastResult";

const L = {
  en: { budget: "Show my last budget list", plan: "Show my last plan list" },
  de: { budget: "Meine letzte Budget-Liste", plan: "Meine letzte Plan-Liste" },
};

export default function LastResultButton({ kind, className = "" }) {
  const { currentLanguage } = useLanguage();
  useLocation(); // re-check storage on every navigation
  const s = L[currentLanguage?.code] || L.en;
  const budgetSearch = kind === "budget" ? getLastBudget() : null;
  const hasPlan = kind === "plan" && !!getLastPlan();
  if (!budgetSearch && !hasPlan) return null;
  const to = kind === "budget" ? `/meal-plan${budgetSearch}` : "/plan-builder?last=1";
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 text-primary px-4 py-2.5 text-sm font-heading font-semibold hover:bg-primary/20 transition-colors ${className}`}
    >
      <History className="h-4 w-4" /> {kind === "budget" ? s.budget : s.plan}
    </Link>
  );
}