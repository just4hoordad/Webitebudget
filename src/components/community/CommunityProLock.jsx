import { Lock, Sparkles, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import ProLockBadge from "@/components/monetization/ProLockBadge";

export default function CommunityProLock({ plans, onUpgrade }) {
  const { t } = useLanguage();
  const preview = plans.slice(0, 4);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Darkened Arcade Stage Header */}
      <div className="bba-t bba-locked-arcade border-[#111827] dark:border-[#FFB020] space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-[#F3F8E6] border border-white/20 rounded-lg px-2.5 py-1 text-[11px] font-heading font-black uppercase tracking-wider">
            <Users className="h-3.5 w-3.5 text-[#FFB020]" />
            {t("communityNav") || "Community"}
          </span>
          <ProLockBadge label="LOCKED STAGE · PRO" size="sm" onClick={onUpgrade} />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-[#F3F8E6]">
          {t("communityTitle") || "Community plans"}
        </h1>
        <p className="text-sm font-medium text-[#F3F8E6]/70">
          {t("communitySubtitle") || "Browse grocery lists and meal plans shared by other users."}
        </p>
      </div>

      {/* Darkened locked arcade game cartridges + unlock cabinet */}
      <div className="relative min-h-[370px]">
        <div
          className="grid gap-3 sm:grid-cols-2 pointer-events-none select-none opacity-90"
          aria-hidden="true"
        >
          {(preview.length > 0 ? preview : Array.from({ length: 4 })).map((plan, i) => (
            <div
              key={plan?.id || i}
              className="bba-t bba-locked-arcade border-[#111827] h-44 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-1/2 rounded-full bg-white/15" />
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB020]/20 border border-[#FFB020]/50 px-2 py-0.5 text-[9px] font-heading font-black text-[#FFB020]">
                  <Lock className="h-2.5 w-2.5" /> PRO
                </span>
              </div>
              <div className="space-y-2 blur-[2px]">
                <div className="h-3 w-3/4 rounded-full bg-white/20" />
                <div className="h-2.5 w-2/5 rounded-full bg-white/10" />
              </div>
              <div className="flex gap-2 blur-[2px]">
                <div className="h-6 w-16 rounded-full bg-[#78a71b]/30 border border-white/15" />
                <div className="h-6 w-14 rounded-full bg-[#FFB020]/25 border border-white/15" />
              </div>
            </div>
          ))}
        </div>

        {/* Centerpiece Arcade Unlock Overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-3 bg-[#111827]/45 rounded-3xl backdrop-blur-[2px]">
          <div className="bba-t bba-locked-arcade border-[3px] border-[#FFB020] shadow-[6px_6px_0_#111827] w-full max-w-sm text-center space-y-4 py-6 px-5">
            <div className="h-14 w-14 rounded-2xl bg-[#FFB020] border-[3px] border-[#111827] shadow-[3px_3px_0_#000] flex items-center justify-center mx-auto">
              <Lock className="h-7 w-7 text-[#111827] stroke-[2.5]" />
            </div>
            <div>
              <ProLockBadge
                label={t("premiumFeature") || "PREMIUM ARCADE MODE"}
                size="sm"
              />
            </div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-[#F3F8E6]">
              {t("communityProTitle") || "Unlock Community Plans"}
            </h2>
            <p className="text-xs sm:text-sm text-[#F3F8E6]/80 leading-relaxed">
              {t("communityProDesc") ||
                "Browse grocery lists and meal plans shared by the BudgetBite community. Upgrade to Premium to unlock multiplayer inspiration."}
            </p>
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#FFB020] text-[#111827] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#FF3E7F] rounded-full px-6 py-3 font-heading font-black text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#FF3E7F] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              {t("upgradeToPro") || "Upgrade to Premium"}
            </button>
            <p className="text-[11px] text-[#F3F8E6]/60">
              {t("communityProHint") || "Cancel anytime. Instant access."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}