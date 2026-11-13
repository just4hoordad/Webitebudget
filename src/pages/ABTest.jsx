import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { GROCERY_MODEL } from "@/lib/groceryModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FlaskConical, AlertTriangle, CheckCircle2, XCircle, Crown, DollarSign, Trophy, ListChecks } from "lucide-react";

const TASKS = [
  { id: "grocery", label: "Grocery list", desc: "Full list generation" },
  { id: "meal_plan", label: "Meal plan", desc: "7-day plan from a list" },
  { id: "recipe", label: "Recipe", desc: "Cooking recipe" },
  { id: "grocery_swap", label: "Grocery swap", desc: "Item alternatives" },
  { id: "add_item", label: "Add item", desc: "Product search" },
];

const MODELS = [
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", color: "bg-blue-500" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", color: "bg-emerald-500" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", color: "bg-violet-500" },
  { id: "deepseek/deepseek-v4-flash-0731", label: "DeepSeek V4 Flash", color: "bg-amber-500" },
  { id: "deepseek/deepseek-v4.1-flash", label: "DeepSeek V4.1 Flash", color: "bg-rose-500" },
];

function scoreColor(s) {
  if (s >= 85) return "text-green-600";
  if (s >= 65) return "text-amber-600";
  return "text-red-600";
}

