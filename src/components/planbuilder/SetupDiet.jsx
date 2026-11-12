import { Leaf, Beef, Fish, Wheat, Scale, Microwave, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import SetupPart from "@/components/planbuilder/SetupPart";

const DIETS = [
  { id: "balanced", key: "balanced", icon: Scale, desc: "balancedDesc", badge: "bg-[#78a71b]" },
  { id: "vegetarian", key: "vegetarian", icon: Leaf, desc: "vegetarianDesc", badge: "bg-[#34D399]" },
  { id: "vegan", key: "vegan", icon: Leaf, desc: "veganDesc", badge: "bg-[#A3E635]" },
  { id: "high-protein", key: "highProtein", icon: Beef, desc: "highProteinDesc", badge: "bg-[#FF8FB5]" },
  { id: "pescatarian", key: "pescatarian", icon: Fish, desc: "pescatarianDesc", badge: "bg-[#7DD3FC]" },
  { id: "gluten-free", key: "glutenFree", icon: Wheat, desc: "glutenFreeDesc", badge: "bg-[#FFB020]" },
  { id: "halal", key: "halal", icon: null, desc: "halalDesc", badge: "bg-[#C084FC]" },
  { id: "frozen", key: "frozenFoods", icon: Microwave, desc: "frozenFoodsDesc", badge: "bg-[#60A5FA]" },
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
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => { setDiet(option.id); onComplete("diet"); }}
              className={`relative flex flex-col items-start gap-1.5 p-3.5 rounded-2xl text-left border-[2.5px] border-[#111827] dark:border-[#78a71b] transition-all ${
                selected
                  ? "bg-[#78a71b] text-[#111827] shadow-[4px_4px_0_#111827] -translate-y-0.5"
                  : "bg-card text-foreground shadow-[2.5px_2.5px_0_#111827] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111827]"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`h-9 w-9 rounded-xl ${selected ? "bg-white" : option.badge} border-2 border-[#111827] flex items-center justify-center text-[#111827] shadow-[1.5px_1.5px_0_#111827]`}>
                  {option.id === "halal" ? <span className="text-sm font-black leading-none">حلال</span> : Icon ? <Icon className="h-4 w-4" /> : null}
                </div>
                {selected && (
                  <span className="h-5 w-5 rounded-full bg-[#111827] text-white flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <span className={`font-heading font-black text-sm leading-tight mt-1 ${selected ? "text-[#111827]" : "text-foreground"}`}>
                {t(option.key)}
              </span>
              <span className={`text-xs leading-snug font-medium ${selected ? "text-[#111827]/80" : "text-muted-foreground"}`}>
                {t(option.desc)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </SetupPart>
  );
}