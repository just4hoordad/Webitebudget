// Flink (goflink.com) live grocery prices via the Apify actor
// `rainminer/goflink-scraper`. Flink is a quick-commerce delivery service —
// prices reflect the warehouse that delivers to the chosen city, so records
// are stored tagged to that city's region (postal_code "" = national baseline,
// since Flink prices are delivery-warehouse specific, not PLZ-specific).
//
// IMPORTANT: This is a single-chain source (Flink only). It improves Flink
// price accuracy but does NOT cover Aldi/Lidl/REWE/etc. Those chains still
// rely on the weekly flyer refresh + AI estimation in priceRefresh.ts.

const ACTOR_ID = "rainminer~goflink-scraper";
const APIFY_API_BASE = "https://api.apify.com/v2";

// Representative German cities — one per broad region. Flink serves a limited
// set of cities, so we query the ones most likely to have coverage and let
// the grocery generator blend whatever comes back.
const FLINK_CITIES = [
  "berlin",
  "hamburg",
  "munich",
  "cologne",
  "frankfurt",
  "stuttgart",
  "leipzig",
  "hannover",
];

// Core staples to query — keeps Apify cost bounded (~$0.37 / 1k products).
// One search term per category keeps the result set diverse but small.
const CORE_SEARCHES = [
  "Milch",
  "Eier",
  "Butter",
  "Bananen",
  "Brot",
  "Reis",
  "Nudeln",
  "Haferflocken",
  "Hähnchenbrust",
  "Gouda",
  "Quark",
  "Joghurt",
];

export interface FlinkPriceRecord {
  product_name: string;
  postal_code: string;
  store: string;
  price: number | null;
  unit_price: number | null;
  quantity: string;
  normal_price: number | null;
  currency: string;
  diet: string;
  source: string;
  fetched_date: string;
}

interface FlinkActorItem {
  name?: string;
  title?: string;
  price?: number;
  currentPrice?: number;
  unitPrice?: number;
  pricePerUnit?: number;
  quantity?: string;
  size?: string;
  category?: string;
  inStock?: boolean;
}

function todayBerlinDate(): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Run the Apify actor synchronously and return the dataset items.
async function runFlinkActor(
  token: string,
  search: string,
  city: string,
  maxItems: number
): Promise<FlinkActorItem[]> {
  const url = `${APIFY_API_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const body = {
    searchQueries: [search],
    city,
    maxItems,
    scrapeProductDetails: false,
    language: "de",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Apify sync runs can take 30-90s for bot-protected sites
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? (data as FlinkActorItem[]) : [];
}

// Map a Flink city to a representative 5-digit PLZ for regional tagging.
// Flink prices are delivery-warehouse specific, not PLZ-specific, so this is
// a coarse regional anchor rather than a precise shelf location.
const CITY_PLZ: Record<string, string> = {
  berlin: "10115",
  hamburg: "20095",
  munich: "80331",
  cologne: "50667",
  frankfurt: "60311",
  stuttgart: "70173",
  leipzig: "04109",
  hannover: "30159",
};

export async function performFlinkPriceRefresh(base44: any): Promise<{
  refreshed: number;
  cities_processed: number;
  cities_with_prices: string[];
  date: string;
  status: string;
  skipped?: boolean;
  message?: string;
}> {
  const token = process.env.Apify_Flink_prices;
  if (!token) {
    return {
      refreshed: 0,
      cities_processed: 0,
      cities_with_prices: [],
      date: todayBerlinDate(),
      status: "skipped",
      skipped: true,
      message: "Apify_Flink_prices secret not set — skipping Flink refresh.",
    };
  }

  const svc = base44.asServiceRole;
  const today = todayBerlinDate();
  const records: FlinkPriceRecord[] = [];

  // Query each city in parallel, but cap concurrency to 4 to respect limits.
  const batchSize = 4;
  const maxItemsPerSearch = 5;

  for (let i = 0; i < FLINK_CITIES.length; i += batchSize) {
    const cityBatch = FLINK_CITIES.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      cityBatch.map(async (city) => {
        const plz = CITY_PLZ[city] || "";
        const cityRecords: FlinkPriceRecord[] = [];

        // For each city, run a few representative searches in parallel.
        const searchBatch = CORE_SEARCHES.slice(0, 6); // 6 searches × 5 items = 30 per city
        const searchResults = await Promise.allSettled(
          searchBatch.map((s) => runFlinkActor(token, s, city, maxItemsPerSearch))
        );

        for (const r of searchResults) {
          if (r.status !== "fulfilled") continue;
          for (const it of r.value) {
            const name = it.name || it.title || "";
            const price = typeof (it.price ?? it.currentPrice) === "number"
              ? (it.price ?? it.currentPrice) as number
              : null;
            if (!name || price === null) continue;

            const unitPrice = typeof (it.unitPrice ?? it.pricePerUnit) === "number"
              ? (it.unitPrice ?? it.pricePerUnit) as number
              : null;

            cityRecords.push({
              product_name: name,
              postal_code: plz,
              store: "Flink",
              price,
              unit_price: unitPrice,
              quantity: it.quantity || it.size || "",
              normal_price: price, // Flink rarely shows a "was" price
              currency: "eur",
              diet: "",
              source: "flink-apify",
              fetched_date: today,
            });
          }
        }
        return cityRecords;
      })
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
    cities_processed: FLINK_CITIES.length,
    cities_with_prices: [...new Set(records.map((r) => r.postal_code).filter(Boolean))],
    date: today,
    status: "success",
  };
}