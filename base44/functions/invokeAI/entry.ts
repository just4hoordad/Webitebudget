import { callOpenRouter, OpenRouterUnavailableError } from "../../shared/openrouter.ts";

// Simple in-memory concurrency gate so bursts queue instead of flooding OpenRouter.
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
  const body = await req.json().catch(() => ({}));
  const { prompt, response_json_schema, model, add_context_from_internet } = body;

  if (!prompt) {
    return Response.json({ error: "Missing 'prompt' parameter" }, { status: 400 });
  }

  if (!(await acquire())) {
    console.warn("invokeAI: queue timeout — too many concurrent requests");
    return Response.json({ openrouter_unavailable: true, error: "AI queue busy" });
  }

  try {
    const result = await callOpenRouter({ prompt, response_json_schema, model, add_context_from_internet });
    return Response.json(response_json_schema ? result : { text: result });
  } catch (error: any) {
    console.error("invokeAI error:", error?.message || error);
    if (error instanceof OpenRouterUnavailableError) {
      return Response.json({ openrouter_unavailable: true, status: error.status, error: error.message });
    }
    return Response.json({ error: error?.message || "Internal server error" }, { status: 500 });
  } finally {
    release();
  }
}