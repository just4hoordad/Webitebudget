import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap } from "lucide-react";

/**
 * Renders the 3 plan-type buttons.
 * For each button:
 *   1. Silently checks the DB cache first (0 credits).
 *   2a. Cache HIT  → calls the generator directly (instant, 0 credits).
 *   2b. Cache MISS → shows a small "This will use AI credits" confirmation
 *       banner inside the card before the user confirms.
 */
export default function MealPlanButtons({ days, onExact, onRepeat, onUnique, t }) {
  // null | "exact" | "repeat" | "unique"
  const [confirmPending, setConfirmPending] = useState(null);
  const [checking, setChecking] = useState(null);

  const bucketCalories = (cal) => Math.round(cal / 500) * 500;

  const handleClick = async (planType, generator) => {
    setChecking(planType);
    setConfirmPending(null);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const diet = urlParams.get("diet") || "balanced";
      const calories = parseInt(urlParams.get("calories") || "2000", 10);
      const people = urlParams.get("people") || 1;
      const days = parseInt(urlParams.get("days") || "30", 10);
      const budget = urlParams.get("budget") || 150;
      const lang = urlParams.get("lang") || "de";

      const res = await base44.functions.invoke('getMealTemplate', {
        diet,
        calories: bucketCalories(calories),
        people,
        days,
        budget,
        language_code: lang,
        plan_type: planType,
      });

      if (res?.data?.found) {
        // Cache hit — run the generator (it will hit cache again instantly)
        setChecking(null);
        generator();
      } else {
        // Cache miss — ask user to confirm AI generation
        setChecking(null);
        setConfirmPending(planType);
      }
    } catch (_) {
      // If check fails, just let the generator run (it has its own cache check)
      setChecking(null);
      generator();
    }
  };

  const confirm = (generator) => {
    setConfirmPending(null);
    generator();
  };

  const planOptions = [
    {
      type: "exact",
      label: t("generateExactDaysPlan", { days }),
      desc: t("generateExactDaysPlanDesc", { days }),
      className: "bg-primary text-primary-foreground hover:bg-primary/90 sm:col-span-2",
      generator: onExact,
    },
    {
      type: "repeat",
      label: t("repeatWeeklyPlan"),
      desc: t("repeatWeeklyPlanDesc"),
      className: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      generator: onRepeat,
    },
    {
      type: "unique",
      label: t("uniqueMonthlyPlan"),
      desc: t("uniqueMonthlyPlanDesc"),
      className: "bg-accent text-accent-foreground hover:bg-accent/90",
      generator: onUnique,
    },
  ];

  return (
    <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-3">
      <div>
        <h3 className="font-heading font-semibold">{t("weeklyPlanTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("weeklyPlanSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {planOptions.map(({ type, label, desc, className, generator }) => (
          <div key={type} className={type === "exact" ? "sm:col-span-2" : ""}>
            <button
              disabled={!!checking}
              onClick={() => handleClick(type, generator)}
              className={`w-full flex flex-col items-start gap-1 px-4 py-4 rounded-xl transition-all duration-200 text-left disabled:opacity-60 ${className}`}
            >
              <span className="text-base font-heading font-semibold flex items-center gap-2">
                {checking === type && <Loader2 className="h-4 w-4 animate-spin" />}
                {label}
              </span>
              <span className="text-xs opacity-80">{desc}</span>
            </button>

            {/* Confirmation banner shown only when this plan type needs AI */}
            {confirmPending === type && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">No cached plan found</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your exact settings aren't in our library yet. Generating a custom plan will use AI credits (~10–20 credits). Once done, it's saved for all future users with the same settings.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setConfirmPending(null)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirm(generator)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
                  >
                    Generate anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}