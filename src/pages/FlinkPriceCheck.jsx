import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Search, MapPin, Package, Tag, AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

const CITIES = [
  { id: "berlin", label: "Berlin" },
  { id: "hamburg", label: "Hamburg" },
  { id: "munich", label: "München" },
  { id: "cologne", label: "Köln" },
  { id: "frankfurt", label: "Frankfurt" },
  { id: "stuttgart", label: "Stuttgart" },
  { id: "leipzig", label: "Leipzig" },
  { id: "hannover", label: "Hannover" },
];

const DEFAULT_SEARCHES = ["Milch", "Eier", "Bananen", "Brot"];

export default function FlinkPriceCheck() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [searchInput, setSearchInput] = useState(DEFAULT_SEARCHES.join(", "));
  const [city, setCity] = useState("berlin");
  const [maxItems, setMaxItems] = useState(5);
  const [saveResults, setSaveResults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    const searches = searchInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    if (searches.length === 0) {
      setError("Bitte gib mindestens ein Suchwort ein.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("checkFlinkPrices", {
        searches,
        city,
        maxItems,
        save: saveResults,
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.message || "Flink-Preischeck fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-heading font-semibold text-foreground">Admin-only</p>
        <p className="text-sm text-muted-foreground mt-1">
          Der Flink-Preischeck ist nur für Administratoren verfügbar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground leading-tight">
            Flink Preischeck
          </h1>
          <p className="text-xs text-muted-foreground">
            Live-Preise von goflink.com via Apify · eenmalige Abfrage
          </p>
        </div>
      </div>

      {/* Input card */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        {/* Search terms */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Search className="h-4 w-4 text-primary" /> Suchbegriffe
          </label>
          <p className="text-xs text-muted-foreground">
            Kommagetrennt, max. 12 — ein Produkt pro Begriff.
          </p>
          <textarea
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            rows={2}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder="Milch, Eier, Bananen..."
          />
        </div>

        {/* City + max items */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> Stadt
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Produkte pro Suche
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={maxItems}
              onChange={(e) => setMaxItems(Number(e.target.value) || 5)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Save toggle */}
        <button
          onClick={() => setSaveResults(!saveResults)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
            saveResults
              ? "bg-primary/10 border-primary/50"
              : "bg-background border-border hover:border-primary/40"
          }`}
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
            saveResults ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          }`}>
            <Save className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Ergebnisse speichern</p>
            <p className="text-xs text-muted-foreground leading-snug">
              Gültige Preise als PriceEstimate-Datensätze (store: Flink) speichern.
            </p>
          </div>
          <span className={`w-10 h-6 rounded-full transition-colors shrink-0 ${saveResults ? "bg-primary" : "bg-muted"}`}>
            <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${saveResults ? "translate-x-4" : "translate-x-0.5"} translate-y-0.5`} />
          </span>
        </button>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Preise werden abgerufen...</>
          ) : (
            <><Search className="h-4 w-4" /> Preischeck starten</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3.5 flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center gap-2.5 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {result.found} Produkte in {CITIES.find(c => c.id === result.city)?.label || result.city} gefunden
              {result.saved > 0 && ` · ${result.saved} gespeichert`}
            </p>
          </div>

          {/* Items table */}
          {result.items?.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {CITIES.find(c => c.id === result.city)?.label} · PLZ {result.postal_code}
                </p>
              </div>
              <div className="divide-y divide-border">
                {result.items.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.quantity && (
                          <span className="text-xs text-muted-foreground">{item.quantity}</span>
                        )}
                        {item.category && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                        {item.in_stock === false && (
                          <span className="text-xs text-destructive font-medium">nicht vorrätig</span>
                        )}
                        {item.unit_price != null && (
                          <span className="text-xs text-muted-foreground font-mono">
                            €{item.unit_price.toFixed(2)}/Einh.
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-heading font-bold text-base text-foreground font-mono shrink-0">
                      €{item.price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Keine Produkte gefunden</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Der Flink-Actor lieferte keine Treffer. Das kann an einer Service-Pause
                von Flink/Apify liegen oder daran, dass die Suchbegriffe in dieser
                Stadt nicht verfügbar sind.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}