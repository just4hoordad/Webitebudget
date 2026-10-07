import { Store, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function SetupPinnedStores({ locations, onChange }) {
  const { t } = useLanguage();
  if (!locations.length) return null;
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
      <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
        <Store className="h-3.5 w-3.5" /> {locations.length} {t("mapSpecificStoresSelected")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {locations.map((store) => (
          <span key={store.id} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-lg font-medium">
            {store.name}
            {store.address && <span className="opacity-70">· {store.address.split(",")[0]}</span>}
            <button onClick={() => onChange(locations.filter((item) => item.id !== store.id))} className="ml-0.5 opacity-70 hover:opacity-100"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <button onClick={() => onChange([])} className="text-xs text-muted-foreground hover:text-destructive mt-2 underline">{t("clearPinnedStores")}</button>
    </div>
  );
}