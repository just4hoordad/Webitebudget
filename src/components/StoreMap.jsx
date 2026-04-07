import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STORE_COLORS = {
  aldi: "#1a3a8f",
  lidl: "#f5c900",
  rewe: "#cc0000",
  edeka: "#ffcc00",
  penny: "#cc0000",
  netto: "#f5a623",
  default: "#4ade80",
};

const STORE_KEYWORDS = ["aldi", "lidl", "rewe", "edeka", "penny", "netto", "kaufland", "dm", "rossmann"];

function getStoreColor(name = "") {
  const lower = name.toLowerCase();
  for (const key of Object.keys(STORE_COLORS)) {
    if (lower.includes(key)) return STORE_COLORS[key];
  }
  return STORE_COLORS.default;
}

function createColorIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function getItemsForStore(storeName, shoppingList = []) {
  if (!storeName || !shoppingList.length) return [];
  const lower = storeName.toLowerCase();
  return shoppingList.filter((item) => item.store && lower.includes(item.store.toLowerCase()));
}

export default function StoreMap({ shoppingList = [] }) {
  const [location, setLocation] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyStores = (lat, lon) => {
    setLoading(true);
    const radius = 2000;
    const query = `[out:json][timeout:10];(node["shop"="supermarket"](around:${radius},${lat},${lon});node["shop"="discount"](around:${radius},${lat},${lon});node["shop"="convenience"](around:${radius},${lat},${lon}););out body;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setStores(data.elements || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load nearby stores.");
        setLoading(false);
      });
  };

  const getLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lon: longitude });
        fetchNearbyStores(latitude, longitude);
      },
      () => {
        setError("Could not get your location. Please allow location access.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Finding stores near you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={getLocation} variant="outline" className="rounded-xl gap-2">
          <Navigation className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <MapPin className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Allow location access to see nearby stores</p>
        <Button onClick={getLocation} className="rounded-xl gap-2">
          <Navigation className="h-4 w-4" />
          Use My Location
        </Button>
      </div>
    );
  }

  const relevantStores = stores.filter((s) => {
    const name = s.tags?.name || "";
    return STORE_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));
  });

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold">Stores Near You</h3>
            <p className="text-xs text-muted-foreground">{relevantStores.length} supermarkets found within 2km</p>
          </div>
          <Button onClick={getLocation} variant="outline" size="sm" className="rounded-xl gap-1.5">
            <Navigation className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
        <MapContainer
          center={[location.lat, location.lon]}
          zoom={14}
          style={{ height: "400px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* User location */}
          <Circle
            center={[location.lat, location.lon]}
            radius={80}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.4 }}
          />
          {/* Store markers */}
          {relevantStores.map((store) => {
            const name = store.tags?.name || "Supermarket";
            const color = getStoreColor(name);
            const items = getItemsForStore(name, shoppingList);
            return (
              <Marker key={store.id} position={[store.lat, store.lon]} icon={createColorIcon(color)}>
                <Popup>
                  <div className="min-w-[160px]">
                    <p className="font-semibold text-sm mb-1">{name}</p>
                    {store.tags?.["addr:street"] && (
                      <p className="text-xs text-gray-500 mb-2">{store.tags["addr:street"]} {store.tags["addr:housenumber"] || ""}</p>
                    )}
                    {items.length > 0 ? (
                      <>
                        <p className="text-xs font-medium text-green-700 mb-1">🛒 Buy here ({items.length} items):</p>
                        <ul className="text-xs space-y-0.5">
                          {items.slice(0, 5).map((item, i) => (
                            <li key={i}>• {item.name} — €{item.price?.toFixed(2)}</li>
                          ))}
                          {items.length > 5 && <li className="text-gray-400">+{items.length - 5} more</li>}
                        </ul>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">No specific items assigned</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Store list with assigned items */}
      {relevantStores.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-sm px-1">What to buy where</h3>
          {relevantStores.map((store) => {
            const name = store.tags?.name || "Supermarket";
            const items = getItemsForStore(name, shoppingList);
            if (items.length === 0) return null;
            const color = getStoreColor(name);
            const total = items.reduce((s, i) => s + (i.price || 0), 0);
            return (
              <div key={store.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
                  <span className="font-heading font-semibold text-sm">{name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length} items · €{total.toFixed(2)}</span>
                </div>
                <div className="divide-y divide-border">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground text-xs">{item.quantity} · €{item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}