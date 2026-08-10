import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/LanguageContext";
import { Beef, Wheat, Droplet } from "lucide-react";

const PRESETS = [
  { id: "balanced", key: "balanced", protein: 30, carbs: 40, fats: 30 },
  { id: "high-protein", key: "highProtein", protein: 40, carbs: 40, fats: 20 },
  { id: "keto", key: "keto", protein: 25, carbs: 5, fats: 70 },
  { id: "low-fat", key: "lowFat", protein: 25, carbs: 60, fats: 15 },
  { id: "custom", key: "custom", protein: 30, carbs: 40, fats: 30 },
];

const MACROS = [
  { key: "protein", icon: Beef, color: "text-red-600", bg: "bg-red-100" },
  { key: "carbs", icon: Wheat, color: "text-amber-600", bg: "bg-amber-100" },
  { key: "fats", icon: Droplet, color: "text-blue-600", bg: "bg-blue-100" },
];

function matchesPreset(value, preset) {
  return value.protein === preset.protein && value.carbs === preset.carbs && value.fats === preset.fats;
}

export default function MacroRatioControl({ value, onChange, active, onToggle }) {
  const { t } = useLanguage();

  const activePreset = PRESETS.slice(0, 4).find((p) => matchesPreset(value, p)) || "custom";

  const selectPreset = (preset) => {
    onChange({ protein: preset.protein, carbs: preset.carbs, fats: preset.fats });
  };

  const adjust = (key, newVal) => {
    onChange({ ...value, [key]: newVal });
  };

  const total = value.protein + value.carbs + value.fats;
  const isMismatch = total !== 100;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="text-sm font-medium text-foreground">{t("macroTitle")}</label>
          <p className="text-xs text-muted-foreground mt-0.5">{t("macroDesc")}</p>
        </div>
        {onToggle && (
          <Switch checked={active} onCheckedChange={onToggle} aria-label="Toggle macros" />
        )}
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => selectPreset(preset)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              <span className="font-heading font-semibold">{t(preset.key)}</span>
              <span className={`text-[10px] ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                P {preset.protein} · C {preset.carbs} · F {preset.fats}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sliders */}
      <div className="space-y-4 pt-1">
        {MACROS.map(({ key, icon: Icon, color, bg }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{t(`macro_${key}`)}</span>
              </div>
              <span className={`font-heading font-bold text-sm ${isMismatch ? "text-destructive" : "text-foreground"}`}>{value[key]}%</span>
            </div>
            <Slider
              value={[value[key]]}
              onValueChange={([v]) => adjust(key, v)}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Total indicator */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
        isMismatch
          ? "bg-destructive/10 text-destructive"
          : "bg-green-50 text-green-700"
      }`}>
        <span>{t("macroTotal")}</span>
        <span className="font-heading font-bold">
          {total}%{isMismatch && <span className="ml-1 font-normal">(needs 100%)</span>}
        </span>
      </div>
    </div>
  );
}