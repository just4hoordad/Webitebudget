import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

// Sample store locations in Germany (Berlin area)
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
    html: `<div style="
      background:${color};
      color:#fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      font-size:9px;font-weight:700;
    "><span style="transform:rotate(45deg)">${chain.slice(0,2).toUpperCase()}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export default function StoreMapPicker({ selectedStores, onToggleStore }) {
  const [open, setOpen] = useState(false);

  const visibleStores = SAMPLE_STORES.filter(s => selectedStores.includes(s.chain));
  const allStores = SAMPLE_STORES;

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
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-heading font-bold text-base">Nearby Stores</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Tap a store on the map to toggle selection</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map */}
            <div style={{ height: 360 }}>
              <MapContainer center={[52.52, 13.405]} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {allStores.map((store) => (
                  <Marker
                    key={store.id}
                    position={[store.lat, store.lng]}
                    icon={createStoreIcon(store.chain)}
                    eventHandlers={{ click: () => onToggleStore(store.chain) }}
                  >
                    <Popup>
                      <div className="text-sm font-medium">{store.name}</div>
                      <button
                        onClick={() => onToggleStore(store.chain)}
                        className="mt-1 text-xs text-primary font-semibold"
                      >
                        {selectedStores.includes(store.chain) ? "✓ Selected" : "+ Select"} {store.chain.toUpperCase()}
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
              <div className="flex flex-wrap gap-2">
                {["aldi","lidl","rewe","edeka","penny","netto"].map(chain => (
                  <span
                    key={chain}
                    onClick={() => onToggleStore(chain)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
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