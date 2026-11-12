import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callOpenRouter, OpenRouterUnavailableError } from "../../shared/openrouter.ts";

// Allowlist of safe, low-cost models — default route is Gemini 2.5 Flash
const GEMINI_25_FLASH = "google/gemini-2.5-flash";
const ALLOWED_MODELS: Record<string, string> = {
  [GEMINI_25_FLASH]: GEMINI_25_FLASH,
  "deepseek/deepseek-v4-flash-0731": "deepseek/deepseek-v4-flash-0731",
  "google/gemini-2.5-pro": GEMINI_25_FLASH,
  "openai/gpt-4o-mini": "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-001": GEMINI_25_FLASH,
  "openai/gpt-5-nano": "openai/gpt-5-nano",
  "gemini_3_flash": GEMINI_25_FLASH,
  "gemini_3_1_pro": GEMINI_25_FLASH,
  "automatic": GEMINI_25_FLASH,
};

// In-memory sliding-window rate limiter with per-client and global ceilings
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 25;
const GLOBAL_MAX_REQUESTS_PER_WINDOW = 120;
let globalWindow = { count: 0, resetAt: 0 };

function checkRateLimit(key: string): boolean {
  const now = Date.now();

  // Periodic pruning of expired keys to prevent memory leaks
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
  }

  // Global ceiling to mitigate distributed abuse / wallet exhaustion
  if (now > globalWindow.resetAt) {
    globalWindow = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  } else {
    if (globalWindow.count >= GLOBAL_MAX_REQUESTS_PER_WINDOW) {
      return false;
    }
    globalWindow.count++;
  }

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count++;
  return true;
}

// Fallback notification cooldown — email the owner at most once per hour
let lastFallbackNotification = 0;
const FALLBACK_NOTIFY_COOLDOWN_MS = 60 * 60 * 1000;
const FALLBACK_NOTIFY_TO = "Hoordad.sedaghat@gmail.com";

async function notifyFallback(base44: any, reason: string) {
  const now = Date.now();
  if (now - lastFallbackNotification < FALLBACK_NOTIFY_COOLDOWN_MS) return;
  lastFallbackNotification = now;
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: FALLBACK_NOTIFY_TO,
      subject: "BudgetBite: OpenRouter fallback activated",
      body: `OpenRouter failed and BudgetBite is now running on the Base44 AI fallback.<br><br>Reason: ${reason}<br>Time: ${new Date().toISOString()}<br><br>This alert is rate-limited to once per hour.`,
    });
  } catch (e) {
    console.error("invokeAI: failed to send fallback notification:", e?.message || e);
  }
}

let lastTotalFailureNotification = 0;
const TOTAL_FAILURE_NOTIFY_COOLDOWN_MS = 60 * 60 * 1000;

async function notifyTotalFailure(base44: any, openRouterReason: string, base44Reason: string) {
  const now = Date.now();
  if (now - lastTotalFailureNotification < TOTAL_FAILURE_NOTIFY_COOLDOWN_MS) return;
  lastTotalFailureNotification = now;
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: FALLBACK_NOTIFY_TO,
      subject: "BudgetBite: All AI providers failed",
      body: `Both OpenRouter and the Base44 AI fallback failed. Users are currently unable to generate plans.<br><br>OpenRouter error: ${openRouterReason}<br>Base44 error: ${base44Reason}<br>Time: ${new Date().toISOString()}<br><br>This alert is rate-limited to once per hour.`,
    });
  } catch (e) {
    console.error("invokeAI: failed to send total-failure notification:", e?.message || e);
  }
}

// ─── OpenRouter recovery probe ───────────────────────────────────────────
// OpenRouter stays the default provider. When a request fails and we fall
// back to Base44, a throttled background probe keeps checking whether
// OpenRouter is back online. It costs nothing on the happy path (each user
// request already tries OpenRouter first), and self-stops once a probe
// succeeds — so the next request goes straight back to OpenRouter.
let recoveryProbing = false;
const RECOVERY_PROBE_INTERVAL_MS = 60 * 1000; // one probe per minute

