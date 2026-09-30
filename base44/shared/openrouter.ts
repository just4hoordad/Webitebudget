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

  let selectedModel = model || "openai/gpt-4o-mini";
  if (
    selectedModel === "gemini_3_1_pro" ||
    selectedModel === "gemini_3_flash" ||
    selectedModel === "automatic"
  ) {
    selectedModel = "openai/gpt-4o-mini";
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
  };

  if (response_json_schema) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://webitebudget.base44.app",
      "X-Title": "BudgetBite",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    // If online search model suffix failed, retry without it
    if (selectedModel.endsWith(":online")) {
      payload.model = selectedModel.replace(/:online$/, "");
      const retry = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://webitebudget.base44.app",
          "X-Title": "BudgetBite",
        },
        body: JSON.stringify(payload),
      });
      if (retry.ok) {
        const d = await retry.json();
        const content = d.choices?.[0]?.message?.content || "";
        if (response_json_schema) {
          return JSON.parse(sanitizeJson(content));
        }
        return content;
      }
    }
    throw new Error(`OpenRouter returned HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || "";

  if (response_json_schema) {
    return JSON.parse(sanitizeJson(rawContent));
  }
  return rawContent;
}