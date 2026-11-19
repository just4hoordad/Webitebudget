import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";

const CARD_STYLES = [
  {
    bg: "bg-[#FFB020]",
    art: (
      <svg viewBox="0 0 64 52" className="w-12 h-10 shrink-0" aria-hidden="true">
        <circle cx="24" cy="30" r="14" fill="#78a71b" stroke="#111827" strokeWidth="2.6" />
        <text x="24" y="35" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="13" fontFamily="Space Grotesk, sans-serif">€</text>
        <motion.circle
          cx="43"
          cy="20"
          r="11"
          fill="#FFFFFF"
          stroke="#111827"
          strokeWidth="2.4"
          animate={{ y: [-2, 3, -2] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.text
          x="43"
          y="24"
          textAnchor="middle"
          fill="#111827"
          fontWeight="900"
          fontSize="10"
          fontFamily="Space Grotesk, sans-serif"
          animate={{ y: [-2, 3, -2] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          45
        </motion.text>
      </svg>
    ),
  },
  {
    bg: "bg-[#7DD3FC]",
    art: (
      <svg viewBox="0 0 64 52" className="w-12 h-10 shrink-0" aria-hidden="true">
        <rect x="10" y="18" width="44" height="28" rx="7" fill="#FFFFFF" stroke="#111827" strokeWidth="2.6" />
        <rect x="16" y="8" width="13" height="16" rx="3" fill="#78a71b" stroke="#111827" strokeWidth="2.2" />
        <circle cx="38" cy="15" r="7" fill="#FF3E7F" stroke="#111827" strokeWidth="2.2" />
        <path d="M22 32 l5 5 l11 -10" fill="none" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    bg: "bg-[#78a71b]",
    art: (
      <svg viewBox="0 0 64 52" className="w-12 h-10 shrink-0" aria-hidden="true">
        <ellipse cx="32" cy="37" rx="22" ry="7" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
        <path d="M14 35 C16 17, 48 17, 50 35 Z" fill="#FF8FB5" stroke="#111827" strokeWidth="2.5" />
        <motion.path
          d="M26 15 Q23 9 27 4 M38 15 Q35 9 39 4"
          fill="none"
          stroke="#111827"
          strokeWidth="2.2"
          strokeLinecap="round"
          animate={{ y: [1, -3, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </svg>
    ),
  },
];

export default function BudgetOutcomeVisual() {
  const { currentLanguage } = useLanguage();
  const c = getVisualCopy(currentLanguage?.code);

  return (
    <div className="bba-t bg-card text-card-foreground space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-[#F3F8E6] px-3 py-1 text-[11px] font-heading font-black uppercase tracking-wider shadow-[2px_2px_0_#FF3E7F]">
          <Sparkles className="h-3 w-3 text-[#FFB020]" /> {c.budgetBadge}
        </span>
        <span className="text-xs font-heading font-extrabold text-muted-foreground">
          {c.budgetHeading}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2.5 items-stretch">
        {c.budgetCards.map((card, i) => (
          <div key={card.step} className="contents">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 340, damping: 22 }}
              className={`rounded-2xl ${CARD_STYLES[i].bg} text-[#111827] border-[2.5px] border-[#111827] p-3.5 shadow-[3px_3px_0_#111827] flex flex-col justify-between gap-2`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-md bg-white text-[#111827] border-2 border-[#111827] px-1.5 py-0.5 text-[10px] font-heading font-black">
                    {card.step}
                  </span>
                  <h3 className="font-heading font-black text-sm text-[#111827] mt-1 leading-tight">
                    {card.title}
                  </h3>
                </div>
                {CARD_STYLES[i].art}
              </div>
              <p className="text-xs font-semibold text-[#111827]/85 leading-snug">
                {card.sub}
              </p>
              <span className="self-start rounded-full bg-white/90 text-[#111827] border-[1.5px] border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black">
                {card.tag}
              </span>
            </motion.div>

            {i < 2 && (
              <div className="hidden md:flex items-center justify-center">
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
                  className="h-8 w-8 rounded-full bg-[#F3F8E6] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4 stroke-[3]" />
                </motion.div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}