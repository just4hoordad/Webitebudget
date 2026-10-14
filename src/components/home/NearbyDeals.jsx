import { Link } from "react-router-dom";
import { Tag, ArrowRight, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function NearbyDeals() {
  const { t } = useLanguage();
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold">{t("nearbyDeals")}</h2>
      <p className="text-sm text-muted-foreground -mt-1">{t("nearbyDealsSub")}</p>
      <Link
        to="/budget"
        className="block rounded-2xl border border-border bg-card p-5 hover:border-primary transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-foreground">{t("nearbyDeals")}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {t("exploreDeals")}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </Link>
    </section>
  );
}