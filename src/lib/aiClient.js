import { base44 } from "@/api/base44Client";

/**
 * Invokes AI through the user's OpenRouter API key via the invokeAI backend function,
 * avoiding consumption of Base44 integration credits.
 * Automatically falls back to Base44 Core InvokeLLM if the external call fails.
 */
export async function invokeAI({ prompt, response_json_schema, model, add_context_from_internet }) {
  try {
    const res = await base44.functions.invoke("invokeAI", {
      prompt,
      response_json_schema,
      model,
      add_context_from_internet: Boolean(add_context_from_internet),
    });

    if (res?.data) {
      if (res.data.error) {
        throw new Error(res.data.error);
      }
      if (response_json_schema) {
        return res.data;
      }
      return typeof res.data.text === "string" ? res.data.text : res.data;
    }
  } catch (err) {
    console.warn("OpenRouter invokeAI call failed, falling back to Base44 Core InvokeLLM:", err);
  }

  return await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema,
    model: model || "automatic",
    add_context_from_internet: Boolean(add_context_from_internet),
  });
}