import { PiggyBank, Scale, Crown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const MODES = [
  {
    id: "save",
    icon: PiggyBank,
    labelKey: "spendModeSave",
    descKey: "spendModeSaveDesc",
    badge: "bg-[#78a71b]",
  },
  {
    id: "balanced",
    icon: Scale,
    labelKey: "spendModeBalanced",
    descKey: "spendModeBalancedDesc",
    badge: "bg-[#FFB020]",
  },
  {
    id: "maximize",
    icon: Crown,
    labelKey: "spendModeMaximize",
    descKey: "spendModeMaximizeDesc",
    badge: "bg-[#C084FC]",
  },
];

export default function SpendModeSelector({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-sm font-heading font-black text-foreground">{t("spendModeTitle")}</label>
        <p className="text-xs font-medium text-muted-foreground leading-snug">{t("spendModeDesc")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`flex flex-col items-center gap-1.5 p-3 text-center bba-chip ${
                active ? "bba-chip-active" : ""
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#111827] shadow-[1.5px_1.5px_0_#111827] text-[#111827] ${
                  active ? "bg-white" : m.badge
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-heading font-extrabold leading-tight">{t(m.labelKey)}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs font-medium text-muted-foreground leading-snug min-h-[1rem]">
        {t(MODES.find((m) => m.id === value)?.descKey || "spendModeBalancedDesc")}
      </p>
    </div>
  );
}