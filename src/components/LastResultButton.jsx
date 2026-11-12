import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { getLastBudget, getLastPlan } from "@/lib/lastResult";

const L = {
  en: { budget: "Show my last budget list", plan: "Show my last plan list" },
  de: { budget: "Meine letzte Budget-Liste", plan: "Meine letzte Plan-Liste" },
};

export default function LastResultButton({ kind, alwaysShow = false, className = "" }) {
  const { currentLanguage } = useLanguage();
  useLocation(); // re-check storage on every navigation
  const s = L[currentLanguage?.code] || L.en;
  const budgetSearch = kind === "budget" ? getLastBudget() : null;
  const hasPlan = kind === "plan" && !!getLastPlan();
  if (!alwaysShow && !budgetSearch && !hasPlan) return null;
  const to =
    kind === "budget"
      ? budgetSearch
        ? `/meal-plan${budgetSearch}`
        : "/budget"
      : hasPlan
      ? "/plan-builder?last=1"
      : "/plan-builder";
  return (
    <Link to={to} className={`bba-pill ${className}`.trim()}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111827"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5M12 7v5l3 2" />
      </svg>
      {kind === "budget" ? s.budget : s.plan}
    </Link>
  );
}