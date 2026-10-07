import { Leaf, Beef, Fish, Wheat, Scale, Microwave } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import SetupPart from "@/components/planbuilder/SetupPart";

const DIETS = [
  { id: "balanced", key: "balanced", icon: Scale, desc: "balancedDesc" },
  { id: "vegetarian", key: "vegetarian", icon: Leaf, desc: "vegetarianDesc" },
  { id: "vegan", key: "vegan", icon: Leaf, desc: "veganDesc" },
  { id: "high-protein", key: "highProtein", icon: Beef, desc: "highProteinDesc" },
  { id: "pescatarian", key: "pescatarian", icon: Fish, desc: "pescatarianDesc" },
  { id: "gluten-free", key: "glutenFree", icon: Wheat, desc: "glutenFreeDesc" },
  { id: "halal", key: "halal", icon: null, desc: "halalDesc" },
  { id: "frozen", key: "frozenFoods", icon: Microwave, desc: "frozenFoodsDesc" },
];

export default function SetupDiet({ diet, setDiet, enabled, onComplete }) {
  const { t } = useLanguage();
  return (
    <SetupPart part="diet" icon={Leaf} label={t("dietPreference")}>
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${enabled ? "" : "opacity-40 pointer-events-none"}`}>
        {DIETS.map((option) => {
          const Icon = option.icon;
          const selected = diet === option.id;
          return (
            <button key={option.id} onClick={() => { setDiet(option.id); onComplete("diet"); }}
              className={`flex flex-col items-start gap-1 p-4 rounded-xl text-left transition-all duration-200 border ${selected ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-md"}`}>
              <div className={`mb-1 ${selected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {option.id === "halal" ? <span className="text-xl font-bold leading-none">حلال</span> : Icon ? <Icon className="h-6 w-6" /> : null}
              </div>
              <span className={`font-heading font-semibold text-sm leading-tight ${selected ? "text-primary-foreground" : "text-foreground"}`}>{t(option.key)}</span>
              <span className={`text-xs leading-tight ${selected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{t(option.desc)}</span>
            </button>
          );
        })}
      </div>
    </SetupPart>
  );
}