import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";

const COLORS = ["bg-[#FFB020]", "bg-[#7DD3FC]", "bg-[#C084FC]", "bg-[#78a71b]"];

export default function LoaderMiniScene({ progress = 0 }) {
  const { currentLanguage } = useLanguage();
  const c = getVisualCopy(currentLanguage?.code);
  const activeIdx = Math.min(3, Math.floor((progress / 100) * 4));

  return (
    <div className="px-5 py-3 bg-[#F3F8E6] dark:bg-secondary/70 border-b-2 border-[#111827]/15 dark:border-white/15">
      <div className="grid grid-cols-4 gap-1.5">
        {c.loaderStages.map((label, idx) => {
          const isCurrent = idx === activeIdx;
          const isDone = idx < activeIdx;
          return (
            <motion.div
              key={label}
              animate={isCurrent ? { y: [0, -3, 0], scale: [1, 1.03, 1] } : { y: 0, scale: 1 }}
              transition={isCurrent ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : {}}
              className={`rounded-xl border-2 px-2 py-1.5 text-center font-heading font-black text-[10.5px] sm:text-xs transition-colors ${
                isCurrent
                  ? `${COLORS[idx]} text-[#111827] border-[#111827] shadow-[2px_2px_0_#111827]`
                  : isDone
                  ? "bg-white text-[#111827] border-[#111827]"
                  : "bg-white/55 dark:bg-card/50 text-muted-foreground border-[#111827]/25"
              }`}
            >
              <span className="truncate block">{label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}