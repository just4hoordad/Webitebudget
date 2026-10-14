import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from "base44:runtime";

// Isolated evaluation runner: calls Qwen3.5-9B and the current production model
// directly through OpenRouter for each representative AI task, validates the
// outputs, and returns a side-by-side comparison. Nothing is persisted and no
// production model setting is changed.

const QWEN_MODEL = "qwen/qwen3.5-9b";
const CURRENT_MODEL = "google/gemini-2.0-flash-001";

// Rough per-million-token rates (USD) for cost estimation only.
const RATES: Record<string, { in: number; out: number }> = {
  "qwen/qwen3.5-9b": { in: 0.11, out: 0.17 },
  "google/gemini-2.0-flash-001": { in: 0.10, out: 0.04 },
};

interface CallResult {
  ok: boolean;
  latency: number;
  error?: string;
  parsed?: any;
  parseError?: string;
  tokens?: { prompt: number; completion: number } | null;
  costEst?: number | null;
}

async function callModel(model: string, prompt: string, schema: any, online: boolean): Promise<CallResult> {
  const apiKey = secrets.get("openrouter");
  if (!apiKey) return { ok: false, latency: 0, error: "Missing 'openrouter' secret" };

  let selected = model;
  if (online && !selected.endsWith(":online")) selected = `${selected}:online`;

  let finalPrompt = prompt;
  if (schema) {
    finalPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching this schema without markdown code blocks:\n${JSON.stringify(schema)}`;
  }

  const payload: Record<string, unknown> = {
    model: selected,
    messages: [
      { role: "system", content: schema ? "Return raw, valid JSON only. No markdown backticks, explanations, or commentary." : "You are an AI assistant for BudgetBite, a smart grocery and meal planning tool." },
      { role: "user", content: finalPrompt },
    ],
    max_tokens: 8000,
  };
  if (schema) payload.response_format = { type: "json_object" };

  const headers = {
    Authorization: `Bearer ${apiKey.trim()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://webitebudget.base44.app",
    "X-Title": "BudgetBite-Eval",
  };

  const start = Date.now();
  try {
    let res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90000),
    });

    // If the :online suffix caused a non-429 failure, retry without it.
    if (!res.ok && res.status !== 429 && selected.endsWith(":online")) {
      payload.model = selected.replace(/:online$/, "");
      res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000),
      });
    }

    const latency = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, latency, error: `HTTP ${res.status}: ${errText.slice(0, 300)}` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || null;

    let parsed: any = null;
    let parseError: string | undefined;
    if (schema) {
      try {
        let cleaned = content.trim();
        if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        parsed = JSON.parse(cleaned);
      } catch (e: any) {
        parseError = e.message;
      }
    }

    const tokens = usage ? { prompt: usage.prompt_tokens || 0, completion: usage.completion_tokens || 0 } : null;
    const rate = RATES[model];
    const costEst = tokens && rate ? +(tokens.prompt * rate.in / 1e6 + tokens.completion * rate.out / 1e6).toFixed(6) : null;

    return { ok: true, latency, parsed, parseError, tokens, costEst };
  } catch (e: any) {
    return { ok: false, latency: Date.now() - start, error: e?.message || String(e) };
  }
}

// --- Schemas (compact, representative subsets of the real app schemas) ---

const GROCERY_SCHEMA = {
  type: "object",
  properties: {
    total_estimated_cost: { type: "number" },
    categories: { type: "array", items: { type: "object", properties: {
      name: { type: "string" },
      items: { type: "array", items: { type: "object", properties: {
        name: { type: "string" }, quantity: { type: "string" }, price: { type: "number" }, store: { type: "string" }, total_kcal: { type: "number" },
      } } },
    } } },
  },
};

