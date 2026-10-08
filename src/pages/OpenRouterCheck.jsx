import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Activity, AlertCircle, CheckCircle2, Loader2, Zap, Database, Clock, ShoppingCart } from "lucide-react";

export default function OpenRouterCheck() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("checkOpenRouter", {});
      setResult(res.data);
    } catch (err) {
      setError(err?.message || "OpenRouter-Check fehlgeschlagen.");
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
          Der OpenRouter-Preischeck ist nur für Administratoren verfügbar.
        </p>
      </div>
    );
  }

  const ok = result?.status === "success" && result?.openrouter_ok;
  const usedFallback = result?.fallback_used;

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground leading-tight">
            OpenRouter Preischeck
          </h1>
          <p className="text-xs text-muted-foreground">
            Testet die OpenRouter-API live · keine Speicherung
          </p>
        </div>
      </div>

      {/* Run card */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Führt eine kleine Stichprobe (3 Produkte, 3 Ketten, PLZ 10115) über
          denselben OpenRouter-Aufruf wie die tägliche Preisaktualisierung aus.
          Ergebnisse werden <span className="font-medium text-foreground">nicht gespeichert</span>.
        </p>
        <button
          onClick={handleRun}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> OpenRouter wird getestet...</>
          ) : (
            <><Zap className="h-4 w-4" /> Check starten</>
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

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Status banner */}
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              ok
                ? "bg-primary/10 border-primary/30"
                : usedFallback
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-destructive/10 border-destructive/30"
            }`}
          >
            {ok ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${usedFallback ? "text-amber-500" : "text-destructive"}`} />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {ok
                  ? "OpenRouter antwortet korrekt"
                  : usedFallback
                  ? "OpenRouter fehlgeschlagen — Fallback genutzt"
                  : "OpenRouter und Fallback fehlgeschlagen"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {usedFallback
                  ? "Die tägliche Aktualisierung würde auf Base44 InvokeLLM zurückfallen."
                  : ok
                  ? "Die Preisdaten wurden erfolgreich über OpenRouter abgerufen."
                  : "Kein Anbieter konnte Preisdaten liefern."}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-3 gap-2">
            <MetaCard icon={Zap} label="Provider" value={result.provider || "—"} />
            <MetaCard icon={Clock} label="Dauer" value={`${result.duration_ms ?? 0}ms`} />
            <MetaCard icon={Database} label="Items" value={String(result.items_returned ?? 0)} />
          </div>

          {result.supermarket_closed && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              Hinweis: Supermärkte sind heute geschlossen ({result.closure_reason}).
              Der Test läuft trotzdem, Preise können jedoch weniger aktuell sein.
            </p>
          )}

          {/* Items */}
          {result.items?.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Zurückgelieferte Produkte
                </p>
              </div>
              <div className="divide-y divide-border">
                {result.items.map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.product_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingCart className="h-3 w-3" /> {item.store || "—"}
                        </span>
                        {item.quantity && (
                          <span className="text-xs text-muted-foreground">{item.quantity}</span>
                        )}
                        {item.postal_code && (
                          <span className="text-xs text-muted-foreground">PLZ {item.postal_code}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-base text-foreground font-mono">
                        €{item.price?.toFixed(2)}
                      </p>
                      {item.normal_price != null && item.normal_price !== item.price && (
                        <p className="text-[11px] text-muted-foreground line-through font-mono">
                          €{item.normal_price?.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Database className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Keine Items zurückgegeben</p>
              <p className="text-xs text-muted-foreground mt-1">
                OpenRouter antwortete, lieferte aber keine gültigen Preisdaten.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      </div>
      <p className="font-heading font-semibold text-sm text-foreground truncate">{value}</p>
    </div>
  );
}