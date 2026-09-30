import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callOpenRouter, OpenRouterUnavailableError } from "../../shared/openrouter.ts";

// Allowlist of safe, low-cost models
const ALLOWED_MODELS: Record<string, string> = {
  "openai/gpt-4o-mini": "openai/gpt-4o-mini",
  "google/gemini-2.0-flash-001": "google/gemini-2.0-flash-001",
  "gemini_3_flash": "openai/gpt-4o-mini",
  "gemini_3_1_pro": "openai/gpt-4o-mini",
  "automatic": "openai/gpt-4o-mini",
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
  const safeModel = (typeof model === "string" && ALLOWED_MODELS[model]) ? ALLOWED_MODELS[model] : "openai/gpt-4o-mini";

  const safeSchema = response_json_schema && typeof response_json_schema === "object"
    ? response_json_schema
    : undefined;

  if (!(await acquire())) {
    console.warn("invokeAI: queue timeout — too many concurrent requests");
    return Response.json({ openrouter_unavailable: true, error: "AI queue busy" }, { status: 503 });
  }

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
    } catch (openRouterError: any) {
      console.warn("invokeAI: OpenRouter unavailable, falling back to Base44 Core.InvokeLLM:", openRouterError?.message || openRouterError);
      
      // Secondary: Fallback to Base44 Core.InvokeLLM via service role
      const fallbackResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: safeSchema,
        model: "gemini_3_8_flash",
        add_context_from_internet: Boolean(add_context_from_internet),
      });

      return Response.json(safeSchema ? fallbackResult : { text: fallbackResult });
    }
  } catch (error: any) {
    console.error("invokeAI final error:", error?.message || error);
    return Response.json({ openrouter_unavailable: true, error: error?.message || "AI service temporarily unavailable" }, { status: 500 });
  } finally {
    release();
  }
}