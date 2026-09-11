import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, X, Check, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CHAIN_COLORS = {
  aldi: "#1d4ed8",
  lidl: "#ca8a04",
  rewe: "#dc2626",
  edeka: "#d97706",
  penny: "#ea580c",
  netto: "#6b7280",
  kaufland: "#7c3aed",
  norma: "#0891b2",
  dm: "#ec4899",
  rossmann: "#f43f5e",
  müller: "#6366f1",
  globus: "#0d9488",
  tegut: "#e63329",
};

const CHAIN_ALIASES = {
  aldi: ["aldi", "aldi nord", "aldi süd", "aldi sud"],
  lidl: ["lidl"],
  rewe: ["rewe", "rewe center", "rewe city", "rewe to go"],
  edeka: ["edeka", "edeka center", "netto marken-discount"],
  penny: ["penny", "penny markt"],
  netto: ["netto", "netto stadtmarkt", "netto-online"],
  kaufland: ["kaufland"],
  norma: ["norma"],
  dm: ["dm", "dm drogerie", "dm-drogerie markt", "dm drogeriemarkt"],
  rossmann: ["rossmann", "dirk rossmann"],
  müller: ["müller", "mueller", "müller drogerie", "dm drogerie müller"],
  globus: ["globus", "globus sb-warenhaus"],
  tegut: ["tegut", "tegut…", "tegut lebensmittel"],
};

function detectChain(name = "") {
  const lower = name.toLowerCase();
  for (const [chain, aliases] of Object.entries(CHAIN_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) return chain;
  }
  return null;
}

