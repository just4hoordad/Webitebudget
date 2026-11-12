import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, Crown, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

export default function OutOfCreditsModal({ open, onClose, onWatchAd, onGoPro, isPro, tier, periodEnd }) {
  const { t, language } = useLanguage();
  const periodLabel = periodEnd
    ? new Date(periodEnd).toLocaleDateString(language, { month: "short", day: "numeric" })
    : "";
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full sm:max-w-md bg-card border-[3px] border-[#111827] dark:border-[#78a71b] shadow-[6px_6px_0_#111827] rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white border-2 border-[#111827] flex items-center justify-center text-[#111827]"
            >
              <X className="h-4 w-4" />
            </button>

            {isPro ? (
              <div className="text-center space-y-3 pt-2">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FFB020] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center text-[#111827]">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-xl font-black text-foreground">{t("monthlyLimitTitle")}</h2>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("monthlyLimitBody")}{" "}
                  <span className="font-bold text-foreground">{periodLabel}</span>.
                </p>
                {tier !== "pro_plus" && (
                  <Button onClick={onGoPro} variant="secondary" className="w-full gap-2">
                    <Crown className="h-4 w-4" /> Upgrade to Pro+
                  </Button>
                )}
                <Button onClick={onClose} className="w-full">
                  {t("gotIt")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FFB020] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center text-[#111827]">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <span className="bba-sticker">Insert Coin</span>
                  <h2 className="font-heading text-xl font-black text-foreground pt-1">{t("outOfCreditsTitle")}</h2>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("outOfCreditsBody")}
                  </p>
                </div>
                <Button
                  onClick={onWatchAd}
                  variant="secondary"
                  className="w-full gap-2"
                >
                  <PlayCircle className="h-4 w-4" /> {t("watchAdGenerate")}
                </Button>
                <Button
                  onClick={onGoPro}
                  className="w-full gap-2"
                >
                  <Crown className="h-4 w-4" /> {t("goProMonthly")}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}