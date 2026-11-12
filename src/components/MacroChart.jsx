import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/lib/LanguageContext";

const COLORS = { protein: "#78a71b", carbs: "#7DD3FC", fats: "#FF3E7F" };

// kcal per gram
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fats: 9 };

export default function MacroChart({ calories, macros, totalGrams, days = 1 }) {
  const { t } = useLanguage();

  // When totalGrams from the generated grocery list is available, compute the
  // actual macro split from the real per-item protein/carb/fat grams instead of
  // showing the user's target split (which defaults to 30/40/30).
  const hasActual = totalGrams && (Number(totalGrams.protein_g) > 0 || Number(totalGrams.carb_g) > 0 || Number(totalGrams.fat_g) > 0);
  let pct, gramsPerDay;
  if (hasActual) {
    const pKcal = Number(totalGrams.protein_g) * KCAL_PER_GRAM.protein;
    const cKcal = Number(totalGrams.carb_g) * KCAL_PER_GRAM.carbs;
    const fKcal = Number(totalGrams.fat_g) * KCAL_PER_GRAM.fats;
    const sum = pKcal + cKcal + fKcal || 1;
    pct = {
      protein: Math.round((pKcal / sum) * 100),
      carbs: Math.round((cKcal / sum) * 100),
      fats: Math.round((fKcal / sum) * 100),
    };
    const d = Math.max(1, Number(days) || 1);
    gramsPerDay = {
      protein: Math.round(Number(totalGrams.protein_g) / d),
      carbs: Math.round(Number(totalGrams.carb_g) / d),
      fats: Math.round(Number(totalGrams.fat_g) / d),
    };
  } else {
    if (!macros) return null;
    const kcal = parseFloat(calories) || 0;
    pct = { protein: macros.protein || 0, carbs: macros.carbs || 0, fats: macros.fats || 0 };
    gramsPerDay = {
      protein: Math.round((kcal * pct.protein / 100) / KCAL_PER_GRAM.protein),
      carbs: Math.round((kcal * pct.carbs / 100) / KCAL_PER_GRAM.carbs),
      fats: Math.round((kcal * pct.fats / 100) / KCAL_PER_GRAM.fats),
    };
  }

  const kcal = parseFloat(calories) || 0;
  const data = [
    { name: t("protein") || "Protein", value: pct.protein, grams: gramsPerDay.protein, color: COLORS.protein },
    { name: t("carbs") || "Carbs", value: pct.carbs, grams: gramsPerDay.carbs, color: COLORS.carbs },
    { name: t("fats") || "Fats", value: pct.fats, grams: gramsPerDay.fats, color: COLORS.fats },
  ];
  const totalPct = pct.protein + pct.carbs + pct.fats;

  return (
    <div className="bba-t bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="bba-sticker">🥑 Macros</span>
          <h3 className="font-heading font-black text-base uppercase tracking-tight text-foreground">
            {t("macroBreakdown") || "Macro breakdown"}
          </h3>
        </div>
        <span className="text-xs font-heading font-extrabold bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full shadow-[2px_2px_0_#111827]">
          {kcal} kcal/day {t("target") || "target"}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="#111827" strokeWidth={2.5}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="bg-white text-[#111827] border-2 border-[#111827] rounded-xl px-3 py-2 text-xs shadow-[3px_3px_0_#111827]">
                      <p className="font-heading font-black">{p.name}</p>
                      <p className="font-bold text-[#111827]/75">{p.grams}g · {p.value}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-heading font-black uppercase text-muted-foreground">{t("target") || "target"}</span>
            <span className="font-heading text-xl font-black text-foreground">{kcal}</span>
            <span className="text-[10px] font-bold text-muted-foreground">kcal/day</span>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2.5">
          {data.map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] px-3.5 py-2.5 shadow-[2px_2px_0_#111827]"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded-md border-2 border-[#111827]" style={{ background: d.color }} />
                <span className="text-sm font-heading font-extrabold text-[#111827] dark:text-foreground">{d.name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <span className="font-heading font-black text-[#111827] dark:text-foreground">{d.grams}g</span>
                <span className="text-xs font-heading font-black bg-white text-[#111827] border-[1.5px] border-[#111827] px-2 py-0.5 rounded-full min-w-[44px] text-center">
                  {d.value}%
                </span>
              </div>
            </div>
          ))}
          {totalPct !== 100 && (
            <p className="text-xs font-bold text-destructive pt-1">
              {t("macrosSumHint") || `Needs 100% (currently ${totalPct}%)`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}