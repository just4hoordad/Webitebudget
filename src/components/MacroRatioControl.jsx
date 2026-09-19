import * as SliderPrimitive from "@radix-ui/react-slider";
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

// Bar segment colors — order: protein, carbs, fats
const SEGMENTS = [
  { key: "protein", icon: Beef, bar: "bg-red-500", chip: "bg-red-100", text: "text-red-600" },
  { key: "carbs", icon: Wheat, bar: "bg-amber-500", chip: "bg-amber-100", text: "text-amber-600" },
  { key: "fats", icon: Droplet, bar: "bg-blue-500", chip: "bg-blue-100", text: "text-blue-600" },
];

function matchesPreset(value, preset) {
  return value.protein === preset.protein && value.carbs === preset.carbs && value.fats === preset.fats;
}

export default function MacroRatioControl({ value, onChange, active, onToggle }) {
  const { t } = useLanguage();

  const matchedPreset = PRESETS.slice(0, 4).find((p) => matchesPreset(value, p));
  const activePresetId = matchedPreset ? matchedPreset.id : "custom";

  const selectPreset = (preset) => {
    onChange({ protein: preset.protein, carbs: preset.carbs, fats: preset.fats });
  };

  // The two handles sit at the protein and protein+carbs boundaries,
  // splitting the bar into 3 sections that always sum to 100%.
  const proteinEnd = value.protein;
  const carbsEnd = value.protein + value.carbs;

  const handleChange = (vals) => {
    const p = vals[0];
    const c = vals[1];
    onChange({
      protein: p,
      carbs: c - p,
      fats: 100 - c,
    });
  };

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
          const isActive = activePresetId === preset.id;
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

      {/* Single 2-handle bar — sections = protein | carbs | fats */}
      <div className="space-y-3 pt-1">
        <SliderPrimitive.Root
          value={[proteinEnd, carbsEnd]}
          onValueChange={handleChange}
          max={100}
          min={0}
          step={5}
          aria-label="Macro split"
          className="relative flex w-full touch-none select-none items-center"
        >
          <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-muted">
            <div className="absolute inset-0 flex">
              <div style={{ width: `${value.protein}%` }} className={`${SEGMENTS[0].bar}`} />
              <div style={{ width: `${value.carbs}%` }} className={`${SEGMENTS[1].bar}`} />
              <div style={{ width: `${value.fats}%` }} className={`${SEGMENTS[2].bar}`} />
            </div>
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-6 w-6 -translate-y-1 rounded-full border-2 border-white bg-white shadow-md ring-1 ring-black/5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2" />
          <SliderPrimitive.Thumb className="block h-6 w-6 -translate-y-1 rounded-full border-2 border-white bg-white shadow-md ring-1 ring-black/5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2" />
        </SliderPrimitive.Root>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2">
          {SEGMENTS.map(({ key, icon: Icon, chip, text }) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-lg ${chip} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${text}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-tight">{t(`macro_${key}`)}</p>
                <p className="font-heading font-bold text-sm text-foreground leading-tight">{value[key]}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}