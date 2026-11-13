import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callOpenRouterWithUsage } from "../../shared/openrouter.ts";
import { SCENARIOS } from "../../shared/benchmarkScenarios.ts";

// Admin-only model benchmark: runs the SAME prompt+schema for each selected
// task (grocery list, meal plan, recipe, grocery swap, add item) through
// several OpenRouter candidates (multiple runs each), captures real token
// usage, fetches live per-token pricing, scores each result against that
// task's constraints, and ranks by quality-to-cost balance. Nothing is
// persisted — purely for model selection across every AI-powered feature.

const DEFAULT_CANDIDATES = [
  "google/gemini-2.5-flash",
  "openai/gpt-5-nano",
  "openai/gpt-4o-mini",
  "openai/gpt-oss-20b",
  "deepseek/deepseek-v4-flash-0731",
  "deepseek/deepseek-v4.1-flash",
];

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { models, runs = 1, config = {}, tasks } = body;

  // Which scenarios to run (default: all). Unknown ids are ignored.
  const taskIds: string[] = Array.isArray(tasks) && tasks.length > 0
    ? tasks.filter((t: any) => SCENARIOS.some((s) => s.id === t))
    : SCENARIOS.map((s) => s.id);
  const scenarios = taskIds.map((id) => SCENARIOS.find((s) => s.id === id)!).filter(Boolean);

  const targetModels: string[] = Array.isArray(models) && models.length > 0
    ? models
    : DEFAULT_CANDIDATES;

  const runCount = Math.max(1, Math.min(Number(runs) || 1, 4));

  // ── Fetch live per-token pricing from OpenRouter ────────────────────────
  let pricing: Record<string, { prompt: number; completion: number }> = {};
  let pricingAvailable = true;
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    for (const m of (d.data || [])) {
      if (targetModels.includes(m.id)) {
        pricing[m.id] = {
          prompt: Number(m.pricing?.prompt) || 0,
          completion: Number(m.pricing?.completion) || 0,
        };
      }
    }
    if (!targetModels.some((m) => pricing[m])) pricingAvailable = false;
  } catch {
    pricingAvailable = false;
  }

  // ── Build all (scenario × model × run) tasks ─────────────────────────────
  const jobs: Array<{ scenarioIdx: number; model: string; run: number }> = [];
  scenarios.forEach((s, si) => {
    for (const model of targetModels) {
      for (let i = 0; i < runCount; i++) jobs.push({ scenarioIdx: si, model, run: i });
    }
  });

  // ── Run in batches of 5 to stay within the Worker's connection ceiling ────
  const BATCH_SIZE = 5;
  const settled: PromiseSettledResult<any>[] = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const chunk = jobs.slice(i, i + BATCH_SIZE);
    const batchSettled = await Promise.allSettled(
      chunk.map((j) => {
        const sc = scenarios[j.scenarioIdx];
        return callOpenRouterWithUsage({
          prompt: sc.buildPrompt(config),
          response_json_schema: sc.schema,
          model: j.model,
          add_context_from_internet: false,
        });
      })
    );
    settled.push(...batchSettled);
  }

  // ── Group results per scenario ────────────────────────────────────────────
  const scenarioResults = scenarios.map((sc, si) => {
    const scenarioJobs = jobs.map((j, ji) => ({ j, ji })).filter((x) => x.j.scenarioIdx === si);
    const byModel: Record<string, any[]> = {};
    scenarioJobs.forEach(({ j, ji }) => {
      const r: any = settled[ji];
      if (r.status === "fulfilled") {
        (byModel[j.model] ||= []).push({ ok: true, result: r.value.result, usage: r.value.usage });
      } else {
        (byModel[j.model] ||= []).push({ ok: false, error: (r.reason as Error)?.message || String(r.reason) });
      }
    });

    const results = targetModels.map((model) => {
      const runResults = byModel[model] || [];
      const okRuns = runResults.filter((r) => r.ok);
      if (!okRuns.length) {
        return {
          model, status: "error",
          error: runResults[0]?.error || "All runs failed",
          runs: runResults.length,
        };
      }

      let totalCost = 0;
      let totalInput = 0;
      let totalOutput = 0;
      let scoreSum = 0;
      let bestScore = -1;
      let bestResult: any = null;
      let bestIssues: string[] = [];

      for (const run of okRuns) {
        const norm = sc.normalize ? sc.normalize(run.result) : run.result;
        const q = sc.score(norm, config);
        scoreSum += q.score;
        if (q.score > bestScore) { bestScore = q.score; bestResult = norm; bestIssues = q.issues; }

        const u: any = run.usage || {};
        const inT = Number(u.prompt_tokens) || 0;
        const outT = Number(u.completion_tokens) || 0;
        totalInput += inT;
        totalOutput += outT;
        const p = pricing[model];
        if (Number.isFinite(Number(u.cost)) && Number(u.cost) > 0) {
          totalCost += Number(u.cost);
        } else if (p) {
          totalCost += inT * p.prompt + outT * p.completion;
        }
      }

      const avgScore = scoreSum / okRuns.length;
      const costPerRun = okRuns.length ? totalCost / okRuns.length : 0;
      const costAvailable = totalCost > 0 || (pricingAvailable && !!pricing[model] && (totalInput > 0 || totalOutput > 0));

      return {
        model, status: "ok",
        runs: okRuns.length,
        failedRuns: runResults.length - okRuns.length,
        qualityScore: Math.round(avgScore),
        bestScore: Math.round(bestScore),
        issues: bestIssues,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        costUsd: Math.round(totalCost * 1e6) / 1e6,
        costPerRunUsd: Math.round(costPerRun * 1e6) / 1e6,
        pricing: pricing[model] || null,
        pricingAvailable: costAvailable,
        result: bestResult,
      };
    });

    const okResults = results.filter((r) => r.status === "ok");
    const ranked = [...okResults].sort((a, b) => {
      if (a.costPerRunUsd > 0 && b.costPerRunUsd > 0) {
        return (b.qualityScore / (b.costPerRunUsd + 0.0001)) - (a.qualityScore / (a.costPerRunUsd + 0.0001));
      }
      return b.qualityScore - a.qualityScore;
    });

    return {
      id: sc.id,
      label: sc.label,
      description: sc.description,
      results,
      ranked: ranked.map((r) => r.model),
      winner: ranked[0]?.model || null,
    };
  });

  return Response.json({
    scenarios: scenarioResults,
    pricingAvailable,
    runCount,
  });
}