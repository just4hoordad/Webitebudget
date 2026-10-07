import { Store, TrendingDown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import SetupPart from "@/components/planbuilder/SetupPart";
import SetupStoreChoices from "@/components/planbuilder/SetupStoreChoices";
import SetupStoreLocation from "@/components/planbuilder/SetupStoreLocation";

export default function SetupStores({ enabled, ...props }) {
  const { t } = useLanguage();
  return (
    <SetupPart part="stores" icon={Store} label={t("preferredStores")}>
      <div className={`space-y-3 ${enabled ? "" : "opacity-40 pointer-events-none"}`}>
        <SetupStoreChoices {...props} />
        <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
          <TrendingDown className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{t("storeDiscountExplanation") || "Estimated discount % calculated from current shelf prices for your diet & macro split"}</span>
        </p>
        <SetupStoreLocation {...props} />
      </div>
    </SetupPart>
  );
}