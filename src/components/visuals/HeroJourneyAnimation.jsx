import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ClipboardList, Refrigerator, Utensils, Play, Pause } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";
import { SceneMoney, SceneList, SceneFridge, SceneMeals } from "./HeroJourneyScenes";

const STAGE_META = [
  { icon: Wallet, bg: "bg-[#FFB020]", cardTint: "bg-[#FFFBEB]", Scene: SceneMoney },
  { icon: ClipboardList, bg: "bg-[#7DD3FC]", cardTint: "bg-[#F0F9FF]", Scene: SceneList },
  { icon: Refrigerator, bg: "bg-[#C084FC]", cardTint: "bg-[#FAF5FF]", Scene: SceneFridge },
  { icon: Utensils, bg: "bg-[#78a71b]", cardTint: "bg-[#F3F8E6]", Scene: SceneMeals },
];

export default function HeroJourneyAnimation({ onInteract }) {
  const { currentLanguage } = useLanguage();
  const copy = getVisualCopy(currentLanguage?.code);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % 4);
    }, 3400);
    return () => clearInterval(timer);
  }, [playing]);

  const handleSelectStage = (idx) => {
    setStage(idx);
    onInteract?.();
  };

  const handleAdvance = () => {
    setStage((prev) => (prev + 1) % 4);
    onInteract?.();
  };

  const activeCopy = copy.heroStages[stage] || copy.heroStages[0];
  const activeMeta = STAGE_META[stage] || STAGE_META[0];
  const ActiveScene = activeMeta.Scene;

  return (
    <div className="w-full flex flex-col gap-2.5 select-none" aria-label="Animated story from budget to cooked meals">
      {/* Main Arcade Story Stage */}
      <div
        onClick={handleAdvance}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleAdvance();
          }
        }}
        title={copy.heroReplay}
        className={`relative rounded-3xl border-[3px] border-[#111827] ${activeMeta.cardTint} text-[#111827] p-3.5 sm:p-4 shadow-[5px_5px_0_#111827] transition-colors duration-300 cursor-pointer overflow-hidden`}
      >
        {/* Top pill bar inside stage */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full ${activeMeta.bg} text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black uppercase tracking-wide shadow-[2px_2px_0_#111827]`}>
            {activeCopy.badge}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-white text-[#111827] border-2 border-[#111827] px-2 py-0.5 text-[10px] font-heading font-extrabold shadow-[1.5px_1.5px_0_#111827] hover:bg-[#F3F8E6]"
            aria-label={playing ? "Pause animation" : "Play animation"}
          >
            {playing ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            <span>{stage + 1}/4</span>
          </button>
        </div>

        {/* Animated Cartoon SVG Stage */}
        <div className="relative h-[168px] sm:h-[178px] w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="w-full h-full"
            >
              <ActiveScene />
            </motion.div>
          </AnimatePresence>

          {/* Floating loot pill in corner */}
          <motion.span
            key={`pill-${stage}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-1 bottom-1 rounded-full bg-[#111827] text-[#F3F8E6] border-2 border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black shadow-[2px_2px_0_#FF3E7F]"
          >
            {activeCopy.pill}
          </motion.span>
        </div>

        {/* Caption bar */}
        <div className="mt-1.5 rounded-2xl bg-white border-2 border-[#111827] px-3 py-2 shadow-[2px_2px_0_#111827]">
          <p className="font-heading font-black text-xs sm:text-sm text-[#111827] leading-tight">
            {activeCopy.title}
          </p>
          <p className="text-[11px] font-semibold text-[#111827]/75 leading-snug mt-0.5">
            {activeCopy.caption}
          </p>
        </div>
      </div>

      {/* Interactive 4-Step Story Switcher Pills */}
      <div className="grid grid-cols-4 gap-1.5">
        {copy.heroStages.map((st, idx) => {
          const MetaIcon = STAGE_META[idx].icon;
          const isActive = idx === stage;
          const isDone = idx < stage;
          return (
            <button
              key={st.short}
              type="button"
              onClick={() => handleSelectStage(idx)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-2xl border-2 border-[#111827] font-heading font-black text-[10px] transition-all cursor-pointer ${
                isActive
                  ? `${STAGE_META[idx].bg} text-[#111827] shadow-[2.5px_2.5px_0_#111827] -translate-y-0.5`
                  : isDone
                  ? "bg-[#F3F8E6] text-[#111827] shadow-[1.5px_1.5px_0_#111827]"
                  : "bg-white dark:bg-secondary text-[#111827] dark:text-foreground opacity-80 hover:opacity-100"
              }`}
            >
              <MetaIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-full leading-tight">{st.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}