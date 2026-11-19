import { motion } from "framer-motion";
import { Wallet, Calendar, Users, ShoppingBasket, ChefHat, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const DIET_STYLE = {
  balanced: { bg: "bg-[#78a71b]", emoji: "⚖️" },
  vegetarian: { bg: "bg-[#34D399]", emoji: "🥬" },
  vegan: { bg: "bg-[#A3E635]", emoji: "🌱" },
  "high-protein": { bg: "bg-[#FF8FB5]", emoji: "💪" },
  pescatarian: { bg: "bg-[#7DD3FC]", emoji: "🐟" },
  "gluten-free": { bg: "bg-[#FFB020]", emoji: "🌾" },
  halal: { bg: "bg-[#C084FC]", emoji: "✨" },
  frozen: { bg: "bg-[#60A5FA]", emoji: "❄️" },
};

export default function CommunityPlanCard({ plan, onOpen }) {
  const { t } = useLanguage();
  const style = DIET_STYLE[plan.diet] || DIET_STYLE.balanced;
  return (
    <motion.button
      onClick={() => onOpen(plan)}
      whileHover={{ y: -4, rotate: -0.6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="bba-t text-left bg-card p-5 space-y-3 group w-full relative overflow-hidden"
    >
      <span className={`absolute top-0 left-0 h-1.5 w-full ${style.bg}`} />
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className={`inline-flex items-center gap-1 text-xs font-heading font-black ${style.bg} text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0_#111827]`}>
          <span>{style.emoji}</span>
          {plan.diet || (t("balanced") || "Balanced")}
        </span>
        {plan.totalCost != null && (
          <span className="inline-flex items-center gap-1 text-xs font-heading font-black bg-white border-2 border-[#111827] rounded-full px-2.5 py-0.5 shadow-[1.5px_1.5px_0_#111827] text-[#111827]">
            <Wallet className="h-3 w-3" />€{Number(plan.totalCost).toFixed(2)}
          </span>
        )}
      </div>
      <h3 className="font-heading font-black text-foreground text-base leading-tight line-clamp-2">
        {plan.name}
      </h3>
      <div className="flex gap-1.5 text-[11px] text-muted-foreground flex-wrap">
        {plan.budget != null && (
          <span className="inline-flex items-center gap-1 bg-secondary border border-[#111827]/15 rounded-full px-2 py-0.5 font-heading font-bold">
            <Wallet className="h-3 w-3" />€{Number(plan.budget).toFixed(0)}
          </span>
        )}
        {plan.days != null && (
          <span className="inline-flex items-center gap-1 bg-secondary border border-[#111827]/15 rounded-full px-2 py-0.5 font-heading font-bold">
            <Calendar className="h-3 w-3" />{plan.days}d
          </span>
        )}
        {plan.itemCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-secondary border border-[#111827]/15 rounded-full px-2 py-0.5 font-heading font-bold">
            <ShoppingBasket className="h-3 w-3" />{plan.itemCount}
          </span>
        )}
        {plan.recipeCount > 0 && (
          <span className="inline-flex items-center gap-1 bg-secondary border border-[#111827]/15 rounded-full px-2 py-0.5 font-heading font-bold">
            <ChefHat className="h-3 w-3" />{plan.recipeCount}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1 border-t-2 border-dashed border-[#111827]/15">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <span className="h-6 w-6 rounded-full bg-[#7DD3FC] border border-[#111827] flex items-center justify-center text-[10px] font-black text-[#111827] shrink-0">
            {(plan.ownerDisplayName || "?").charAt(0).toUpperCase()}
          </span>
          <span className="truncate font-heading font-bold">{plan.ownerDisplayName}</span>
        </span>
        <span className="flex items-center gap-1 text-xs font-heading font-black text-[#111827] bg-[#FFB020] border-2 border-[#111827] rounded-full px-3 py-1 shadow-[2px_2px_0_#111827] group-hover:bg-[#78a71b] transition-colors shrink-0">
          {t("viewPlan") || "View"}
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </motion.button>
  );
}