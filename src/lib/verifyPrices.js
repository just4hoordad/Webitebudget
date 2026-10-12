import { sanitizePrices } from "@/lib/priceSanity";

// Price searches run in the morning catalog update, never while a user waits.
// Unmatched products keep their estimated label, not a false verified badge.
export function verifyPrices(result, known = new Map()) {
  return sanitizePrices(result, known);
}