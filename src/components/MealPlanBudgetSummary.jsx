import { ShoppingBasket, PiggyBank, TrendingDown } from "lucide-react";

export default function MealPlanBudgetSummary({
  t,
  groceryDays,
  activeTotal,
  budget,
  proteinSnackBudget,
  groceries,
  removedItems,
  totalSaved,
}) {
  const numBudget = parseFloat(budget);
  const withinBudget = activeTotal <= numBudget + proteinSnackBudget;

  const proteinItems = groceries?.categories?.find((c) => c.name === "Protein Snacks");
  const proteinSpent = proteinItems
    ? proteinItems.items
        .filter((i) => !removedItems.has(`${proteinItems.name}::${i.name}`))
        .reduce((s, i) => s + (i.price || 0), 0)
    : 0;
  const proteinRemaining = proteinSnackBudget - proteinSpent;

  const normalTotal = activeTotal + totalSaved;
  const pct = normalTotal > 0 ? Math.round((totalSaved / normalTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bba-t bg-[#FFB020] text-[#111827] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0">
            <ShoppingBasket className="h-5 w-5 text-[#111827]" />
          </div>
          <span className="font-heading font-black text-base sm:text-lg text-[#111827]">
            {t("estimatedTotalForDays", { days: groceryDays })}
          </span>
        </div>
        <span className="font-heading text-2xl sm:text-3xl font-black tabular-nums bg-white text-[#111827] border-[2.5px] border-[#111827] px-3.5 py-1 rounded-2xl shadow-[2px_2px_0_#111827]">
          €{activeTotal.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="bba-t bg-card text-card-foreground py-3.5 px-4">
          <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground mb-1">
            {t("yourBudget")}
          </p>
          <p className="font-heading text-xl sm:text-2xl font-black text-foreground tabular-nums">
            €{numBudget.toFixed(2)}
          </p>
        </div>
        <div
          className={`bba-t py-3.5 px-4 ${
            withinBudget ? "bg-[#78a71b] text-[#111827]" : "bg-[#FF3E7F] text-white"
          }`}
        >
          <p
            className={`text-[10px] font-heading font-black uppercase tracking-wider mb-1 ${
              withinBudget ? "text-[#111827]/75" : "text-white/85"
            }`}
          >
            {t("remaining")}
          </p>
          <p className="font-heading text-xl sm:text-2xl font-black tabular-nums">
            €{(numBudget + proteinSnackBudget - activeTotal).toFixed(2)}
          </p>
        </div>
      </div>

      {proteinSnackBudget > 0 && (
        <div className="bba-t bg-[#7DD3FC] text-[#111827] py-3.5 px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-white border-2 border-[#111827] flex items-center justify-center text-base shrink-0">
                💪
              </span>
              <div>
                <p className="text-xs font-heading font-black text-[#111827]">{t("proteinSnackBudgetTitle")}</p>
                <p className="text-xs font-semibold text-[#111827]/80">
                  €{numBudget.toFixed(2)} + €{proteinSnackBudget.toFixed(2)} = €{(numBudget + proteinSnackBudget).toFixed(2)} total
                </p>
              </div>
            </div>
            <p className="font-heading text-lg font-black bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-xl">
              €{proteinSnackBudget.toFixed(2)}
            </p>
          </div>
          {proteinSpent > 0 && (
            <div className="mt-2.5 flex items-center justify-between text-xs border-t-2 border-[#111827]/15 pt-2">
              <span className="font-bold text-[#111827]">{t("proteinSnackSaved")}</span>
              <span className="font-heading font-black text-[#111827] bg-white border border-[#111827] px-2 py-0.5 rounded-full">
                {proteinRemaining >= 0 ? "+" : ""}€{proteinRemaining.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {totalSaved > 0 && (
        <div className="bba-t bg-[#FF3E7F] text-white relative overflow-hidden">
          <div className="relative flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]">
              <PiggyBank className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-heading font-black uppercase tracking-wider bg-[#111827] text-[#F3F8E6] px-2.5 py-0.5 rounded-full">
                {t("savedVsRegular")}
              </span>
              <p className="font-heading text-3xl sm:text-4xl font-black leading-none mt-1.5 text-white tabular-nums">
                €{totalSaved.toFixed(2)}
              </p>
              <p className="text-sm font-semibold text-white/95 mt-2 leading-relaxed">
                {t("savedCelebration", { amount: `€${totalSaved.toFixed(2)}`, pct })}
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-center justify-center bg-[#FFB020] text-[#111827] border-[2.5px] border-[#111827] rounded-2xl px-3.5 py-2 shadow-[3px_3px_0_#111827] shrink-0">
              <TrendingDown className="h-5 w-5" />
              <span className="font-heading text-2xl font-black leading-none mt-0.5">-{pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}