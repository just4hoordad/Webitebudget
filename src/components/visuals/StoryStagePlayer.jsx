import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";

export default function StoryStagePlayer({
  stages,
  stageMeta,
  replayLabel = "Next stage",
  headerLabel,
  ariaLabel,
  activePath,
  wide = false,
  onInteract,
}) {
  const location = useLocation();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  const isRouteVisible = !activePath || location.pathname === activePath;

  useEffect(() => {
    if (!playing || !isRouteVisible) return undefined;
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [playing, isRouteVisible, stages.length]);

  const handleSelectStage = (idx) => {
    setStage(idx);
    onInteract?.();
  };

  const handleAdvance = () => {
    setStage((prev) => (prev + 1) % stages.length);
    onInteract?.();
  };

  const activeCopy = stages[stage] || stages[0];
  const activeMeta = stageMeta[stage] || stageMeta[0];
  const ActiveScene = activeMeta.Scene;

  if (wide) {
    return (
      <div
        className="bba-t bg-card text-card-foreground select-none"
        aria-label={ariaLabel}
      >
        {headerLabel && (
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <span className="bba-sticker">{headerLabel}</span>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8E6] text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[11px] font-heading font-black shadow-[1.5px_1.5px_0_#111827] hover:bg-[#78a71b] transition-colors cursor-pointer"
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{stage + 1}/{stages.length}</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-3.5 items-stretch">
          {/* Left: Interactive Animated Cartoon Theater */}
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
            title={replayLabel}
            className={`relative rounded-2xl border-[2.5px] border-[#111827] ${activeMeta.cardTint} text-[#111827] p-3.5 shadow-[4px_4px_0_#111827] transition-colors duration-300 cursor-pointer overflow-hidden flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full ${activeMeta.bg} text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black uppercase tracking-wide shadow-[2px_2px_0_#111827]`}
              >
                {activeCopy.badge}
              </span>
              <motion.span
                key={`pill-${stage}`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full bg-[#111827] text-[#F3F8E6] border-2 border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black shadow-[2px_2px_0_#FF3E7F]"
              >
                {activeCopy.pill}
              </motion.span>
            </div>

            <div className="relative h-[175px] sm:h-[188px] w-full flex items-center justify-center my-1">
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
            </div>

            <div className="rounded-xl bg-white border-2 border-[#111827] px-3 py-2 shadow-[2px_2px_0_#111827]">
              <p className="font-heading font-black text-xs sm:text-sm text-[#111827] leading-tight">
                {activeCopy.title}
              </p>
              <p className="text-[11px] font-semibold text-[#111827]/75 leading-snug mt-0.5">
                {activeCopy.caption}
              </p>
            </div>
          </div>

          {/* Right: 4 Clickable Story Steps */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {stages.map((st, idx) => {
              const MetaIcon = stageMeta[idx].icon;
              const isActive = idx === stage;
              const isDone = idx < stage;
              return (
                <button
                  key={st.short}
                  type="button"
                  onClick={() => handleSelectStage(idx)}
                  className={`text-left flex items-center gap-2.5 rounded-2xl border-2 border-[#111827] px-3 py-2.5 transition-all cursor-pointer ${
                    isActive
                      ? `${stageMeta[idx].bg} text-[#111827] shadow-[3px_3px_0_#111827] -translate-y-0.5`
                      : isDone
                      ? "bg-[#F3F8E6] text-[#111827] shadow-[2px_2px_0_#111827]"
                      : "bg-background text-foreground opacity-80 hover:opacity-100"
                  }`}
                >
                  <span
                    className={`h-8 w-8 rounded-xl border-2 border-[#111827] flex items-center justify-center shrink-0 ${
                      isActive ? "bg-white text-[#111827]" : `${stageMeta[idx].bg} text-[#111827]`
                    }`}
                  >
                    <MetaIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-black text-xs leading-tight truncate">
                      {idx + 1}. {st.short}
                    </p>
                    <p
                      className={`text-[11px] font-semibold leading-snug line-clamp-1 mt-0.5 ${
                        isActive || isDone ? "text-[#111827]/80" : "text-muted-foreground"
                      }`}
                    >
                      {st.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2.5 select-none" aria-label={ariaLabel}>
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
        title={replayLabel}
        className={`relative rounded-3xl border-[3px] border-[#111827] ${activeMeta.cardTint} text-[#111827] p-3.5 sm:p-4 shadow-[5px_5px_0_#111827] transition-colors duration-300 cursor-pointer overflow-hidden`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full ${activeMeta.bg} text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black uppercase tracking-wide shadow-[2px_2px_0_#111827]`}
          >
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
            <span>{stage + 1}/{stages.length}</span>
          </button>
        </div>

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

          <motion.span
            key={`pill-${stage}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-1 bottom-1 rounded-full bg-[#111827] text-[#F3F8E6] border-2 border-[#111827] px-2.5 py-0.5 text-[10.5px] font-heading font-black shadow-[2px_2px_0_#FF3E7F]"
          >
            {activeCopy.pill}
          </motion.span>
        </div>

        <div className="mt-1.5 rounded-2xl bg-white border-2 border-[#111827] px-3 py-2 shadow-[2px_2px_0_#111827]">
          <p className="font-heading font-black text-xs sm:text-sm text-[#111827] leading-tight">
            {activeCopy.title}
          </p>
          <p className="text-[11px] font-semibold text-[#111827]/75 leading-snug mt-0.5">
            {activeCopy.caption}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {stages.map((st, idx) => {
          const MetaIcon = stageMeta[idx].icon;
          const isActive = idx === stage;
          const isDone = idx < stage;
          return (
            <button
              key={st.short}
              type="button"
              onClick={() => handleSelectStage(idx)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-2xl border-2 border-[#111827] font-heading font-black text-[10px] transition-all cursor-pointer ${
                isActive
                  ? `${stageMeta[idx].bg} text-[#111827] shadow-[2.5px_2.5px_0_#111827] -translate-y-0.5`
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