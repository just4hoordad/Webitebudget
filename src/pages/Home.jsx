import { useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import { useLanguage } from "@/lib/LanguageContext";
import CreditBar from "@/components/monetization/CreditBar";
import PlanModeChooser from "@/components/PlanModeChooser";
import { motion } from "framer-motion";

export default function Home() {
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem("onboarding_completed")
  );

  const closeOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  return (
    <div className="space-y-6">
      <div className="relative isolate overflow-hidden h-72 sm:h-96 rounded-3xl border border-[#d9ddd7] bg-[#26352a] shadow-[0_14px_34px_rgba(26,40,29,0.16)]">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80"
          alt="Fresh groceries"
          className="absolute inset-0 z-[-2] w-full h-full object-cover object-[center_52%]"
        />
        <div
          className="absolute inset-0 z-[-1]"
          style={{ background: "linear-gradient(0deg, rgba(10,17,12,.78) 0%, rgba(10,17,12,.36) 51%, rgba(10,17,12,0) 100%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.75, 0.25, 1] }}
          className="absolute left-3.5 right-3.5 bottom-3.5 sm:left-6 sm:right-6 sm:max-w-md rounded-[19px] border border-white/25 backdrop-blur-[16px] pt-[13px] px-[15px] pb-[14px]"
          style={{
            background: "linear-gradient(135deg, rgba(220,241,218,.16), rgba(16,27,20,.43))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.2), inset 0 0 32px rgba(116,175,93,.13), 0 12px 28px rgba(0,0,0,.18)",
          }}
        >
          <CreditBar variant="onGlass" />
          <div className="h-px mt-[9px] mb-[11px] bg-white/[0.23]" />
          <h1 className="font-heading text-[27px] sm:text-3xl leading-[1.06] tracking-[-1.05px] font-[720] text-white">
            {t("heroTitle1")} <span className="text-[#c7e4a5]">{t("heroTitle2")}</span>
          </h1>
          <p className="font-body mt-[7px] text-[12px] leading-[1.35] tracking-[0.05px] text-white/[0.82]">{t("planSubtitle")}</p>
        </motion.div>
      </div>

      <PlanModeChooser />

      <OnboardingModal open={showOnboarding} onClose={closeOnboarding} />
    </div>
  );
}