const MEAL_PLAN_SCHEMA = {
  type: "object",
  properties: {
    days: { type: "array", items: { type: "object", properties: {
      day: { type: "string" },
      breakfast: { type: "string" }, breakfast_calories: { type: "number" },
      lunch: { type: "string" }, lunch_calories: { type: "number" },
      dinner: { type: "string" }, dinner_calories: { type: "number" },
    } } },
  },
};

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    prep_time: { type: "number" },
    cook_time: { type: "number" },
    servings: { type: "number" },
    ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
    steps: { type: "array", items: { type: "string" } },
  },
};

const SWAP_SCHEMA = {
  type: "object",
  properties: {
    alternatives: { type: "array", items: { type: "object", properties: {
      name: { type: "string" }, calories: { type: "number" },
      ingredients: { type: "array", items: { type: "object", properties: { name: { type: "string" }, quantity: { type: "string" } } } },
    } } },
  },
};

const PRICE_SCHEMA = {
  type: "object",
  properties: {
    items: { type: "array", items: { type: "object", properties: {
      name: { type: "string" }, store: { type: "string" }, price: { type: "number" }, quantity: { type: "string" },
    } } },
  },
};

// --- Task definitions ---

const TASKS = [
  {
    id: "grocery",
    name: "Grocery list generation",
    online: false,
    prompt: `Generate a grocery list for 1 person with a balanced diet in Germany, covering 3 days. Budget: €30. Stores: Aldi, Lidl. Calories: ~2000 kcal/day. Use real 2025 German supermarket prices. Include 8-12 distinct products across proteins, grains, vegetables, fruit and dairy. All text in English. Category names in English (e.g. Dairy, Vegetables). For each item: name (branded product name), quantity (e.g. "1 × 500g"), price (EUR), store, total_kcal.`,
    schema: GROCERY_SCHEMA,
    validate: (r: any) => {
      const items = (r?.categories || []).flatMap((c: any) => c.items || []);
      if (!items.length) return { valid: false, note: "No items returned" };
      if (items.length < 5) return { valid: false, note: `Only ${items.length} items (need ≥5)` };
      const withPrice = items.filter((i: any) => Number(i.price) > 0);
      if (withPrice.length < items.length * 0.8) return { valid: false, note: "Many items missing valid prices" };
      const total = items.reduce((s: number, i: any) => s + Number(i.price || 0), 0);
      return { valid: true, note: `${items.length} items, €${total.toFixed(2)} total` };
    },
  },
  {
    id: "meal_plan",
    name: "Meal plan generation",
    online: false,
    prompt: `Create a 3-day meal plan for 1 person. Available products: Ja! Vollmilch 1L (Aldi), Milbona Naturjoghurt 500g (Lidl), Gut & Günstig Haferflocken 500g (Lidl), Combino Penne 500g (Lidl), Rio d'oro Tomaten Passata 500g (Aldi), Bellasan Hähnchenbrust 500g (Aldi), Sweet Valley TK-Erbsen 1kg (Aldi), Crownfield Schoko-Müsli 1kg (Lidl). Target: 2000 kcal/day. All text in English. Use ONLY these products. Each day: breakfast, lunch, dinner with calories.`,
    schema: MEAL_PLAN_SCHEMA,
    validate: (r: any) => {
      const days = r?.days || [];
      if (days.length < 3) return { valid: false, note: `Only ${days.length} days (need 3)` };
      const complete = days.filter((d: any) => d.breakfast && d.lunch && d.dinner);
      if (complete.length < 3) return { valid: false, note: "Some days missing meals" };
      const withCal = days.filter((d: any) => Number(d.breakfast_calories) > 0 || Number(d.lunch_calories) > 0 || Number(d.dinner_calories) > 0);
      return { valid: withCal.length >= 2, note: `${days.length} days, ${withCal.length} with calorie data` };
    },
  },
  {
    id: "recipe",
    name: "Recipe generation",
    online: false,
    prompt: `Write a cooking recipe for "Pasta with tomato sauce and chicken" for 2 people. Available ingredients: 250g penne, 400g passata, 200g chicken breast, 1 onion, olive oil, salt, pepper. Return: title, prep_time (min), cook_time (min), servings, ingredients[{name, quantity}], steps[] (concise, ordered). All text in English.`,
    schema: RECIPE_SCHEMA,
    validate: (r: any) => {
      if (!r?.title) return { valid: false, note: "Missing title" };
      if (!Array.isArray(r.ingredients) || r.ingredients.length < 3) return { valid: false, note: `Only ${r.ingredients?.length || 0} ingredients` };
      if (!Array.isArray(r.steps) || r.steps.length < 3) return { valid: false, note: `Only ${r.steps?.length || 0} steps` };
      return { valid: true, note: `${r.ingredients.length} ingredients, ${r.steps.length} steps` };
    },
  },
  {
    id: "swap",
    name: "Meal swap suggestions",
    online: false,
    prompt: `Suggest 2 alternative breakfast meals to replace "Oats with milk". Target: ~500 kcal. Available ingredients: Ja! Vollmilch 1L, Gut & Günstig Haferflocken 500g, Crownfield Schoko-Müsli 1kg, Milbona Naturjoghurt 500g, Combino Penne 500g, Rio d'oro Tomaten Passata 500g. Each alternative: name, calories, ingredients[{name, quantity}]. All text in English.`,
    schema: SWAP_SCHEMA,
    validate: (r: any) => {
      const alts = r?.alternatives || [];
      if (alts.length < 2) return { valid: false, note: `Only ${alts.length} alternatives (need 2)` };
      const withCal = alts.filter((a: any) => Number(a.calories) > 0);
      return { valid: withCal.length >= 1, note: `${alts.length} alternatives, ${withCal.length} with calories` };
    },
  },
  {
    id: "price_research",
    name: "Price research (web search)",
    online: true,
    prompt: `You are a German supermarket price analyst. Today is ${new Date().toISOString().slice(0, 10)}. Provide the current shelf price for each product at the specified German supermarket:
1. [REWE] Frische Vollmilch 3,5% 1L
2. [Aldi] Eier Bodenhaltung 10er
3. [Lidl] Deutsche Markenbutter 250g
Return JSON with an "items" array where each object has: name, store, price (EUR number), quantity. Return only the JSON object.`,
    schema: PRICE_SCHEMA,
    validate: (r: any) => {
      const items = r?.items || [];
      if (items.length < 2) return { valid: false, note: `Only ${items.length} price items returned` };
      const withPrice = items.filter((i: any) => Number(i.price) > 0);
      return { valid: withPrice.length >= 2, note: `${items.length} items, ${withPrice.length} with valid prices` };
    },
  },
];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: "Unauthorized — sign in as admin" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    const results = [];
    for (const task of TASKS) {
      const [qwenRes, currentRes] = await Promise.allSettled([
        callModel(QWEN_MODEL, task.prompt, task.schema, task.online),
        callModel(CURRENT_MODEL, task.prompt, task.schema, task.online),
      ]);
      const qwen: CallResult = qwenRes.status === "fulfilled" ? qwenRes.value : { ok: false, latency: 0, error: String(qwenRes.reason) };
      const current: CallResult = currentRes.status === "fulfilled" ? currentRes.value : { ok: false, latency: 0, error: String(currentRes.reason) };

      const score = (r: CallResult) => {
        if (!r.ok) return { valid: false, note: r.error || "Call failed" };
        if (r.parseError) return { valid: false, note: `JSON parse error: ${r.parseError}` };
        if (task.schema && !r.parsed) return { valid: false, note: "No structured output" };
        return task.validate(r.parsed);
      };

      results.push({
        id: task.id,
        name: task.name,
        online: task.online,
        qwen: { ...qwen, validity: score(qwen) },
        current: { ...current, validity: score(current) },
      });
    }

    return Response.json({
      models: { qwen: QWEN_MODEL, current: CURRENT_MODEL },
      rates: RATES,
      tasks: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}