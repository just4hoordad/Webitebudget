import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callOpenRouterWithUsage } from "../../shared/openrouter.ts";

// Admin-only grocery model benchmark: runs the SAME prompt+schema through
// several OpenRouter candidates (multiple runs each), captures real token
// usage, fetches live per-token pricing from OpenRouter, scores each list's
// grocery quality, then ranks by quality-to-cost balance and recommends a
// winner. Nothing is persisted — purely for model selection.

const DEFAULT_CANDIDATES = [
  "google/gemini-2.5-flash",
  "openai/gpt-5-nano",
  "openai/gpt-4o-mini",
  "openai/gpt-oss-20b",
  "deepseek/deepseek-v4-flash-0731",
  "deepseek/deepseek-v4.1-flash",
];

// "aldi,tegut" or "Aldi (Street 1, City), Tegut" → ["Aldi", "Tegut"]
function allowedStoreNames(stores: any): string[] {
  const names = String(stores || "").replace(/\([^)]*\)/g, "").split(",")
    .map((s) => s.trim()).filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  return [...new Set(names)];
}

// LLMs can't sum 20+ prices correctly — normalize the reported total to the
// real item sum so the quality scorer and the UI see true spending.
function normalizeTotal(result: any): any {
  if (!result || !Array.isArray(result.categories)) return result;
  const sum = result.categories.reduce(
    (acc: number, cat: any) =>
      acc + (Array.isArray(cat?.items) ? cat.items : []).reduce((s: number, i: any) => s + (Number(i?.price) || 0), 0),
    0
  );
  return { ...result, total_estimated_cost: Math.round(sum * 100) / 100 };
}

