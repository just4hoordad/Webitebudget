import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { Sparkles, TrendingDown, Salad, ShoppingCart, Zap, Lock, ArrowRight, ArrowLeft, Check } from "lucide-react";

const FEATURES = [
  { icon: TrendingDown, titleKey: "feature1Title", descKey: "feature1Desc", accent: "text-primary", wrap: "bg-primary/10" },
  { icon: Salad, titleKey: "feature2Title", descKey: "feature2Desc", accent: "text-accent-foreground", wrap: "bg-accent/15" },
  { icon: ShoppingCart, titleKey: "feature3Title", descKey: "feature3Desc", accent: "text-sky-600", wrap: "bg-sky-100" },
];

export default function OnboardingModal({ open, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const total = 4;

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const finish = () => {
    setStep(0);
    onClose();
  };

  const skip = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) skip(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogTitle className="sr-only">{t("aiPowered")}</DialogTitle>
        <DialogDescription className="sr-only">{t("heroSubtitle")}</DialogDescription>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-5 pb-2 bg-dark">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-white/25"
              }`}
            />
          ))}
        </div>

        <div className="min-h-[320px]">
          {/* Step 0 — Welcome (hero) */}
          {step === 0 && (
            <div className="bg-dark text-dark-foreground px-6 pb-8 pt-4 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] select-none">
                <span className="absolute top-2 left-3 text-4xl">🥬</span>
                <span className="absolute top-8 right-4 text-3xl">🥕</span>
                <span className="absolute bottom-4 left-8 text-3xl">🍞</span>
                <span className="absolute bottom-2 right-3 text-5xl">🛒</span>
              </div>
              <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("aiPowered")}
                </div>
                <h2 className="font-heading text-2xl font-bold leading-tight text-balance">
                  {t("heroTitle1")} <span className="text-primary">{t("heroTitle2")}</span>
                </h2>
                <p className="text-dark-muted text-sm leading-relaxed max-w-xs mx-auto">
                  {t("heroSubtitle")}
                </p>
              </div>
            </div>
          )}

          {/* Step 1 — Free / no login */}
          {step === 1 && (
            <div className="px-6 py-8 text-center space-y-5">
              <div className="text-4xl">🎉</div>
              <h2 className="font-heading text-xl font-bold text-balance">{t("freeBannerTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{t("freeBannerDesc")}</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Zap className="h-3.5 w-3.5" /> {t("freeBannerBadge1")}
                </span>
                <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Lock className="h-3.5 w-3.5" /> {t("freeBannerBadge2")}
                </span>
              </div>
            </div>
          )}

          {/* Step 2 — Features */}
          {step === 2 && (
            <div className="px-6 py-8 space-y-4">
              <h2 className="font-heading text-lg font-bold text-center">{t("planYourMeals")}</h2>
              <div className="space-y-3">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.titleKey} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${f.wrap}`}>
                        <Icon className={`h-5 w-5 ${f.accent}`} />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm">{t(f.titleKey)}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t(f.descKey)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — Tips + start */}
          {step === 3 && (
            <div className="px-6 py-8 space-y-4">
              <h2 className="font-heading text-lg font-bold text-center">{t("tipsTitle")}</h2>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p>{t("tip1")}</p>
                <p>{t("tip2")}</p>
                <p>{t("tip3")}</p>
                <p>{t("tip4")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border bg-card">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
              {t("onboardingSkip")}
            </Button>
          )}

          {step < total - 1 ? (
            <Button onClick={next} size="sm" className="gap-1.5">
              {t("onboardingNext")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
              <Check className="h-4 w-4" />
              {t("onboardingStart")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}