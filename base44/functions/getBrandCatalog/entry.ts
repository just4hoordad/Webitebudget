import { COMMON_ITEMS_BY_CHAIN, CHAINS_WITH_CATALOG } from "../../shared/commonItemsByChain.ts";

// Returns the static per-chain branded product catalog. This is the same data
// the daily price refresh seeds from, exposed to the frontend so grocery items
// can be brandified (generic name → real house-brand product name) even before
// the source-verified price catalog is populated.
export default async function (_req: Request): Promise<Response> {
  return Response.json({ catalog: COMMON_ITEMS_BY_CHAIN, chains: CHAINS_WITH_CATALOG });
}