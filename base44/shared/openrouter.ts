import { secrets } from "base44:runtime";

function sanitizeJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return cleaned;
}

export interface OpenRouterOptions {
  prompt: string;
  response_json_schema?: Record<string, unknown>;
  model?: string;
  add_context_from_internet?: boolean;
}

export class OpenRouterUnavailableError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST to OpenRouter; on 429 wait (Retry-After, max 10s) and retry once.
// Bounded to 90s via AbortController so a stalled provider triggers the
// Base44 fallback instead of hanging the request forever.
const OPENROUTER_TIMEOUT_MS = 60000;
async function post(apiKey: string, payload: Record<string, unknown>): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
  const send = () => fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://webitebudget.base44.app",
      "X-Title": "BudgetBite",
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  try {
    const res = await send();
    if (res.status !== 429) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 10000) : 10000;
    console.warn(`OpenRouter 429 — retrying in ${waitMs}ms`);
    await sleep(waitMs);
    return await send();
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new OpenRouterUnavailableError(408, `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callOpenRouter({
  prompt,
  response_json_schema,
  model,
  add_context_from_internet,
}: OpenRouterOptions): Promise<any> {
  const apiKey = secrets.get("openrouter");
  if (!apiKey) {
    throw new Error("Missing 'openrouter' secret in Settings -> Secrets.");
  }

  // Enforce strict allowlist of low-cost models to prevent cost abuse
  const ALLOWED_OPENROUTER_MODELS = new Set([
    "deepseek/deepseek-v4-flash-0731",
    "google/gemini-2.5-pro",
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini",
    "openai/gpt-5-nano",
    "google/gemini-2.0-flash-001"
  ]);

  let selectedModel = "google/gemini-2.5-flash";
  if (model && ALLOWED_OPENROUTER_MODELS.has(model)) {
    selectedModel = model;
  }

  if (add_context_from_internet && !selectedModel.endsWith(":online")) {
    selectedModel = `${selectedModel}:online`;
  }

  let finalPrompt = prompt;
  if (response_json_schema) {
    finalPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching this schema without markdown code blocks:\n${JSON.stringify(
      response_json_schema
    )}`;
  }

  const messages = [
    {
      role: "system",
      content: response_json_schema
        ? "You are an AI assistant. Return raw, valid JSON only. Do not add markdown backticks, explanations, or commentary."
        : "You are an AI assistant for BudgetBite, a smart grocery and meal planning tool.",
    },
    { role: "user", content: finalPrompt },
  ];

  const payload: Record<string, unknown> = {
    model: selectedModel,
    messages,
    max_tokens: 16000,
  };

  // Constrain routing to DeepInfra for DeepSeek (lowest-cost provider)
  if (selectedModel.startsWith("deepseek/")) {
    payload.provider = {
      order: ["DeepInfra"],
      allow_fallbacks: false,
    };
  }
  // Gemini 2.5 Flash: let OpenRouter pick the best available provider
  if (selectedModel.startsWith("google/gemini-2.5-flash")) {
    payload.provider = {
      allow_fallbacks: true,
    };
  }

  if (response_json_schema) {
    payload.response_format = { type: "json_object" };
  }

  const parse = async (r: Response) => {
    const d = await r.json();
    const content = d.choices?.[0]?.message?.content || "";
    return response_json_schema ? JSON.parse(sanitizeJson(content)) : content;
  };

  let res = await post(apiKey, payload);

  // If online search model suffix failed (non-rate-limit), retry without it
  if (!res.ok && res.status !== 429 && selectedModel.endsWith(":online")) {
    payload.model = selectedModel.replace(/:online$/, "");
    res = await post(apiKey, payload);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new OpenRouterUnavailableError(res.status, `OpenRouter returned HTTP ${res.status}: ${errText}`);
  }

  return await parse(res);
}