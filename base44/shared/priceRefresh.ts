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

  // Ensure every supermarket is covered (dont miss a single one!)
  const queriesToMake: { product: string; store: string; quantity: string; plz: string }[] = [];

  for (const store of TRACKED_SUPERMARKETS) {
    // Find stale items for this specific store
    const storeItems = [...latestBy.values()].filter(
      (r: any) => (r.store || "").toLowerCase() === store.toLowerCase()
    );
    const staleStoreItems = storeItems
      .filter((r: any) => (r.fetched_date || "") < today)
      .sort((a: any, b: any) => (a.fetched_date || "").localeCompare(b.fetched_date || ""));

    if (staleStoreItems.length >= 3) {
      staleStoreItems.slice(0, 3).forEach((item) => {
        queriesToMake.push({
          product: item.product_name,
          store,
          quantity: item.quantity || "1 Stk",
          plz: item.postal_code || "national"
        });
      });
    } else {
      // If store has fewer stale items, pick core staples to ensure it is updated
      const sampleStaples = CORE_STAPLES.slice(0, 3);
      sampleStaples.forEach((staple) => {
        queriesToMake.push({
          product: staple.name,
          store,
          quantity: staple.quantity,
          plz: "national"
        });
      });
    }
  }

  if (queriesToMake.length === 0) {
    return { refreshed: 0, message: "All supermarket prices are already fresh for today." };
  }

  const lines = queriesToMake.map((q, idx) =>
    `${idx + 1}. [${q.store}] ${q.product} (qty: ${q.quantity}, PLZ: ${q.plz})`
  );

  const prompt = `You are a German supermarket price analyst updating daily shelf prices across all German supermarkets.
Today is ${today}. German supermarkets have updated their daily shelf prices for morning trade.
Check and provide current shelf prices in Germany for each product at the specified supermarket. Every single supermarket (Aldi, Lidl, Kaufland, Penny, Netto, REWE, Edeka, Norma, dm, Rossmann) must be accurately updated without missing any store.

Products to check:
${lines.join("\n")}

Return JSON with an "items" array where each object has:
- name: product name
- store: exact supermarket chain (Aldi, Lidl, Kaufland, Penny, Netto, REWE, Edeka, Norma, dm, Rossmann)
- postal_code: 5-digit PLZ or ""
- price: current shelf price in EUR as a number (e.g. 1.19)
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

  return {
    refreshed: created,
    stores_checked: TRACKED_SUPERMARKETS.length,
    stores_updated: storesCovered,
    date: today,
    status: "success"
  };
}