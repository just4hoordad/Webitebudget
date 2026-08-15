import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/lib/LanguageContext";

const COLORS = { protein: "#d4f880", carbs: "#38bdf8", fats: "#fb7185" };

// kcal per gram
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fats: 9 };

export default function MacroChart({ calories, macros }) {
  const { t } = useLanguage();
  if (!macros) return null;

  const kcal = parseFloat(calories) || 0;
  const grams = {
    protein: Math.round((kcal * (macros.protein || 0) / 100) / KCAL_PER_GRAM.protein),
    carbs: Math.round((kcal * (macros.carbs || 0) / 100) / KCAL_PER_GRAM.carbs),
    fats: Math.round((kcal * (macros.fats || 0) / 100) / KCAL_PER_GRAM.fats),
  };

  const data = [
    { name: t("protein") || "Protein", value: macros.protein || 0, grams: grams.protein, color: COLORS.protein },
    { name: t("carbs") || "Carbs", value: macros.carbs || 0, grams: grams.carbs, color: COLORS.carbs },
    { name: t("fats") || "Fats", value: macros.fats || 0, grams: grams.fats, color: COLORS.fats },
  ];
  const totalPct = (macros.protein || 0) + (macros.carbs || 0) + (macros.fats || 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-sm uppercase tracking-wide text-secondary-foreground">
          {t("macroBreakdown") || "Macro breakdown"}
        </h3>
        <span className="text-xs text-muted-foreground">{kcal} kcal/day {t("target") || "target"}</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-muted-foreground">{p.grams}g · {p.value}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase text-muted-foreground">{t("target") || "target"}</span>
            <span className="font-heading text-xl font-bold text-foreground">{kcal}</span>
            <span className="text-[10px] text-muted-foreground">kcal/day</span>
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                <span className="text-sm font-medium text-foreground">{d.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-heading font-semibold text-foreground">{d.grams}g</span>
                <span className="text-muted-foreground w-10 text-right">{d.value}%</span>
              </div>
            </div>
          ))}
          {totalPct !== 100 && (
            <p className="text-xs text-destructive pt-1">
              {t("macrosSumHint") || `Needs 100% (currently ${totalPct}%)`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}