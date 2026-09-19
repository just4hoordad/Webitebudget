import { useLanguage } from "@/lib/LanguageContext";
import { TrendingDown, Minus, TrendingUp, Dumbbell, Flame } from "lucide-react";

// Mifflin-St Jeor BMR, then apply an activity factor and a goal adjustment.
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOALS = [
  { id: "lose", nameKey: "loseWeight", icon: TrendingDown, factor: 0.82 },
  { id: "maintain", nameKey: "maintain", icon: Minus, factor: 1.0 },
  { id: "gain", nameKey: "gainWeight", icon: TrendingUp, factor: 1.12 },
  { id: "muscle", nameKey: "buildMuscle", icon: Dumbbell, factor: 1.18 },
];

export function computeDailyCalories(metrics) {
  const { height, weight, age, sex, activity, goal } = metrics;
  if (!height || !weight || !age) return null;
  const h = Number(height);
  const w = Number(weight);
  const a = Number(age);
  if (!h || !w || !a) return null;
  const bmr = 10 * w + 6.25 * h - 5 * a + (sex === "female" ? -161 : 5);
  const factor = ACTIVITY_FACTORS[activity] || 1.2;
  const goalFactor = (GOALS.find((g) => g.id === goal) || GOALS[1]).factor;
  return Math.round((bmr * factor * goalFactor) / 10) * 10;
}

export default function CalorieCalculator({ value, onChange }) {
  const { t } = useLanguage();
  const { height, weight, age, sex, activity, goal } = value;
  const daily = computeDailyCalories(value);

  const update = (patch) => onChange({ ...value, ...patch });

  const inputCls =
    "flex-1 min-w-0 border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40";
  const segCls = (active) =>
    `flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-foreground border-border hover:border-primary/40"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Flame className="h-3.5 w-3.5 text-primary" />
        <span>{t("calorieCalcDesc")}</span>
      </div>

      {/* Height & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("heightLabel")}</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={100}
              max={250}
              value={height}
              onChange={(e) => update({ height: e.target.value })}
              className={inputCls}
              placeholder="170"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t("cm")}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("weightLabel")}</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={30}
              max={300}
              value={weight}
              onChange={(e) => update({ weight: e.target.value })}
              className={inputCls}
              placeholder="70"
            />
            <span className="text-xs text-muted-foreground shrink-0">{t("kg")}</span>
          </div>
        </div>
      </div>

      {/* Age */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("ageLabel")}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={10}
            max={120}
            value={age}
            onChange={(e) => update({ age: e.target.value })}
            className={inputCls}
            placeholder="25"
          />
          <span className="text-xs text-muted-foreground shrink-0">{t("years")}</span>
        </div>
      </div>

      {/* Sex */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("sexLabel")}</label>
        <div className="flex gap-2">
          {["male", "female"].map((s) => (
            <button
              key={s}
              onClick={() => update({ sex: s })}
              className={segCls(sex === s)}
            >
              {t(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity level */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("activityLabel")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: "sedentary", key: "activitySedentary" },
            { id: "light", key: "activityLight" },
            { id: "moderate", key: "activityModerate" },
            { id: "active", key: "activityActive" },
            { id: "very_active", key: "activityVeryActive" },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => update({ activity: a.id })}
              className={segCls(activity === a.id)}
            >
              {t(a.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("goalLabel")}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GOALS.map((g) => {
            const Icon = g.icon;
            return (
              <button
                key={g.id}
                onClick={() => update({ goal: g.id })}
                className={segCls(goal === g.id)}
              >
                <Icon className="h-4 w-4 mx-auto mb-1 shrink-0" />
                <span className="block text-center leading-tight">{t(g.nameKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result */}
      <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
        <span className="text-sm font-medium text-foreground">{t("dailyCaloriesLabel")}</span>
        <span className="font-heading font-bold text-lg text-primary">
          {daily ? `${daily.toLocaleString()} ${t("kcalDay")}` : "—"}
        </span>
      </div>
    </div>
  );
}