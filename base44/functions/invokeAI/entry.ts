import { callOpenRouter } from "../../shared/openrouter.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, response_json_schema, model, add_context_from_internet } = body;

    if (!prompt) {
      return Response.json({ error: "Missing 'prompt' parameter" }, { status: 400 });
    }

    const result = await callOpenRouter({
      prompt,
      response_json_schema,
      model,
      add_context_from_internet,
    });

    if (response_json_schema) {
      return Response.json(result);
    }
    return Response.json({ text: result });
  } catch (error: any) {
    console.error("invokeAI error:", error?.message || error);
    return Response.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}