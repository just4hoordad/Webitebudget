import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, X, Check, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CHAIN_COLORS = {
  aldi: "#003da5",    // Aldi blue
  lidl: "#ffcc00",    // Lidl yellow
  rewe: "#cc0000",    // Rewe red
  edeka: "#ffa500",   // Edeka orange
  penny: "#ff6600",   // Penny orange
  netto: "#333333",   // Netto dark gray
  kaufland: "#ff0000", // Kaufland red
  norma: "#003d7a",   // Norma blue
  dm: "#00a651",      // DM green
  rossmann: "#ff007b", // Rossmann pink
  müller: "#ff6b00",  // Müller orange
  globus: "#ff0000",  // Globus red
};

const CHAIN_ALIASES = {
  aldi: ["aldi", "aldi nord", "aldi süd", "aldi sud"],
  lidl: ["lidl"],
  rewe: ["rewe", "rewe center", "rewe city", "rewe to go"],
  edeka: ["edeka", "edeka center", "netto marken-discount"],
  penny: ["penny", "penny markt"],
  netto: ["netto", "netto stadtmarkt"],
  kaufland: ["kaufland"],
  norma: ["norma"],
  dm: ["dm", "dm drogerie", "dm-drogerie markt"],
  rossmann: ["rossmann"],
  müller: ["müller", "mueller", "müller drogerie"],
  globus: ["globus", "globus sb-warenhaus"],
};

function detectChain(name = "") {
  const lower = name.toLowerCase();
  for (const [chain, aliases] of Object.entries(CHAIN_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) return chain;
  }
  return null;
}

function createStoreIcon(chain, isSelected) {
  const logoUrls = {
    aldi: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/ALDI_logo.svg/1200px-ALDI_logo.svg.png",
    lidl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Lidl_logo.svg/1200px-Lidl_logo.svg.png",
    rewe: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/REWE-Logo.svg/1200px-REWE-Logo.svg.png",
    edeka: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/EDEKA_Logo.svg/1200px-EDEKA_Logo.svg.png",
    penny: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Penny_Markt_logo.svg/1200px-Penny_Markt_logo.svg.png",
    netto: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Netto_Markt_logo.svg/1200px-Netto_Markt_logo.svg.png",
    kaufland: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Kaufland-Logo.svg/1200px-Kaufland-Logo.svg.png",
    norma: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Norma_Logo.svg/1200px-Norma_Logo.svg.png",
    dm: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/DM_Drogerie_Markt_logo.svg/1200px-DM_Drogerie_Markt_logo.svg.png",
    rossmann: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Rossmann_2018_logo.svg/1200px-Rossmann_2018_logo.svg.png",
    müller: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/M%C3%BCller_Drogerie_Logo.svg/1200px-M%C3%BCller_Drogerie_Logo.svg.png",
    globus: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Globus_SB-Warenhaus_logo.svg/1200px-Globus_SB-Warenhaus_logo.svg.png",
  };

  const logoUrl = logoUrls[chain] || logoUrls.netto;
  const border = isSelected ? "3px solid #fff" : "2px solid white";
  const outline = isSelected ? "outline:3px solid #0f4c35;outline-offset:2px;" : "";

  return L.divIcon({
    className: "",
    html: `<div style="border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:${border};box-shadow:0 4px 12px rgba(0,0,0,0.4);overflow:hidden;background:white;${outline}"><img src="${logoUrl}" style="width:85%;height:85%;object-fit:contain;display:block;"/></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -46],
  });
}

async function fetchNearbyStores(lat, lng) {
  const res = await base44.functions.invoke("fetchNearbyStores", { lat, lng });
  return (res.data?.elements || [])
    .map((el) => {
      const name = el.tags?.name || el.tags?.brand || "";
      const brand = el.tags?.brand || "";
      const chain = detectChain(brand) || detectChain(name);
      if (!chain) return null;
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;
      const address = [
        el.tags?.["addr:street"],
        el.tags?.["addr:housenumber"],
        el.tags?.["addr:city"],
      ].filter(Boolean).join(" ") || null;
      return { id: el.id, name: name || chain, chain, lat: elLat, lng: elLng, address };
    })
    .filter(Boolean);
}

function MapController({ stores, selectedStoreIds, onToggleStoreLocation, onStoresLoaded, onLoading }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14, { animate: true, duration: 1.2 });
        onLoading(true);
        try {
          const nearby = await fetchNearbyStores(latitude, longitude);
          onStoresLoaded(nearby, [latitude, longitude]);
        } catch (e) {
          onStoresLoaded([], [latitude, longitude]);
        } finally {
          onLoading(false);
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access was denied. Please allow it in your browser settings.");
        }
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  }, [map, onStoresLoaded, onLoading]);

  // Don't auto-locate — user must click the button

  return (
    <>
      {/* Locate button */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
        <button
          onClick={locate}
          disabled={locating}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: stores.length === 0 && !locating ? "#0f4c35" : "white",
            border: "2px solid rgba(0,0,0,0.15)",
            borderRadius: 10, padding: "7px 14px", fontSize: 13,
            fontWeight: 700, cursor: locating ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            color: stores.length === 0 && !locating ? "#fff" : locating ? "#9ca3af" : "#0f4c35",
            whiteSpace: "nowrap",
          }}
          >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          {locating ? "Locating…" : stores.length === 0 ? "📍 Find Stores Near Me" : "My Location"}
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
                  {isSelected ? "✓ Selected" : "+ Select this store"}
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
export default function StoreMapPicker({ selectedStoreLocations, onChangeStoreLocations, selectedChains, onToggleChain }) {
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [center, setCenter] = useState([51.1657, 10.4515]);

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
        {selectedStoreLocations.length > 0 ? `${selectedStoreLocations.length} pinned` : "Pick on Map"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-heading font-bold text-base">Select Specific Stores</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loadingStores
                    ? "Finding stores near you…"
                    : stores.length > 0
                    ? `${stores.length} stores found — tap a marker to select a specific location`
                    : "Click \"Find Stores Near Me\" on the map to load nearby stores"}
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
                  Loading nearby stores…
                </div>
              )}
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }} whenReady={(map) => { setTimeout(() => map.target.invalidateSize(), 100); }}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                />
                <MapController
                  stores={stores}
                  selectedStoreIds={selectedStoreIds}
                  onToggleStoreLocation={handleToggleStoreLocation}
                  onStoresLoaded={handleStoresLoaded}
                  onLoading={setLoadingStores}
                />
              </MapContainer>
            </div>

            {/* Selected store locations list */}
            {selectedStoreLocations.length > 0 && (
              <div className="px-5 py-3 border-t border-border bg-primary/5 shrink-0">
                <p className="text-xs font-semibold text-primary mb-2">
                  <Store className="inline h-3.5 w-3.5 mr-1" />
                  {selectedStoreLocations.length} specific store{selectedStoreLocations.length > 1 ? "s" : ""} selected:
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
                  ? "Tap a store marker on the map to pin a specific location"
                  : "These exact stores will be used for your grocery list"}
              </p>
              <Button size="sm" onClick={() => setOpen(false)} className="ml-3 shrink-0">Done</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}