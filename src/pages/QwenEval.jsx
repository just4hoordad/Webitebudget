import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, CheckCircle2, XCircle, Clock, Coins, Globe, AlertTriangle } from "lucide-react";

export default function QwenEval() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setAuthed(u?.role === "admin")).catch(() => setAuthed(false));
  }, []);

  const runEval = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("qwenEval", {});
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Evaluation failed");
    } finally {
      setRunning(false);
    }
  };

  if (authed === null)
    return <div className="max-w-3xl mx-auto py-20 text-center text-muted-foreground">Checking access…</div>;
  if (authed === false)
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-2">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">Admin access required to run the evaluation.</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" /> Qwen Model Evaluation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Side-by-side benchmark: Qwen3.5-9B vs the current model. Nothing is saved; production settings are unchanged.
          </p>
        </div>
        <Button onClick={runEval} disabled={running} className="gap-2 shrink-0">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {running ? "Running…" : "Run evaluation"}
        </Button>
      </div>

      {running && (
        <div className="bg-card border border-border rounded-xl px-5 py-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Sending representative prompts to both models for each task. This takes 1-3 minutes.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && !running && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-muted px-3 py-1.5 rounded-lg">Qwen: <strong>{result.models.qwen}</strong></span>
            <span className="bg-muted px-3 py-1.5 rounded-lg">Current: <strong>{result.models.current}</strong></span>
            <span className="bg-muted px-3 py-1.5 rounded-lg">{new Date(result.timestamp).toLocaleString()}</span>
          </div>

          {result.tasks.map((task) => (
            <div key={task.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-secondary px-4 py-2.5 flex items-center gap-2">
                {task.online && <Globe className="h-4 w-4 text-primary" />}
                <h2 className="font-heading font-semibold text-sm text-secondary-foreground">{task.name}</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border">
                {["qwen", "current"].map((key) => {
                  const r = task[key];
                  const label = key === "qwen" ? "Qwen 3.5-9B" : "Current model";
                  return (
                    <div key={key} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                        {r.validity?.valid
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                      <p className="text-sm text-foreground leading-snug">{r.validity?.note || "—"}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {r.latency != null && r.latency > 0 && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{(r.latency / 1000).toFixed(1)}s</span>
                        )}
                        {r.tokens && (
                          <span className="flex items-center gap-1"><Coins className="h-3 w-3" />{r.tokens.prompt}+{r.tokens.completion} tok</span>
                        )}
                        {r.costEst != null && <span>≈${r.costEst.toFixed(5)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}