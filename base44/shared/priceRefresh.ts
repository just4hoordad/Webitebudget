import { callOpenRouter } from "./openrouter.ts";

export const TRACKED_SUPERMARKETS = [
  "Aldi",
  "Lidl",
  "Kaufland",
  "Penny",
  "Netto",
  "REWE",
  "Edeka",
  "Norma",
  "dm",
  "Rossmann"
];

const CORE_STAPLES = [
  { name: "Frische Vollmilch 3,5%", quantity: "1L" },
  { name: "Eier Bodenhaltung 10er", quantity: "10 Stk" },
  { name: "Deutsche Markenbutter 250g", quantity: "250g" },
  { name: "Bananen", quantity: "1kg" },
  { name: "Spaghetti 500g", quantity: "500g" },
  { name: "Basmati Reis 1kg", quantity: "1kg" },
  { name: "Haferflocken zart 500g", quantity: "500g" },
  { name: "Hähnchenbrustfilet", quantity: "500g" },
  { name: "Gouda jung Scheiben 400g", quantity: "400g" },
  { name: "Magerquark 500g", quantity: "500g" }
];

// One representative 5-digit postal code per German federal state (Bundesland).
// German supermarket shelf prices vary by region (federal state), so the daily
// refresh samples each tracked chain in each of these PLZs. This builds a
// region-tagged price pool; the grocery generator prefers the user's own PLZ
// and falls back to the national baseline (postal_code "").
const REGION_PLZS: { plz: string; state: string }[] = [
  { plz: "01067", state: "Sachsen" },          // Dresden
  { plz: "04109", state: "Sachsen" },          // Leipzig
  { plz: "10623", state: "Berlin" },           // Berlin-Charlottenburg
  { plz: "20095", state: "Hamburg" },          // Hamburg
  { plz: "28195", state: "Bremen" },           // Bremen
  { plz: "30159", state: "Niedersachsen" },    // Hannover
  { plz: "40210", state: "Nordrhein-Westfalen" }, // Düsseldorf
  { plz: "50667", state: "Nordrhein-Westfalen" }, // Köln
  { plz: "60311", state: "Hessen" },           // Frankfurt
  { plz: "66111", state: "Saarland" },         // Saarbrücken
  { plz: "70173", state: "Baden-Württemberg" },// Stuttgart
  { plz: "76133", state: "Baden-Württemberg" },// Karlsruhe
  { plz: "80331", state: "Bayern" },           // München
  { plz: "90402", state: "Bayern" },           // Nürnberg
  { plz: "24103", state: "Schleswig-Holstein" },// Kiel
  { plz: "18055", state: "Mecklenburg-Vorpommern" }, // Rostock
  { plz: "39104", state: "Sachsen-Anhalt" },   // Magdeburg
  { plz: "99084", state: "Thüringen" },        // Erfurt
  { plz: "06108", state: "Sachsen-Anhalt" },   // Halle
  { plz: "07743", state: "Thüringen" },        // Jena
  { plz: "38820", state: "Sachsen-Anhalt" },   // Halberstadt (rural)
  { plz: "15230", state: "Brandenburg" },      // Frankfurt (Oder)
];

