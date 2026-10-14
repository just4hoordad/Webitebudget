import { Crown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function UpgradeBanner({ onClick, variant = "sidebar" }) {
  const { t } = useLanguage();
  if (variant === "sheet") {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors text-sm font-medium"
      >
        <Crown className="h-4 w-4 shrink-0" /> {t("goProBanner")}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors text-sm font-medium"
    >
      <Crown className="h-4 w-4 shrink-0" /> {t("goProBannerShort")}
    </button>
  );
}