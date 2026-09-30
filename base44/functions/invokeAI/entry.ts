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

// In-memory sliding-window rate limiter per client IP: max 25 requests per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 25;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (!checkRateLimit(clientIp)) {
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
      const base44 = createClientFromRequest(req);
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