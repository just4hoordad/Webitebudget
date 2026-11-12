import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";
import LastResultButton from "@/components/LastResultButton";
import { Sparkles, Gamepad2, Zap } from "lucide-react";

const COIN_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/2fe49be67_generated_51cb0d4d.jpg";
const DUMBBELL_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/5ee0909f8_generated_7f9f3876.jpg";

export default function PlanModeChooser() {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2.5 flex-wrap">
        <h2 className="bba-h2 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-[#FFB020] inline" />
          {m.chooseHeading}
        </h2>
        <span className="text-xs font-heading font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFB020] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
          2 Play Modes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1: Budget Mode */}
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.985 }} className="h-full">
          <Link to="/budget" className="bba-t bba-cart-t bba-cr1 relative overflow-hidden justify-between h-full">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <img src={COIN_IMG} alt="Glossy 3D coin" className="bba-float" />
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB020] text-[#111827] border-2 border-[#111827] px-2.5 py-1 text-[11px] font-heading font-black uppercase shadow-[2px_2px_0_#111827]">
                  <Zap className="h-3 w-3" /> Mode 01
                </span>
              </div>
              <h3>{m.budgetTitle}</h3>
              <p className="text-white/95 font-medium">{m.budgetDesc}</p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="bba-pro bg-black/20 rounded-xl px-2.5 py-1.5 border border-white/25 w-fit">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 14a5 5 0 1112 0v6H6zM8 20h8M9 6a3 3 0 016 0" />
                </svg>
                {m.proNote}
              </span>
              <span className="bba-go shadow-[3px_3px_0_#FFB020]">
                {m.budgetCta}{" "}
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Player 2: Plan Builder Mode */}
        <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.985 }} className="h-full">
          <Link to="/plan-builder" className="bba-t bba-cart-t bba-cr2 relative overflow-hidden justify-between h-full">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <img src={DUMBBELL_IMG} alt="Glossy 3D dumbbell and fork" className="bba-float" style={{ animationDelay: "0.8s" }} />
                <span className="inline-flex items-center gap-1 rounded-full bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-1 text-[11px] font-heading font-black uppercase shadow-[2px_2px_0_#111827]">
                  <Sparkles className="h-3 w-3" /> Mode 02
                </span>
              </div>
              <h3>{m.freeTitle}</h3>
              <p className="text-[#111827]/90 font-medium">{m.freeDesc}</p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="bba-pro bg-white/45 rounded-xl px-2.5 py-1.5 border border-[#111827]/20 w-fit text-[#111827]">
                <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 14a5 5 0 1112 0v6H6zM8 20h8M9 6a3 3 0 016 0" />
                </svg>
                {m.proNote}
              </span>
              <span className="bba-go shadow-[3px_3px_0_#FF3E7F]">
                {m.freeCta}{" "}
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Quick Save-Slot Resume Dock */}
      <div className="bba-t bba-dock sm:flex-row sm:items-center">
        <span className="text-xs font-heading font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#111827] text-[#F3F8E6] self-start sm:self-center shrink-0">
          💾 Quick Load
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
          <LastResultButton kind="budget" alwaysShow />
          <LastResultButton kind="plan" alwaysShow />
        </div>
      </div>
    </div>
  );
}