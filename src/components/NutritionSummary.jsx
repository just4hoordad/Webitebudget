import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const TARGETS = {
  dailyCalories: 2000,
  protein: 50,
  carbs: 260,
  fat: 70,
  fiber: 30,
};

const MACRO_COLORS = {
  protein: "#22c55e",
  carbs: "#3b82f6",
  fat: "#f59e0b",
  fiber: "#a855f7",
};

const MACRO_ICONS = { protein: "💪", carbs: "⚡", fat: "🫒", fiber: "🌿" };

function MacroBar({ label, value, target, color, icon }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {icon} {label}
        </span>
        <span className="text-muted-foreground">
          {value}g <span className="text-xs">/ {target}g target</span>
        </span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-xs text-right text-muted-foreground">{pct}% of daily target</div>
    </div>
  );
}

export default function NutritionSummary({ nutrition }) {
  const calPct = Math.min(100, Math.round((nutrition.dailyCalories / TARGETS.dailyCalories) * 100));

  const chartData = [
    { name: "Protein", value: nutrition.protein, target: TARGETS.protein, fill: MACRO_COLORS.protein },
    { name: "Carbs", value: nutrition.carbs, target: TARGETS.carbs, fill: MACRO_COLORS.carbs },
    { name: "Fat", value: nutrition.fat, target: TARGETS.fat, fill: MACRO_COLORS.fat },
    { name: "Fiber", value: nutrition.fiber, target: TARGETS.fiber, fill: MACRO_COLORS.fiber },
  ];

  return (
    <div className="space-y-5">
      {/* Calorie card */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={90} endAngle={-270} data={[{ value: calPct }]}>
              <RadialBar dataKey="value" cornerRadius={8} fill="#22c55e" />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading font-bold text-xl">{calPct}%</span>
            <span className="text-xs text-muted-foreground">of target</span>
          </div>
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="font-heading font-bold text-3xl">{nutrition.dailyCalories} kcal</div>
          <div className="text-muted-foreground text-sm">Average daily calories</div>
          <div className="text-xs text-muted-foreground">Recommended: {TARGETS.dailyCalories} kcal/day</div>
          <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${
            calPct >= 85 && calPct <= 115 ? "bg-green-100 text-green-700" :
            calPct < 85 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
          }`}>
            {calPct >= 85 && calPct <= 115 ? "✅ Well balanced" : calPct < 85 ? "⚠️ Slightly low" : "📈 Above target"}
          </div>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h3 className="font-heading font-semibold">Daily Macronutrients</h3>
        {[
          { label: "Protein", key: "protein" },
          { label: "Carbohydrates", key: "carbs" },
          { label: "Fat", key: "fat" },
          { label: "Fiber", key: "fiber" },
        ].map(({ label, key }) => (
          <MacroBar
            key={key}
            label={label}
            value={nutrition[key]}
            target={TARGETS[key]}
            color={MACRO_COLORS[key]}
            icon={MACRO_ICONS[key]}
          />
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading font-semibold mb-4">Macros vs. Target (g)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={6}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}g`} />
              <Bar dataKey="value" name="Actual" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
              <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}