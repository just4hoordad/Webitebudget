import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { MapPin, X, Check, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STORE_COLORS = {
  aldi: "#1d4ed8",
  lidl: "#ca8a04",
  rewe: "#dc2626",
  edeka: "#d97706",
  penny: "#ea580c",
  netto: "#6b7280",
};

const SAMPLE_STORES = [
  { id: "aldi-1", chain: "aldi", name: "Aldi Mitte", lat: 52.5244, lng: 13.4105 },
  { id: "aldi-2", chain: "aldi", name: "Aldi Prenzlauer Berg", lat: 52.5395, lng: 13.4131 },
  { id: "lidl-1", chain: "lidl", name: "Lidl Mitte", lat: 52.5182, lng: 13.3927 },
  { id: "lidl-2", chain: "lidl", name: "Lidl Friedrichshain", lat: 52.5154, lng: 13.4543 },
  { id: "rewe-1", chain: "rewe", name: "REWE Kreuzberg", lat: 52.4988, lng: 13.4028 },
  { id: "rewe-2", chain: "rewe", name: "REWE Charlottenburg", lat: 52.5063, lng: 13.3033 },
  { id: "edeka-1", chain: "edeka", name: "Edeka Schöneberg", lat: 52.4882, lng: 13.3599 },
  { id: "edeka-2", chain: "edeka", name: "Edeka Mitte", lat: 52.5312, lng: 13.3827 },
  { id: "penny-1", chain: "penny", name: "Penny Neukölln", lat: 52.4777, lng: 13.4374 },
  { id: "netto-1", chain: "netto", name: "Netto Wedding", lat: 52.5541, lng: 13.3689 },
];

function createStoreIcon(chain) {
  const color = STORE_COLORS[chain] || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:9px;font-weight:800;"><span style="transform:rotate(45deg)">${chain.slice(0, 2).toUpperCase()}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function LocateControl({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14, { animate: true, duration: 1.2 });
        onLocate([latitude, longitude]);
        setLocating(false);
      },
      () => {
        alert("Could not get your location. Please allow location access in your browser.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }, [map, onLocate]);

  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
      <button
        onClick={handleLocate}
        disabled={locating}
        title="Find my location"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "white",
          border: "2px solid rgba(0,0,0,0.15)",
          borderRadius: 10,
          padding: "7px 12px",
          fontSize: 12,
          fontWeight: 700,
          cursor: locating ? "wait" : "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          color: locating ? "#9ca3af" : "#0f4c35",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7" strokeOpacity="0.3"/>
        </svg>
        {locating ? "Locating…" : "My Location"}
      </button>
    </div>
  );
}

export default function StoreMapPicker({ selectedStores, onToggleStore }) {
  const [open, setOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

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
                <p className="text-xs text-muted-foreground mt-0.5">Click a store marker to toggle selection</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map */}
            <div style={{ height: 380, position: "relative", flexShrink: 0 }}>
              <MapContainer
                center={[52.52, 13.405]}
                zoom={12}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocateControl onLocate={setUserLocation} />
                {SAMPLE_STORES.map((store) => (
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
                            border: "none",
                            borderRadius: 7,
                            padding: "5px 12px",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          {selectedStores.includes(store.chain) ? "✓ Selected" : "+ Select"}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 shrink-0">
              <div className="flex flex-wrap gap-2">
                {["aldi", "lidl", "rewe", "edeka", "penny", "netto"].map((chain) => (
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