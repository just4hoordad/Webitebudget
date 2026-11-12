import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { buildGroceryPrompt, allowedStoreNames, GROCERY_SCHEMA } from "@/lib/generateGroceries";
import { GROCERY_MODEL } from "@/lib/groceryModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FlaskConical, AlertTriangle, CheckCircle2, XCircle, Crown, DollarSign, Trophy } from "lucide-react";

const MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", color: "bg-blue-500" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", color: "bg-emerald-500" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", color: "bg-violet-500" },
  { id: "deepseek/deepseek-v4-flash-0731", label: "DeepSeek V4 Flash", color: "bg-amber-500" },
];

function scoreColor(s) {
  if (s >= 85) return "text-green-600";
  if (s >= 65) return "text-amber-600";
  return "text-red-600";
}

function ModelPanel({ model, state, isWinner }) {
  const meta = MODELS.find((m) => m.id === model) || { label: model, color: "bg-gray-500" };

  return (
    <Card className={`p-4 space-y-3 relative ${isWinner ? "ring-2 ring-primary" : ""}`}>
      {isWinner && (
        <div className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown className="h-3 w-3" /> BEST BALANCE
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
        <h3 className="font-heading font-semibold text-sm">{meta.label}</h3>
        {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
        {state.status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
        {state.status === "error" && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
      </div>

      {state.status === "idle" && <p className="text-xs text-muted-foreground">Waiting for benchmark…</p>}
      {state.status === "loading" && <p className="text-xs text-muted-foreground animate-pulse">Generating {state.runs || ""} run(s)…</p>}

      {state.status === "error" && (
        <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}

      {state.status === "ok" && state.result && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded-lg px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase">Quality</p>
              <p className={`font-heading font-bold text-lg ${scoreColor(state.qualityScore)}`}>{state.qualityScore}</p>
            </div>
            <div className="bg-muted rounded-lg px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase">Cost/run</p>
              <p className="font-heading font-bold text-sm">{state.pricingAvailable ? `$${(state.costPerRunUsd || 0).toFixed(5)}` : "—"}</p>
            </div>
            <div className="bg-muted rounded-lg px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase">Items</p>
              <p className="font-heading font-bold text-lg">{state.result.categories?.reduce((n, c) => n + (c.items?.length || 0), 0) || 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
              {state.runs} run{state.runs > 1 ? "s" : ""}
              {state.failedRuns > 0 && <span className="text-red-500">· {state.failedRuns} failed</span>}
            </span>
            {state.pricingAvailable ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                <DollarSign className="h-3 w-3" /> {state.inputTokens + state.outputTokens} tokens
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                pricing unavailable
              </span>
            )}
            {state.qualityScore >= 85 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" /> high quality
              </span>
            )}
          </div>

          {state.issues?.length > 0 && (
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              {state.issues.slice(0, 4).map((iss, i) => (
                <p key={i} className="flex gap-1"><span className="text-red-400">•</span> {iss}</p>
              ))}
            </div>
          )}

          <details className="text-[10px]">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Items</summary>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border">
              {(state.result.categories || []).map((cat) => (
                <div key={cat.name} className="border-b border-border last:border-0">
                  <p className="font-semibold px-2 py-1 bg-muted/50 text-[10px] uppercase">{cat.name}</p>
                  {(cat.items || []).map((item, i) => (
                    <div key={i} className="px-2 py-1 flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate">{item.name} <span className="text-muted-foreground">({item.quantity})</span></span>
                      <span className="font-medium shrink-0">€{(Number(item.price) || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </Card>
  );
}

export default function ABTest() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const [config, setConfig] = useState({
    budget: 80,
    stores: "Aldi, Lidl",
    diet: "balanced",
    calories: 2000,
    days: 7,
    people: 1,
  });
  const [runs, setRuns] = useState(2);
  const [running, setRunning] = useState(false);
  const [states, setStates] = useState(() =>
    Object.fromEntries(MODELS.map((m) => [m.id, { status: "idle" }]))
  );
  const [winner, setWinner] = useState(null);
  const [ranked, setRanked] = useState([]);
  const [pricingAvailable, setPricingAvailable] = useState(true);

  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const runTest = async () => {
    setRunning(true);
    setWinner(null);
    setRanked([]);
    setStates(Object.fromEntries(MODELS.map((m) => [m.id, { status: "loading", runs }])));

    try {
      const res = await base44.functions.invoke("abTestModels", {
        prompt: buildGroceryPrompt(config, "English"),
        response_json_schema: GROCERY_SCHEMA,
        models: MODELS.map((m) => m.id),
        runs,
        config,
      });
      const data = res?.data || res;
      const results = data?.results || [];
      const next = Object.fromEntries(MODELS.map((m) => [m.id, { status: "idle" }]));
      for (const r of results) {
        next[r.model] = r.status === "ok"
          ? { status: "ok", ...r }
          : { status: "error", error: r.error };
      }
      setStates(next);
      setWinner(data?.winner || null);
      setRanked(data?.ranked || []);
      setPricingAvailable(data?.pricingAvailable !== false);
    } catch (e) {
      const msg = e?.message || "Benchmark failed";
      setStates(Object.fromEntries(MODELS.map((m) => [m.id, { status: "error", error: msg }])));
    } finally {
      setRunning(false);
    }
  };

  if (isLoadingAuth) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-3">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h1 className="font-heading text-xl font-bold">Admin access required</h1>
        <p className="text-sm text-muted-foreground">This benchmark is restricted to admins.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-2.5">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Grocery Model Benchmark</h1>
          <p className="text-xs text-muted-foreground">
            Live quality vs. cost comparison · current grocery model:{" "}
            <span className="font-medium text-foreground">{MODELS.find((m) => m.id === GROCERY_MODEL)?.label || GROCERY_MODEL}</span>
          </p>
        </div>
      </div>

      {/* Winner banner */}
      {winner && (
        <Card className="p-4 bg-primary/5 border-primary/30">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-heading font-bold text-sm">
                Recommended: {MODELS.find((m) => m.id === winner)?.label || winner}
              </p>
              <p className="text-xs text-muted-foreground">
                Best quality-to-cost balance across {runs} run(s)
                {!pricingAvailable && " · pricing data unavailable, ranked by quality only"}.
                {" "}Update <code className="text-[10px] bg-muted px-1 rounded">src/lib/groceryModel.js</code> to switch.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Config */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Benchmark Scenario</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Budget (€)</span>
            <input type="number" value={config.budget} onChange={(e) => updateConfig("budget", Number(e.target.value))} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Calories/day</span>
            <input type="number" value={config.calories} onChange={(e) => updateConfig("calories", Number(e.target.value))} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Days</span>
            <input type="number" value={config.days} onChange={(e) => updateConfig("days", Number(e.target.value))} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">People</span>
            <input type="number" value={config.people} onChange={(e) => updateConfig("people", Number(e.target.value))} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-muted-foreground">Stores</span>
            <input type="text" value={config.stores} onChange={(e) => updateConfig("stores", e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-muted-foreground">Diet</span>
            <select value={config.diet} onChange={(e) => updateConfig("diet", e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
              <option value="balanced">Balanced</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="high-protein">High Protein</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="frozen">Frozen</option>
            </select>
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-muted-foreground">Runs per model (more = stabler scores, higher cost)</span>
            <input type="number" min={1} max={4} value={runs} onChange={(e) => setRuns(Math.max(1, Math.min(Number(e.target.value), 4)))} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
        </div>
        <Button onClick={runTest} disabled={running} className="w-full gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {running ? `Running benchmark (${MODELS.length} models × ${runs} runs)…` : "Run Benchmark"}
        </Button>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODELS.map((m) => (
          <ModelPanel key={m.id} model={m.id} state={states[m.id]} isWinner={winner === m.id} />
        ))}
      </div>

      {ranked.length > 1 && (
        <Card className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ranking (best → worst balance)</p>
          <div className="space-y-1">
            {ranked.map((id, i) => (
              <div key={id} className="flex items-center gap-2 text-xs">
                <span className={`font-bold w-5 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}.</span>
                <span className="font-medium">{MODELS.find((m) => m.id === id)?.label || id}</span>
                {states[id]?.pricingAvailable && states[id]?.costPerRunUsd != null && (
                  <span className="text-muted-foreground ml-auto">${(states[id].costPerRunUsd || 0).toFixed(5)}/run · Q{states[id].qualityScore}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}