function getEasterSunday(year: number): { month: number; day: number } {
  // Meeus/Jones/Butcher algorithm for Gregorian Easter
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

export function isGermanSupermarketClosed(date: Date = new Date()): { closed: boolean; reason?: string; dateStr: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const weekday = getPart("weekday"); // "Sun", "Mon", ...
  const year = parseInt(getPart("year"), 10);
  const month = parseInt(getPart("month"), 10);
  const day = parseInt(getPart("day"), 10);
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // 1. Sunday check (Ladenschlussgesetz - stores in Germany closed by federal law)
  if (weekday === "Sun") {
    return { closed: true, reason: "Sunday (Sonntagsruhe - German supermarkets closed by law)", dateStr };
  }

  // 2. Fixed national public holidays in Germany
  const fixedHolidays: Record<string, string> = {
    "1-1": "Neujahr (New Year's Day)",
    "1-6": "Heilige Drei Könige (Epiphany)",
    "5-1": "Tag der Arbeit (Labour Day)",
    "10-3": "Tag der Deutschen Einheit (German Unity Day)",
    "10-31": "Reformationstag",
    "11-1": "Allerheiligen (All Saints' Day)",
    "12-25": "1. Weihnachtstag (Christmas Day)",
    "12-26": "2. Weihnachtstag (Boxing Day)",
  };
  const key = `${month}-${day}`;
  if (fixedHolidays[key]) {
    return { closed: true, reason: `German Public Holiday: ${fixedHolidays[key]}`, dateStr };
  }

  // 3. Dynamic Easter-dependent holidays
  const easter = getEasterSunday(year);
  const easterDate = new Date(Date.UTC(year, easter.month - 1, easter.day));
  
  const addDays = (d: Date, n: number) => {
    const res = new Date(d);
    res.setUTCDate(res.getUTCDate() + n);
    return res;
  };

  const dynamicHolidays = [
    { date: addDays(easterDate, -2), name: "Karfreitag (Good Friday)" },
    { date: addDays(easterDate, 1), name: "Ostermontag (Easter Monday)" },
    { date: addDays(easterDate, 39), name: "Christi Himmelfahrt (Ascension Day)" },
    { date: addDays(easterDate, 50), name: "Pfingstmontag (Whit Monday)" },
    { date: addDays(easterDate, 60), name: "Fronleichnam (Corpus Christi)" },
  ];

  for (const h of dynamicHolidays) {
    if (h.date.getUTCMonth() + 1 === month && h.date.getUTCDate() === day) {
      return { closed: true, reason: `German Public Holiday: ${h.name}`, dateStr };
    }
  }

  return { closed: false, dateStr };
}

// Dry-run variant of performPriceRefresh: runs the OpenRouter price query
// but does NOT persist results. Used by the admin on-demand OpenRouter
// check so the owner can verify the provider is responding without writing
// PriceEstimate records. Returns provider status + a sample of parsed items.
export async function performPriceRefreshDryRun(base44: any) {
  const closure = isGermanSupermarketClosed();
  const today = closure.dateStr;

  // Bypass the Sunday/holiday skip for an on-demand check — the admin wants to
  // know if OpenRouter works *now*, regardless of whether shops are open.
  const svc = base44.asServiceRole;

  // Build a small representative query: one core staple across 3 chains, one PLZ.
  const sampleQueries = [
    { product: "Frische Vollmilch 3,5%", store: "REWE", quantity: "1L", plz: "10115", state: "Berlin" },
    { product: "Eier Bodenhaltung 10er", store: "Aldi", quantity: "10 Stk", plz: "10115", state: "Berlin" },
    { product: "Deutsche Markenbutter 250g", store: "Lidl", quantity: "250g", plz: "10115", state: "Berlin" },
  ];

  const lines = sampleQueries.map((q, idx) =>
    `${idx + 1}. [${q.store}] ${q.product} (qty: ${q.quantity}, PLZ: ${q.plz}, Bundesland: ${q.state})`
  );

  const prompt = `You are a German supermarket price analyst. Today is ${today}.
Provide the current shelf price for each product at the specified supermarket in the specified postal code (PLZ).

Products to check:
${lines.join("\n")}

Return JSON with an "items" array where each object has:
- name, store, postal_code, price (EUR number), quantity, normal_price (EUR number)
Return only the JSON object.`;

  const startedAt = Date.now();
  let provider = "openrouter";
  let fallbackUsed = false;
  let httpStatus: number | null = null;
  let res: any;

  try {
    res = await callOpenRouter({
      prompt,
      add_context_from_internet: true,
      model: "openai/gpt-4o-mini",
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                store: { type: "string" },
                postal_code: { type: "string" },
                price: { type: "number" },
                quantity: { type: "string" },
                normal_price: { type: "number" },
              },
            },
          },
        },
      },
    });
  } catch (err: any) {
    // Fallback to Base44 InvokeLLM (same fallback as the real refresh)
    fallbackUsed = true;
    provider = "base44-invoke-llm";
    try {
      res = await svc.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  store: { type: "string" },
                  postal_code: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "string" },
                  normal_price: { type: "number" },
                },
              },
            },
          },
        },
      });
    } catch (fallbackErr: any) {
      return {
        status: "error",
        openrouter_ok: false,
        fallback_used: false,
        provider,
        duration_ms: Date.now() - startedAt,
        date: today,
        error: err?.message || String(err),
        fallback_error: fallbackErr?.message || String(fallbackErr),
        items: [],
      };
    }
  }

  const items = Array.isArray(res?.items) ? res.items : [];
  const normalized = items
    .map((it: any) => ({
      product_name: it.name,
      store: it.store || "",
      postal_code: it.postal_code || "",
      price: typeof it.price === "number" ? it.price : null,
      quantity: it.quantity || "",
      normal_price: typeof it.normal_price === "number" ? it.normal_price : it.price,
    }))
    .filter((r: any) => r.product_name && typeof r.price === "number");

  return {
    status: "success",
    openrouter_ok: !fallbackUsed,
    fallback_used: fallbackUsed,
    provider,
    duration_ms: Date.now() - startedAt,
    date: today,
    supermarket_closed: closure.closed,
    closure_reason: closure.reason || null,
    items_returned: normalized.length,
    items: normalized.slice(0, 10),
  };
}

