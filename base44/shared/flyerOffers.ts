import { isGermanSupermarketClosed } from "./priceRefresh.ts";

// Chains whose weekly flyers we scrape via marktguru's public retailer pages.
// marktguru renders client-side, so we read offer data through an LLM with web
// context pointed at each chain's public leaflet listing — robust against
// markup changes and legally clean (public brochure data).
const FLYER_CHAINS: { chain: string; marktguruSlug: string }[] = [
  { chain: "Aldi", marktguruSlug: "aldi-sued-prospekte" },
  { chain: "Lidl", marktguruSlug: "lidl-prospekte" },
  { chain: "Penny", marktguruSlug: "penny-prospekte" },
  { chain: "Netto", marktguruSlug: "netto-marken-discount-prospekte" },
  { chain: "Norma", marktguruSlug: "norma-prospekte" },
];

// Offer items are national weekly promotions — they are not region-specific,
// so we store them with postal_code "" (national baseline). The grocery
// generator's fetchKnownPrices already blends national + regional records.
export async function performFlyerRefresh(base44: any) {
  const closure = isGermanSupermarketClosed();
  if (closure.closed) {
    return {
      skipped: true,
      refreshed: 0,
      reason: closure.reason,
      date: closure.dateStr,
      message: `No flyer refresh performed because German supermarkets are closed: ${closure.reason}`,
    };
  }

  const svc = base44.asServiceRole;
  const today = closure.dateStr;
  const records: any[] = [];

  // Process chains in bounded parallel batches to respect the 6-connection limit.
  const batchSize = 4;
  for (let i = 0; i < FLYER_CHAINS.length; i += batchSize) {
    const batch = FLYER_CHAINS.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((c) => fetchChainOffers(svc, c, today))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.length) records.push(...r.value);
    }
  }

  let created = 0;
  if (records.length) {
    await svc.entities.PriceEstimate.bulkCreate(records);
    created = records.length;
  }

  return {
    refreshed: created,
    chains_processed: FLYER_CHAINS.length,
    chains_with_offers: [...new Set(records.map((r) => r.store))],
    date: today,
    status: "success",
  };
}

// Ask the LLM (with web context) to extract the current week's promotional
// offers for one chain. Returns PriceEstimate-shaped records.
async function fetchChainOffers(svc: any, chain: { chain: string; marktguruSlug: string }, today: string): Promise<any[]> {
  const url = `https://www.marktguru.de/rp/${chain.marktguruSlug}`;
  const prompt = `You are a German supermarket flyer analyst. Visit ${url} (marktguru's public page listing this week's leaflets for ${chain.chain}) and extract the CURRENT WEEK's promotional offers — the leaflet that is valid TODAY (${today}), not upcoming or expired ones.

For each promotional item, return:
- name: the real product name with brand as shown in the flyer (e.g. "Gut & Günstig Vollmilch 1L", "ja! Hackfleisch 500g")
- price: the promotional sale price in EUR as a number
- normal_price: the regular non-promotional price in EUR as a number (when the flyer shows a "statt" / crossed-out price, use that; otherwise estimate the realistic regular price for the same product/quantity)
- quantity: package size as shown (e.g. "1L", "500g", "10 Stk")

Return only JSON: { "items": [ { name, price, normal_price, quantity }, ... ] }. Include 20–80 items from the current week's leaflet. If the current week's leaflet is not available, return { "items": [] }.`;

  let res: any;
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
                price: { type: "number" },
                normal_price: { type: "number" },
                quantity: { type: "string" },
              },
            },
          },
        },
      },
    });
  } catch (e) {
    console.warn(`flyerOffers: LLM failed for ${chain.chain}:`, (e as any)?.message || e);
    return [];
  }

  const items = Array.isArray(res?.items) ? res.items : [];
  return items
    .map((it: any) => ({
      product_name: it.name,
      postal_code: "",
      store: chain.chain,
      price: typeof it.price === "number" ? it.price : null,
      normal_price: typeof it.normal_price === "number" ? it.normal_price : it.price,
      quantity: it.quantity || "",
      currency: "eur",
      source: "weekly-flyer-marktguru",
      fetched_date: today,
    }))
    .filter((r: any) => r.product_name && typeof r.price === "number");
}