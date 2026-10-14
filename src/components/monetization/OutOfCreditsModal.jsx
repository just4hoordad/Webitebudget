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
            className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 space-y-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {isPro ? (
              <div className="text-center space-y-3 pt-2">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                  <CalendarClock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">{t("monthlyLimitTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("monthlyLimitBody")}{" "}
                  <span className="font-semibold text-foreground">{periodLabel}</span>.
                </p>
                {tier !== "pro_plus" && (
                  <Button onClick={onGoPro} variant="outline" className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10">
                    <Crown className="h-4 w-4" /> Upgrade to Pro+
                  </Button>
                )}
                <Button onClick={onClose} className="w-full">
                  {t("gotIt")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <PlayCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-center space-y-1.5">
                  <h2 className="font-heading text-xl font-bold text-foreground">{t("outOfCreditsTitle")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("outOfCreditsBody")}
                  </p>
                </div>
                <Button
                  onClick={onWatchAd}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2"
                >
                  <PlayCircle className="h-4 w-4" /> {t("watchAdGenerate")}
                </Button>
                <Button
                  onClick={onGoPro}
                  variant="outline"
                  className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10"
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