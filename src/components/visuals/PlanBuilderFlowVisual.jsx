import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";

const REVERSE_STYLES = [
  {
    bg: "bg-[#FF8FB5]",
    art: (
      <svg viewBox="0 0 64 52" className="w-12 h-10 shrink-0" aria-hidden="true">
        <rect x="6" y="10" width="22" height="16" rx="5" fill="#FFFFFF" stroke="#111827" strokeWidth="2.2" />
        <rect x="34" y="10" width="22" height="16" rx="5" fill="#FFB020" stroke="#111827" strokeWidth="2.2" />
        <rect x="20" y="30" width="24" height="16" rx="5" fill="#78a71b" stroke="#111827" strokeWidth="2.2" />
      </svg>
    ),
  },
  {
    bg: "bg-[#C084FC]",
    art: (
      <svg viewBox="0 0 64 52" className="w-12 h-10 shrink-0" aria-hidden="true">
        <path d="M10 10 L54 10 L38 28 L38 44 L26 44 L26 28 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" strokeLinejoin="round" />
        <motion.circle
          cx="32"
          cy="18"
          r="4.5"
          fill="#78a71b"
          stroke="#111827"
          strokeWidth="1.8"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    ),
  },
  {
    bg: "bg-[#78a71b]",
    art: (
      <svg viewBox="0 0 64 52" className="w-12 h-10 shrink-0" aria-hidden="true">
        <rect x="14" y="16" width="36" height="30" rx="7" fill="#FFB020" stroke="#111827" strokeWidth="2.5" />
        <path d="M23 16 C23 6, 41 6, 41 16" fill="none" stroke="#111827" strokeWidth="2.5" />
        <path d="M24 31 l5 5 l11 -10" fill="none" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PlanBuilderFlowVisual() {
  const { currentLanguage } = useLanguage();
  const c = getVisualCopy(currentLanguage?.code);

  return (
    <div className="bba-t bg-card text-card-foreground space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-[#F3F8E6] px-3 py-1 text-[11px] font-heading font-black uppercase tracking-wider shadow-[2px_2px_0_#78a71b]">
          <Sparkles className="h-3 w-3 text-[#FFB020]" /> {c.planBadge}
        </span>
        <span className="text-xs font-heading font-extrabold text-muted-foreground">
          {c.planHeading}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2.5 items-stretch">
        {c.planCards.map((card, i) => (
          <div key={card.step} className="contents">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 340, damping: 22 }}
              className={`rounded-2xl ${REVERSE_STYLES[i].bg} text-[#111827] border-[2.5px] border-[#111827] p-3.5 shadow-[3px_3px_0_#111827] flex flex-col justify-between gap-2`}
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
                {REVERSE_STYLES[i].art}
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