function startRecoveryProbe() {
  if (recoveryProbing) return;
  recoveryProbing = true;
  (async () => {
    while (true) {
      await new Promise((r) => setTimeout(r, RECOVERY_PROBE_INTERVAL_MS));
      try {
        await callOpenRouter({ prompt: "Reply with the single word: ok", model: GEMINI_25_FLASH });
        console.log("invokeAI: OpenRouter recovery probe succeeded — back on default provider.");
        recoveryProbing = false;
        return;
      } catch (e: any) {
        console.warn("invokeAI: OpenRouter still down, staying on Base44:", e?.message || e);
      }
    }
  })().catch((e) => { recoveryProbing = false; console.error("invokeAI: recovery probe crashed:", e?.message || e); });
}

// Concurrency gate so bursts queue instead of flooding
const MAX_CONCURRENT = 8;
const QUEUE_TIMEOUT_MS = 30000;
let active = 0;
const waiters: Array<() => void> = [];

async function acquire(): Promise<boolean> {
  if (active < MAX_CONCURRENT) { active++; return true; }
  return await new Promise<boolean>((resolve) => {
    const grant = () => { clearTimeout(timer); active++; resolve(true); };
    const timer = setTimeout(() => {
      const i = waiters.indexOf(grant);
      if (i >= 0) waiters.splice(i, 1);
      resolve(false);
    }, QUEUE_TIMEOUT_MS);
    waiters.push(grant);
  });
}

function release() {
  active--;
  const next = waiters.shift();
  if (next) next();
}

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  // Extract trusted client IP:
  // Edge proxies (Cloudflare, AWS, etc.) append the connecting client IP to the end of X-Forwarded-For,
  // or set trusted headers like cf-connecting-ip or x-real-ip.
  // The first element of XFF is client-supplied and spoofable; taking the last element ensures we read
  // the hop appended by the reverse proxy.
  const xff = req.headers.get("x-forwarded-for");
  const xffHops = xff ? xff.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const trustedEdgeIp = req.headers.get("cf-connecting-ip")?.trim()
    || req.headers.get("x-real-ip")?.trim()
    || (xffHops.length > 0 ? xffHops[xffHops.length - 1] : null)
    || "anonymous";

  const rateLimitKey = user?.id ? `user:${user.id}` : `ip:${trustedEdgeIp}`;
  if (!checkRateLimit(rateLimitKey)) {
    return Response.json({ error: "Rate limit exceeded. Please wait a moment before trying again." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { prompt, response_json_schema, model, add_context_from_internet } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Missing or invalid 'prompt' parameter" }, { status: 400 });
  }

  // Prevent excessive token cost from oversized prompts
  if (prompt.length > 35000) {
    return Response.json({ error: "Prompt exceeds maximum allowed length" }, { status: 400 });
  }

  // Enforce strict low-cost model allowlist
  const safeModel = (typeof model === "string" && ALLOWED_MODELS[model]) ? ALLOWED_MODELS[model] : GEMINI_25_FLASH;

  const safeSchema = response_json_schema && typeof response_json_schema === "object"
    ? response_json_schema
    : undefined;

  if (!(await acquire())) {
    console.warn("invokeAI: queue timeout — too many concurrent requests");
    return Response.json({ openrouter_unavailable: true, error: "AI queue busy" }, { status: 503 });
  }

  let openRouterError: any = null;
  try {
    // Primary: OpenRouter using safe model
    try {
      const result = await callOpenRouter({
        prompt,
        response_json_schema: safeSchema,
        model: safeModel,
        add_context_from_internet: Boolean(add_context_from_internet),
      });
      return Response.json(safeSchema ? result : { text: result });
    } catch (orErr: any) {
      openRouterError = orErr;
      console.warn("invokeAI: OpenRouter unavailable, falling back to Base44 Core.InvokeLLM:", orErr?.message || orErr);
      notifyFallback(base44, orErr?.message || String(orErr));
      startRecoveryProbe(); // detect when OpenRouter comes back online

      // Secondary: Fallback to Base44 Core.InvokeLLM via service role
      const fallbackResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: safeSchema,
        model: "gemini_3_flash",
        add_context_from_internet: Boolean(add_context_from_internet),
      });

      return Response.json(safeSchema ? fallbackResult : { text: fallbackResult });
    }
  } catch (error: any) {
    console.error("invokeAI final error:", error?.message || error);
    notifyTotalFailure(base44, openRouterError?.message || String(openRouterError), error?.message || String(error));
    return Response.json({
      openrouter_unavailable: true,
      error: error?.message || "AI service temporarily unavailable",
      openrouter_error: openRouterError?.message || String(openRouterError),
      fallback_error: error?.message || String(error),
    }, { status: 500 });
  } finally {
    release();
  }
}