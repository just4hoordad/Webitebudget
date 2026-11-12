import { Lock, Sparkles, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function CommunityProLock({ plans, onUpgrade }) {
  const { t } = useLanguage();
  const preview = plans.slice(0, 4);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header (visible) */}
      <div className="bba-t bg-[#7DD3FC] text-[#111827] space-y-1.5">
        <span className="bba-sticker">
          <Users className="h-3.5 w-3.5" />
          {t("communityNav") || "Community"}
        </span>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#111827]">
          {t("communityTitle") || "Community plans"}
        </h1>
        <p className="text-sm font-medium text-[#111827]/85">
          {t("communitySubtitle") || "Browse grocery lists and meal plans shared by other users."}
        </p>
      </div>

      {/* Blurred preview behind lock */}
      <div className="relative">
        <div className="grid gap-3 sm:grid-cols-2 pointer-events-none select-none blur-[6px] opacity-70" aria-hidden="true">
          {preview.length > 0 ? (
            preview.map((plan, i) => (
              <div key={plan.id || i} className="bba-t bg-[#78a71b] text-[#111827] h-44 space-y-2">
                <div className="h-3 w-2/3 rounded-full bg-[#111827]/20" />
                <div className="h-2.5 w-1/2 rounded-full bg-[#111827]/15" />
                <div className="mt-auto flex gap-2 pt-6">
                  <div className="h-6 w-16 rounded-full bg-white/60" />
                  <div className="h-6 w-12 rounded-full bg-white/40" />
                </div>
              </div>
            ))
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bba-t bg-[#78a71b] h-44" />
            ))
          )}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bba-t bg-white dark:bg-card w-full max-w-sm text-center space-y-4 py-7 px-6">
            <div className="h-14 w-14 rounded-2xl bg-[#FFB020] border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-[#111827]" />
            </div>
            <div>
              <span className="bba-sticker">
                <Sparkles className="h-3.5 w-3.5" />
                {t("premiumFeature") || "Premium feature"}
              </span>
            </div>
            <h2 className="font-heading text-2xl font-black tracking-tight">
              {t("communityProTitle") || "Unlock Community Plans"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("communityProDesc") ||
                "Browse grocery lists and meal plans shared by the BudgetBite community. Upgrade to Premium to explore hundreds of budget-friendly plans from other users."}
            </p>
            <button
              onClick={onUpgrade}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#78a71b] text-[#111827] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] rounded-full px-6 py-3 font-heading font-extrabold text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#111827] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              {t("upgradeToPro") || "Upgrade to Premium"}
            </button>
            <p className="text-[11px] text-muted-foreground/80">
              {t("communityProHint") || "Cancel anytime. Instant access."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}