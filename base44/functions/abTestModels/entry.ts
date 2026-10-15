import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { callOpenRouter } from "../../shared/openrouter.ts";

// Admin-only A/B test: runs the SAME prompt+schema through two models
// (GPT-5 Nano and Gemini 2.5 Flash) and returns both raw results side by side.
// Does NOT persist anything — purely for output-quality comparison.

const GEMINI_25_FLASH = "google/gemini-2.5-flash";
const GPT_5_NANO = "openai/gpt-5-nano";

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);

  // Server-side admin gate — non-admins get 403 even if they reach the endpoint
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { prompt, response_json_schema, models } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Missing 'prompt' parameter" }, { status: 400 });
  }

  const targetModels: string[] = Array.isArray(models) && models.length > 0
    ? models
    : [GPT_5_NANO, GEMINI_25_FLASH];

  const safeSchema = response_json_schema && typeof response_json_schema === "object"
    ? response_json_schema
    : undefined;

  // Run both models in parallel so the admin waits for the slower one, not the sum.
  const results = await Promise.allSettled(
    targetModels.map((model) =>
      callOpenRouter({
        prompt,
        response_json_schema: safeSchema,
        model,
        add_context_from_internet: false,
      })
    )
  );

  const output = targetModels.map((model, i) => {
    const r = results[i];
    if (r.status === "fulfilled") {
      return { model, status: "ok", result: r.value };
    }
    return {
      model,
      status: "error",
      error: (r.reason as Error)?.message || String(r.reason),
    };
  });

  return Response.json({ results: output });
}