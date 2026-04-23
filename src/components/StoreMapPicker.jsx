import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

const KNOWN_CHAINS = Object.keys(CHAIN_COLORS);

const CHAIN_ALIASES = {
  aldi: ["aldi", "aldi nord", "aldi süd", "aldi sud"],
  lidl: ["lidl"],
  rewe: ["rewe", "rewe center", "rewe city", "rewe to go"],
  edeka: ["edeka", "edeka center", "netto marken-discount"],
  penny: ["penny", "penny markt"],
  netto: ["netto", "netto stadtmarkt"],
  kaufland: ["kaufland"],
  norma: ["norma"],
};

function detectChain(name = "") {
  const lower = name.toLowerCase();
  for (const [chain, aliases] of Object.entries(CHAIN_ALIASES)) {
    if (aliases.some((a) => lower.includes(a))) return chain;
  }
  return null;
}

function createStoreIcon(chain) {
  const color = CHAIN_COLORS[chain] || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:9px;font-weight:800;"><span style="transform:rotate(45deg)">${chain.slice(0, 2).toUpperCase()}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

async function fetchNearbyStores(lat, lng, radius = 5000) {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="supermarket"](around:${radius},${lat},${lng});
      node["shop"="grocery"](around:${radius},${lat},${lng});
      node["shop"="convenience"](around:${radius},${lat},${lng});
      node["shop"="discount"](around:${radius},${lat},${lng});
      node["shop"="food"](around:${radius},${lat},${lng});
      node["brand"~"Aldi|Lidl|Rewe|Edeka|Penny|Netto|Kaufland|Norma",i](around:${radius},${lat},${lng});
      way["shop"="supermarket"](around:${radius},${lat},${lng});
      way["brand"~"Aldi|Lidl|Rewe|Edeka|Penny|Netto|Kaufland|Norma",i](around:${radius},${lat},${lng});
    );
    out center;
  `;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });
  const data = await res.json();
  return (data.elements || [])
    .map((el) => {
      const name = el.tags?.name || el.tags?.brand || "";
      const brand = el.tags?.brand || "";
      const chain = detectChain(brand) || detectChain(name);
      if (!chain) return null;
      // nodes have lat/lng directly; ways have center
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!lat || !lng) return null;
      return { id: el.id, name: name || chain, chain, lat, lng };
    })
    .filter(Boolean);
}

function MapController({ userLocation, stores, selectedStores, onToggleStore, onStoresLoaded, onLoading }) {
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
        const nearby = await fetchNearbyStores(latitude, longitude).catch(() => []);
        onStoresLoaded(nearby, [latitude, longitude]);
        onLoading(false);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access was denied. Please allow it in your browser settings.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [map, onStoresLoaded, onLoading]);

  // Auto-locate on first mount
  useEffect(() => {
    locate();
  }, []);

  return (
    <>
      {/* Locate button */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
        <button
          onClick={locate}
          disabled={locating}
          title="Find my location"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "white", border: "2px solid rgba(0,0,0,0.15)",
            borderRadius: 10, padding: "7px 12px", fontSize: 12,
            fontWeight: 700, cursor: locating ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            color: locating ? "#9ca3af" : "#0f4c35", whiteSpace: "nowrap",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
          {locating ? "Locating…" : "My Location"}
        </button>
      </div>

      {/* Store markers */}
      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.lat, store.lng]}
          icon={createStoreIcon(store.chain)}
          eventHandlers={{ click: () => onToggleStore(store.chain) }}
        >
          <Popup closeButton={false}>
            <div style={{ minWidth: 130, textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{store.name}</div>
              <button
                onClick={() => onToggleStore(store.chain)}
                style={{
                  background: selectedStores.includes(store.chain) ? "#0f4c35" : "#e5e7eb",
                  color: selectedStores.includes(store.chain) ? "#fff" : "#374151",
                  border: "none", borderRadius: 7, padding: "5px 12px",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", width: "100%",
                }}
              >
                {selectedStores.includes(store.chain) ? "✓ Selected" : "+ Select"}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function StoreMapPicker({ selectedStores, onToggleStore }) {
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [center, setCenter] = useState([51.1657, 10.4515]); // Germany center as default

  const handleStoresLoaded = useCallback((nearby, location) => {
    setStores(nearby);
    if (location) setCenter(location);
  }, []);

  // Unique chains found nearby
  const nearbyChains = [...new Set(stores.map((s) => s.chain))];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-all duration-200 border border-primary/20"
      >
        <MapPin className="h-3.5 w-3.5" />
        Map
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border flex flex-col" style={{ maxHeight: "90vh" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-heading font-bold text-base">Nearby Stores</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {loadingStores ? "Finding stores near you…" : stores.length > 0 ? `${stores.length} stores found nearby` : "Allow location to see nearby stores"}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map */}
            <div style={{ height: 380, position: "relative", flexShrink: 0 }}>
              {loadingStores && (
                <div style={{ position: "absolute", inset: 0, zIndex: 999, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#0f4c35" }}>
                  Loading nearby stores…
                </div>
              )}
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                />
                <MapController
                  stores={stores}
                  selectedStores={selectedStores}
                  onToggleStore={onToggleStore}
                  onStoresLoaded={handleStoresLoaded}
                  onLoading={setLoadingStores}
                />
              </MapContainer>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 shrink-0">
              <div className="flex flex-wrap gap-2">
                {(nearbyChains.length > 0 ? nearbyChains : KNOWN_CHAINS).map((chain) => (
                  <span
                    key={chain}
                    onClick={() => onToggleStore(chain)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition-all select-none ${
                      selectedStores.includes(chain)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {selectedStores.includes(chain) && <Check className="h-3 w-3" />}
                    {chain.toUpperCase()}
                  </span>
                ))}
              </div>
              <Button size="sm" onClick={() => setOpen(false)} className="ml-3 shrink-0">Done</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}