// Deterministic grocery-list quality scorer (0–100). Each failed constraint
// subtracts points and records a human-readable issue. Mirrors the checks
// the real generation pipeline enforces, so a high score here means the model
// produces lists that need less post-processing.
function scoreGroceryQuality(result: any, config: any): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const categories = Array.isArray(result?.categories) ? result.categories : [];
  const items = categories.flatMap((c: any) => (Array.isArray(c?.items) ? c.items : []));
  if (!items.length) return { score: 0, issues: ["Empty list"] };

  // Item count — enough variety for the period
  const minItems = Number(config.days) >= 14 ? 12 : 8;
  if (items.length < minItems) { issues.push(`Only ${items.length} items (need ${minItems}+)`); score -= 15; }

  // Total matches sum of prices
  const sum = items.reduce((s: number, i: any) => s + (Number(i.price) || 0), 0);
  const reported = Number(result?.total_estimated_cost) || 0;
  if (Math.abs(reported - sum) > Math.max(sum * 0.05, 1)) {
    issues.push(`Total €${reported.toFixed(2)} ≠ sum €${sum.toFixed(2)}`); score -= 15;
  }

  // All items from selected stores
  const allowed = allowedStoreNames(config.stores).map((s) => s.toLowerCase().split(" ")[0]);
  if (allowed.length) {
    const off = items.filter((i: any) => {
      const sl = String(i.store || "").toLowerCase().trim();
      const sf = sl.split(/[\s-]+/)[0];
      return !allowed.some((a) => sl === a || sf === a);
    });
    if (off.length) { issues.push(`${off.length} items from unselected stores`); score -= 15; }
  }

  // Calorie coverage
  const target = Number(config.calories) * Number(config.days);
  const kcal = items.reduce((s: number, i: any) => s + (Number(i.total_kcal) || 0), 0);
  if (target && kcal < target * 0.85) { issues.push(`Low calories (${Math.round((kcal / target) * 100)}% of target)`); score -= 15; }
  else if (target && kcal > target * 1.15) { issues.push(`Excess calories (${Math.round((kcal / target) * 100)}%)`); score -= 8; }

  // Nutrition fields present
  const missingNut = items.filter((i: any) =>
    !Number.isFinite(Number(i.protein_g)) || !Number.isFinite(Number(i.carb_g)) || !Number.isFinite(Number(i.fat_g)));
  if (missingNut.length) { issues.push(`${missingNut.length} items missing macros`); score -= 8; }

  // Branded product names (not bare generics like "Milk", "Oats")
  const generics = ["milk", "oats", "rice", "bread", "eggs", "oil", "pasta", "chicken", "cheese", "yogurt", "bananas", "apples"];
  const generic = items.filter((i: any) => generics.includes(String(i.name || "").toLowerCase().trim()));
  if (generic.length) { issues.push(`${generic.length} generic (non-branded) names`); score -= 8; }

  // normal_price present for savings comparison
  const noNormal = items.filter((i: any) => !Number.isFinite(Number(i.normal_price)));
  if (noNormal.length) { issues.push(`${noNormal.length} missing normal_price`); score -= 5; }

  // Price realism
  const badPrice = items.filter((i: any) => !(Number(i.unit_price) >= 0.15));
  if (badPrice.length) { issues.push(`${badPrice.length} unrealistic unit prices`); score -= 8; }

  return { score: Math.max(0, Math.round(score)), issues };
}

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { prompt, response_json_schema, models, runs = 2, config = {} } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Missing 'prompt' parameter" }, { status: 400 });
  }

  const targetModels: string[] = Array.isArray(models) && models.length > 0
    ? models
    : DEFAULT_CANDIDATES;

  const safeSchema = response_json_schema && typeof response_json_schema === "object"
    ? response_json_schema
    : undefined;

  const runCount = Math.max(1, Math.min(Number(runs) || 2, 4));

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
    // If none of the candidates had pricing returned, mark unavailable.
    if (!targetModels.some((m) => pricing[m])) pricingAvailable = false;
  } catch {
    pricingAvailable = false;
  }

  // ── Run all candidates × runs in parallel ───────────────────────────────
  const tasks: Array<{ model: string; run: number }> = [];
  for (const model of targetModels) {
    for (let i = 0; i < runCount; i++) tasks.push({ model, run: i });
  }

  // Run in batches of 5 to stay within the Worker's 6-connection ceiling
  const BATCH_SIZE = 5;
  const settled: PromiseSettledResult<any>[] = [];
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
    const chunk = tasks.slice(i, i + BATCH_SIZE);
    const batchSettled = await Promise.allSettled(
      chunk.map((t) =>
        callOpenRouterWithUsage({
          prompt,
          response_json_schema: safeSchema,
          model: t.model,
          add_context_from_internet: false,
        })
      )
    );
    settled.push(...batchSettled);
  }

  // ── Group results by model ──────────────────────────────────────────────
  const byModel: Record<string, any[]> = {};
  tasks.forEach((t, i) => {
    const r: any = settled[i];
    if (r.status === "fulfilled") {
      (byModel[t.model] ||= []).push({ ok: true, result: r.value.result, usage: r.value.usage });
    } else {
      (byModel[t.model] ||= []).push({ ok: false, error: (r.reason as Error)?.message || String(r.reason) });
    }
  });

  const output = targetModels.map((model) => {
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
      const norm = normalizeTotal(run.result);
      const q = scoreGroceryQuality(norm, config);
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
      model,
      status: "ok",
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

  // ── Rank by quality-to-cost balance ─────────────────────────────────────
  // value = qualityScore / (costPerRunUsd + epsilon). Higher score and lower
  // cost both improve the ratio. When cost data is unavailable, fall back to
  // ranking by quality score alone so the admin still gets a recommendation.
  const okResults = output.filter((r) => r.status === "ok");
  const ranked = [...okResults].sort((a, b) => {
    if (a.costPerRunUsd > 0 && b.costPerRunUsd > 0) {
      return (b.qualityScore / (b.costPerRunUsd + 0.0001)) - (a.qualityScore / (a.costPerRunUsd + 0.0001));
    }
    return b.qualityScore - a.qualityScore;
  });

  return Response.json({
    results: output,
    ranked: ranked.map((r) => r.model),
    winner: ranked[0]?.model || null,
    pricingAvailable,
    runCount,
  });
}