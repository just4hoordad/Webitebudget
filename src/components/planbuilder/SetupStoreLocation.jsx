import { MapPin } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import StoreMapPicker from "@/components/StoreMapPicker";
import SetupPinnedStores from "@/components/planbuilder/SetupPinnedStores";

export default function SetupStoreLocation({ postalCode, setPostalCode, selectedStoreLocations = [], onChangeStoreLocations, stores, toggleStore, cityCoords, onCityCoordsUsed, onComplete }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> {t("plzLabel") || "Postal code (PLZ)"}
      </label>
      <div className="flex gap-2">
        <input type="text" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={postalCode || ""}
          onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
          onBlur={() => { if (/^\d{5}$/.test(postalCode || "")) onComplete("stores"); }}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
          placeholder={t("plzPlaceholder") || "e.g. 10115"}
          className="flex-1 min-w-0 border border-border rounded-xl px-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40" />
        <div className="shrink-0 py-1">
          <StoreMapPicker selectedStoreLocations={selectedStoreLocations} onChangeStoreLocations={onChangeStoreLocations}
            selectedChains={stores} onToggleChain={toggleStore} cityCoords={cityCoords} onCityCoordsUsed={onCityCoordsUsed}
            onDone={() => onComplete("stores")} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{t("plzHelper")}</p>
      <SetupPinnedStores locations={selectedStoreLocations} onChange={onChangeStoreLocations} />
    </div>
  );
}