import { useLanguage } from "@/lib/LanguageContext";
import { categoryTranslations } from "@/lib/translations";
import { euCategoryTranslations } from "@/lib/translations_eu";
import { ArrowLeft, RefreshCw, ShoppingBasket, Store } from "lucide-react";

const allCategoryTranslations = { ...categoryTranslations, ...euCategoryTranslations };

export default function PlanGroceryResult({ grocery, days, people, onReset }) {
  const { t, currentLanguage } = useLanguage();
  const total = grocery.total_estimated_cost || 0;
  const catMap = allCategoryTranslations[currentLanguage.code] || {};

  const trCat = (name) => catMap[name] || name;

  return (
    <div className="space-y-5">
      <button onClick={onReset} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </button>

      <div className="rounded-2xl bg-dark p-6 text-dark-foreground">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <ShoppingBasket className="h-4 w-4" /> {t("planGroceryTitle")}
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="font-heading font-bold text-3xl text-primary">€{total.toFixed(2)}</span>
          <span className="text-sm text-dark-muted">/ {days} {t("days")} · {people} {people === 1 ? t("person") : t("people")}</span>
        </div>
      </div>

      <div className="space-y-4">
        {grocery.categories?.map((cat) => (
          <div key={cat.name} className="border border-border rounded-2xl bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/40">
              <h3 className="font-heading font-semibold text-sm uppercase tracking-wide">{trCat(cat.name)}</h3>
            </div>
            <div className="divide-y divide-border">
              {cat.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{item.quantity}</span>
                      {item.store && <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {item.store}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading font-bold text-sm">€{(item.price || 0).toFixed(2)}</p>
                    {item.normal_price && item.normal_price > item.price && (
                      <p className="text-xs text-muted-foreground line-through">€{item.normal_price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onReset} className="w-full h-12 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4" /> {t("regenerate") || "Regenerate"}
      </button>
    </div>
  );
}