export async function performPriceRefresh(base44: any) {
  // Check if supermarkets are closed today (Sunday or German public holiday)
  const closure = isGermanSupermarketClosed();
  if (closure.closed) {
    console.log(`[PriceRefresh] Supermarkets closed today: ${closure.reason}`);
    return {
      skipped: true,
      refreshed: 0,
      reason: closure.reason,
      date: closure.dateStr,
      message: `No price update performed because German supermarkets are closed: ${closure.reason}`
    };
  }

  const svc = base44.asServiceRole;
  const today = closure.dateStr;

  // Retrieve recent price observations to identify candidates
  const recent = await svc.entities.PriceEstimate.list("-fetched_date", 500);

  // Group latest observation per store and product
  const latestBy = new Map<string, any>();
  (recent || []).forEach((r: any) => {
    const store = (r.store || "").trim();
    const product = (r.product_name || "").trim().toLowerCase();
    const key = `${store.toLowerCase()}|${product}`;
    const prev = latestBy.get(key);
    if (!prev || (r.fetched_date || "") > (prev.fetched_date || "")) {
      latestBy.set(key, r);
    }
  });

  // Ensure every supermarket is covered per region (dont miss a single one!)
  // Each store is sampled across REGION_PLZS so region-specific prices accumulate.
  // Each run rotates which 3 core staples are used per (store, region) to keep
  // variety across days while bounding the per-run query count.
  const queriesToMake: { product: string; store: string; quantity: string; plz: string; state: string }[] = [];
  const dayIndex = Math.floor(Date.now() / 86400000); // rotates daily
  const stapleRotation = CORE_STAPLES.slice(dayIndex % CORE_STAPLES.length, (dayIndex % CORE_STAPLES.length) + 3)
    .concat(CORE_STAPLES.slice(0, Math.max(0, (dayIndex % CORE_STAPLES.length) + 3 - CORE_STAPLES.length)));

  for (const store of TRACKED_SUPERMARKETS) {
    for (const region of REGION_PLZS) {
      // Find the latest observation for this exact (store, product, region)
      const hasFreshForRegion = [...latestBy.values()].some(
        (r: any) =>
          (r.store || "").toLowerCase() === store.toLowerCase() &&
          (r.postal_code || "") === region.plz &&
          (r.fetched_date || "") >= today
      );
      if (hasFreshForRegion) continue;

      // Pick stale regional items first; otherwise refresh rotated core staples.
      const staleRegional = [...latestBy.values()]
        .filter((r: any) =>
          (r.store || "").toLowerCase() === store.toLowerCase() &&
          (r.postal_code || "") === region.plz &&
          (r.fetched_date || "") < today
        )
        .sort((a: any, b: any) => (a.fetched_date || "").localeCompare(b.fetched_date || ""));

      const picks = staleRegional.length >= 3
        ? staleRegional.slice(0, 3).map((it: any) => ({ product: it.product_name, quantity: it.quantity || "1 Stk" }))
        : stapleRotation.map((s) => ({ product: s.name, quantity: s.quantity }));

      picks.forEach((p) => {
        queriesToMake.push({ product: p.product, store, quantity: p.quantity, plz: region.plz, state: region.state });
      });
    }
  }

  if (queriesToMake.length === 0) {
    return { refreshed: 0, message: "All supermarket prices are already fresh for today across all regions." };
  }

  // Cap the per-run query count to keep the LLM call within limits — sample evenly
  // across (store, region) pairs when the full matrix is too large.
  const MAX_QUERIES = 120;
  let finalQueries = queriesToMake;
  if (queriesToMake.length > MAX_QUERIES) {
    const step = Math.ceil(queriesToMake.length / MAX_QUERIES);
    finalQueries = queriesToMake.filter((_, i) => i % step === 0).slice(0, MAX_QUERIES);
  }

  const lines = finalQueries.map((q, idx) =>
    `${idx + 1}. [${q.store}] ${q.product} (qty: ${q.quantity}, PLZ: ${q.plz}, Bundesland: ${q.state})`
  );

  const prompt = `You are a German supermarket price analyst updating daily shelf prices across all German supermarket chains, sampled per federal state (Bundesland).
Today is ${today}. German supermarkets have updated their daily shelf prices for morning trade.
Provide the current shelf price for each product at the specified supermarket in the specified postal code (PLZ). Prices in Germany vary by region — use the regional price for that exact PLZ when available, not a national average.

Products to check:
${lines.join("\n")}

Return JSON with an "items" array where each object has:
- name: product name
- store: exact supermarket chain (Aldi, Lidl, Kaufland, Penny, Netto, REWE, Edeka, Norma, dm, Rossmann)
- postal_code: the 5-digit PLZ from the request (must match one of the PLZs listed above)
- price: current shelf price in EUR as a number (e.g. 1.19) for that PLZ region
- quantity: package size (e.g. "1L", "250g")
- normal_price: regular non-promotional price in EUR as a number
Return only the JSON object.`;

  let res;
  try {
    res = await callOpenRouter({
      prompt,
      add_context_from_internet: true,
      model: "openai/gpt-4o-mini",
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                store: { type: "string" },
                postal_code: { type: "string" },
                price: { type: "number" },
                quantity: { type: "string" },
                normal_price: { type: "number" },
              },
            },
          },
        },
      },
    });
  } catch (llmErr) {
    console.warn("OpenRouter call failed in performPriceRefresh, falling back:", llmErr);
    res = await svc.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                store: { type: "string" },
                postal_code: { type: "string" },
                price: { type: "number" },
                quantity: { type: "string" },
                normal_price: { type: "number" },
              },
            },
          },
        },
      },
    });
  }

  const items = Array.isArray(res?.items) ? res.items : [];
  const records = items
    .map((it: any) => ({
      product_name: it.name,
      postal_code: it.postal_code || "",
      store: it.store || "",
      price: typeof it.price === "number" ? it.price : null,
      quantity: it.quantity || "",
      normal_price: typeof it.normal_price === "number" ? it.normal_price : it.price,
      currency: "eur",
      source: "daily-supermarket-shelf-sync",
      fetched_date: today,
    }))
    .filter((r: any) => r.product_name && typeof r.price === "number");

  let created = 0;
  if (records.length) {
    await svc.entities.PriceEstimate.bulkCreate(records);
    created = records.length;
  }

  const storesCovered = [...new Set(records.map((r: any) => r.store))];
  const regionsCovered = [...new Set(records.map((r: any) => r.postal_code).filter(Boolean))];

  return {
    refreshed: created,
    stores_checked: TRACKED_SUPERMARKETS.length,
    stores_updated: storesCovered,
    regions_updated: regionsCovered.length,
    date: today,
    status: "success"
  };
}