function ModelPanel({ model, state, isWinner }) {
  const meta = MODELS.find((m) => m.id === model) || { label: model, color: "bg-gray-500" };
  return (
    <Card className={`p-3.5 space-y-2.5 relative ${isWinner ? "ring-2 ring-primary" : ""}`}>
      {isWinner && (
        <div className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown className="h-3 w-3" /> BEST
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
        <h3 className="font-heading font-semibold text-sm">{meta.label}</h3>
        {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
        {state.status === "ok" && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
        {state.status === "error" && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
      </div>

      {state.status === "idle" && <p className="text-xs text-muted-foreground">Waiting…</p>}
      {state.status === "loading" && <p className="text-xs text-muted-foreground animate-pulse">Generating…</p>}

      {state.status === "error" && (
        <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}

      {state.status === "ok" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase">Quality</p>
              <p className={`font-heading font-bold text-lg ${scoreColor(state.qualityScore)}`}>{state.qualityScore}</p>
            </div>
            <div className="bg-muted rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase">Cost/run</p>
              <p className="font-heading font-bold text-sm">{state.pricingAvailable ? `$${(state.costPerRunUsd || 0).toFixed(5)}` : "—"}</p>
            </div>
            <div className="bg-muted rounded-lg px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase">Tokens</p>
              <p className="font-heading font-bold text-sm">{(state.inputTokens || 0) + (state.outputTokens || 0)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
              {state.runs} run{state.runs > 1 ? "s" : ""}
              {state.failedRuns > 0 && <span className="text-red-500">· {state.failedRuns} failed</span>}
            </span>
            {state.qualityScore >= 85 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3" /> high
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
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Output</summary>
            <pre className="mt-1 max-h-32 overflow-auto rounded-lg border border-border bg-muted/30 p-2 whitespace-pre-wrap break-words">
              {JSON.stringify(state.result, null, 1).slice(0, 1200)}
            </pre>
          </details>
        </>
      )}
    </Card>
  );
}

function ScenarioSection({ scenario, models, states, winner }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 rounded-lg p-1.5">
          <FlaskConical className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-sm">{scenario.label}</h2>
          <p className="text-[11px] text-muted-foreground">{scenario.description}</p>
        </div>
        {scenario.winner && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-heading font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1">
            <Trophy className="h-3 w-3" /> {MODELS.find((m) => m.id === scenario.winner)?.label || scenario.winner}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {models.map((m) => (
          <ModelPanel key={m.id} model={m.id} state={states[m.id]} isWinner={winner === m.id} />
        ))}
      </div>
      {scenario.ranked?.length > 1 && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Ranking</p>
          {scenario.ranked.map((id, i) => (
            <div key={id} className="flex items-center gap-2 text-xs">
              <span className={`font-bold w-5 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}.</span>
              <span className="font-medium">{MODELS.find((m) => m.id === id)?.label || id}</span>
              {states[id]?.pricingAvailable && states[id]?.costPerRunUsd != null && (
                <span className="text-muted-foreground ml-auto">${(states[id].costPerRunUsd || 0).toFixed(5)}/run · Q{states[id].qualityScore}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function ABTest() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "admin";

  const [config, setConfig] = useState({
    budget: 80, stores: "Aldi, Lidl", diet: "balanced", calories: 2000, days: 7, people: 1,
  });
  const [selectedTasks, setSelectedTasks] = useState(() => new Set(TASKS.map((t) => t.id)));
  const [selectedModels, setSelectedModels] = useState(() => new Set(MODELS.map((m) => m.id)));
  const [runs, setRuns] = useState(1);
  const [running, setRunning] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [pricingAvailable, setPricingAvailable] = useState(true);

  const toggleTask = (id) => setSelectedTasks((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleModel = (id) => setSelectedModels((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const updateConfig = (key, value) => setConfig((prev) => ({ ...prev, [key]: value }));

  const totalCalls = selectedTasks.size * selectedModels.size * runs;

  const runTest = async () => {
    if (selectedTasks.size === 0 || selectedModels.size === 0) return;
    setRunning(true);
    setScenarios([]);
    try {
      const res = await base44.functions.invoke("abTestModels", {
        tasks: [...selectedTasks],
        models: [...selectedModels],
        runs,
        config,
      });
      const data = res?.data || res;
      setScenarios(data?.scenarios || []);
      setPricingAvailable(data?.pricingAvailable !== false);
    } catch (e) {
      const msg = e?.message || "Benchmark failed";
      setScenarios(TASKS.filter((t) => selectedTasks.has(t.id)).map((t) => ({
        id: t.id, label: t.label, description: t.desc,
        results: [...selectedModels].map((m) => ({ model: m, status: "error", error: msg })),
        ranked: [], winner: null,
      })));
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
          <h1 className="font-heading text-xl font-bold">AI Task Benchmark</h1>
          <p className="text-xs text-muted-foreground">
            Per-task quality vs. cost · current grocery model:{" "}
            <span className="font-medium text-foreground">{MODELS.find((m) => m.id === GROCERY_MODEL)?.label || GROCERY_MODEL}</span>
          </p>
        </div>
      </div>

      {/* Task + model selection */}
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <ListChecks className="h-3.5 w-3.5" /> Tasks to benchmark
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TASKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTask(t.id)}
                className={`text-left rounded-xl border-2 px-3 py-2 transition-all ${
                  selectedTasks.has(t.id)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                <p className="font-heading font-bold text-xs">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Models</p>
          <div className="flex flex-wrap gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleModel(m.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-medium transition-all ${
                  selectedModels.has(m.id) ? "border-primary bg-primary/10" : "border-border bg-background"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${m.color}`} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

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
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Stores</span>
            <input type="text" value={config.stores} onChange={(e) => updateConfig("stores", e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Diet</span>
            <select value={config.diet} onChange={(e) => updateConfig("diet", e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm">
              <option value="balanced">Balanced</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="high-protein">High Protein</option>
              <option value="frozen">Frozen</option>
            </select>
          </label>
          <label className="space-y-1 col-span-2">
            <span className="text-xs text-muted-foreground">Runs per model per task</span>
            <input type="number" min={1} max={4} value={runs} onChange={(e) => setRuns(Math.max(1, Math.min(Number(e.target.value), 4)))} className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm" />
          </label>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <DollarSign className="h-3.5 w-3.5 shrink-0" />
          <span>{totalCalls} API calls · ~{Math.ceil(totalCalls * 15 / 60)} min estimate. Fewer tasks or models run faster.</span>
        </div>

        <Button onClick={runTest} disabled={running || selectedTasks.size === 0 || selectedModels.size === 0} className="w-full gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {running ? `Running ${totalCalls} benchmark calls…` : "Run Benchmark"}
        </Button>
      </Card>

      {/* Results grouped by task */}
      {scenarios.map((sc) => {
        const states = Object.fromEntries(
          sc.results.map((r) => [r.model, r.status === "ok" ? { status: "ok", ...r } : { status: "error", error: r.error }])
        );
        return (
          <ScenarioSection
            key={sc.id}
            scenario={sc}
            models={[...selectedModels]}
            states={states}
            winner={sc.winner}
          />
        );
      })}

      {running && scenarios.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-heading font-bold">Running benchmark across {selectedTasks.size} task(s)…</p>
          {!pricingAvailable && <p className="text-xs">pricing data may be unavailable</p>}
        </div>
      )}
    </div>
  );
}