function createStoreIcon(chain, isSelected) {
  const color = isSelected ? "#0f4c35" : (CHAIN_COLORS[chain] || "#6b7280");
  const border = isSelected ? "3px solid #fff" : "2px solid white";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:${border};box-shadow:0 2px 10px rgba(0,0,0,0.4);font-size:9px;font-weight:800;${isSelected ? "outline:2px solid #0f4c35;outline-offset:2px;" : ""}"><span style="transform:rotate(45deg)">${chain.slice(0, 2).toUpperCase()}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

const CHAIN_DISPLAY = {
  aldi: "Aldi", lidl: "Lidl", rewe: "REWE", edeka: "Edeka", penny: "Penny",
  netto: "Netto", kaufland: "Kaufland", norma: "Norma", globus: "Globus", tegut: "Tegut",
  dm: "dm", rossmann: "Rossmann", müller: "Müller",
};

const DEFAULT_CHAINS = ["aldi", "lidl", "rewe", "edeka", "penny"];

// Static store dataset: one representative marker per selected chain near the given point.
// No external API call, so it always works. Positions are representative, not real branch addresses.
function getStaticStores(lat, lng, chains) {
  const list = chains && chains.length ? chains : DEFAULT_CHAINS;
  return list.map((chain, i) => {
    const bearing = (i * (360 / list.length) + 25) * (Math.PI / 180);
    const radiusDeg = 0.0035 + (i % 3) * 0.0012; // ~350–580m, scattered naturally
    return {
      id: `static-${chain}`,
      name: CHAIN_DISPLAY[chain] || chain,
      chain,
      lat: lat + Math.cos(bearing) * radiusDeg,
      lng: lng + Math.sin(bearing) * radiusDeg,
      address: null,
    };
  });
}

function MapController({ stores, selectedStoreIds, onToggleStoreLocation, onStoresLoaded, t, pendingFlyTo, onFlyToDone, chains }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!pendingFlyTo) return;
    const [lat, lng] = pendingFlyTo;
    map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
    onStoresLoaded(getStaticStores(lat, lng, chains), [lat, lng]);
    if (onFlyToDone) onFlyToDone();
  }, [pendingFlyTo]);

  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14, { animate: true, duration: 1.2 });
        onStoresLoaded(getStaticStores(latitude, longitude, chains), [latitude, longitude]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access was denied. Please allow it in your browser settings.");
        }
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  }, [map, onStoresLoaded, chains]);

  // Don't auto-locate — user must click the button

  return (
    <>
      {/* Locate button */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
        <button
          onClick={locate}
          disabled={locating}
          title={locating ? t("mapLocating") : stores.length === 0 ? t("mapFindStores") : t("mapMyLocation")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 42, height: 42,
            background: stores.length === 0 && !locating ? "#0f4c35" : "white",
            border: "2px solid rgba(0,0,0,0.15)",
            borderRadius: 12, padding: 0, fontSize: 13,
            cursor: locating ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            color: stores.length === 0 && !locating ? "#fff" : locating ? "#9ca3af" : "#0f4c35",
          }}
        >
          {locating ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Store markers */}
      {stores.map((store) => {
        const isSelected = selectedStoreIds.includes(store.id);
        return (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            icon={createStoreIcon(store.chain, isSelected)}
          >
            <Popup closeButton={false}>
              <div style={{ minWidth: 150, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{store.name}</div>
                {store.address && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>{store.address}</div>
                )}
                <button
                  onClick={() => onToggleStoreLocation(store)}
                  style={{
                    background: isSelected ? "#0f4c35" : "#e5e7eb",
                    color: isSelected ? "#fff" : "#374151",
                    border: "none", borderRadius: 7, padding: "5px 12px",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", width: "100%",
                  }}
                >
                  {isSelected ? "✓ " + t("mapSelected") : "+ " + t("mapSelectStore")}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// Props:
// selectedStoreLocations: array of store objects { id, name, chain, lat, lng, address }
// onChangeStoreLocations: (newLocations) => void
// selectedChains: array of chain ids (for the chain-level toggles in BudgetForm)
// onToggleChain: (chainId) => void
export default function StoreMapPicker({ selectedStoreLocations, onChangeStoreLocations, selectedChains, onToggleChain, cityCoords, onCityCoordsUsed }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [center, setCenter] = useState([51.1657, 10.4515]);
  const [pendingFlyTo, setPendingFlyTo] = useState(null);

  useEffect(() => {
    if (cityCoords) {
      setOpen(true);
      setPendingFlyTo([cityCoords.lat, cityCoords.lng]);
      if (onCityCoordsUsed) onCityCoordsUsed();
    }
  }, [cityCoords]);

  const handleStoresLoaded = useCallback((nearby, location) => {
    setStores(nearby);
    if (location) setCenter(location);
  }, []);

  const handleToggleStoreLocation = useCallback((store) => {
    const alreadySelected = selectedStoreLocations.some((s) => s.id === store.id);
    if (alreadySelected) {
      onChangeStoreLocations(selectedStoreLocations.filter((s) => s.id !== store.id));
    } else {
      onChangeStoreLocations([...selectedStoreLocations, store]);
    }
  }, [selectedStoreLocations, onChangeStoreLocations]);

  const selectedStoreIds = selectedStoreLocations.map((s) => s.id);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-all duration-200 border border-primary/20"
      >
        <MapPin className="h-3.5 w-3.5" />
        {selectedStoreLocations.length > 0 ? `${selectedStoreLocations.length} ${t("mapPinned")}` : t("mapPickOnMap")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-heading font-bold text-base">{t("mapSelectSpecificStores")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loadingStores
                    ? t("mapFindingStores")
                    : stores.length > 0
                    ? `${stores.length} ${t("mapStoresFound")}`
                    : t("mapClickToLoad")}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map */}
            <div style={{ height: 340, position: "relative", flexShrink: 0 }}>
              {loadingStores && (
              <div style={{ position: "absolute", inset: 0, zIndex: 999, background: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#0f4c35" }}>
              {t("mapFindingStores")}
              </div>
              )}
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }} whenReady={(map) => { setTimeout(() => map.target.invalidateSize(), 100); }}>
                <TileLayer
                  attribution='Tiles &copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                />
                <MapController
                  stores={stores}
                  selectedStoreIds={selectedStoreIds}
                  onToggleStoreLocation={handleToggleStoreLocation}
                  onStoresLoaded={handleStoresLoaded}
                  onLoading={setLoadingStores}
                  t={t}
                  pendingFlyTo={pendingFlyTo}
                  onFlyToDone={() => setPendingFlyTo(null)}
                  chains={selectedChains}
                />
              </MapContainer>
            </div>

            {/* Selected store locations list */}
            {selectedStoreLocations.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-primary/5 shrink-0">
                <p className="text-xs font-semibold text-primary mb-2">
                  <Store className="inline h-3.5 w-3.5 mr-1" />
                  {selectedStoreLocations.length} {t("mapSpecificStoresSelected")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStoreLocations.map((s) => (
                    <span
                      key={s.id}
                      className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-lg font-medium"
                    >
                      {s.name}
                      {s.address && <span className="opacity-70">· {s.address.split(",")[0]}</span>}
                      <button onClick={() => handleToggleStoreLocation(s)} className="ml-1 opacity-70 hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t border-border bg-muted/30 shrink-0">
              <p className="text-xs text-muted-foreground flex-1">
                {selectedStoreLocations.length === 0
                  ? t("mapTapToPin")
                  : t("mapExactStoresUsed")}
              </p>
              <Button size="sm" onClick={() => setOpen(false)} className="ml-3 shrink-0">{t("done")}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}