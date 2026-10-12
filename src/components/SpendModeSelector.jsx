import { PiggyBank, Scale, Crown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const MODES = [
  {
    id: "save",
    icon: PiggyBank,
    labelKey: "spendModeSave",
    descKey: "spendModeSaveDesc",
  },
  {
    id: "balanced",
    icon: Scale,
    labelKey: "spendModeBalanced",
    descKey: "spendModeBalancedDesc",
  },
  {
    id: "maximize",
    icon: Crown,
    labelKey: "spendModeMaximize",
    descKey: "spendModeMaximizeDesc",
  },
];

export default function SpendModeSelector({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium text-foreground">{t("spendModeTitle")}</label>
        <p className="text-xs text-muted-foreground leading-snug">{t("spendModeDesc")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-200 ${
                active
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "bg-card border-border hover:border-primary/40 text-foreground"
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold leading-tight">{t(m.labelKey)}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground leading-snug min-h-[1rem]">
        {t(MODES.find((m) => m.id === value)?.descKey || "spendModeBalancedDesc")}
      </p>
    </div>
  );
}