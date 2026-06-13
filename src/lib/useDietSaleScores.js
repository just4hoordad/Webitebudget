import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Returns a map of { dietId: savingsPercent } for diets that have
 * meaningful sale savings today (unit_price notably below normal_price).
 */
export function useDietSaleScores() {
  const [scores, setScores] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const items = await base44.entities.PriceCatalog.filter({ last_updated: today });
        if (!items || items.length === 0) return;

        // Accumulate savings per diet tag
        const totals = {}; // dietTag -> { totalSavePct, count }
        for (const item of items) {
          if (!item.normal_price || !item.unit_price || item.unit_price >= item.normal_price) continue;
          const savePct = ((item.normal_price - item.unit_price) / item.normal_price) * 100;
          for (const tag of (item.diet_tags || [])) {
            if (!totals[tag]) totals[tag] = { total: 0, count: 0 };
            totals[tag].total += savePct;
            totals[tag].count += 1;
          }
        }

        const result = {};
        for (const [tag, { total, count }] of Object.entries(totals)) {
          const avg = total / count;
          if (avg >= 5) result[tag] = Math.round(avg); // only show if ≥5% avg saving
        }
        setScores(result);
      } catch (_) {
        // silently fail — badge is optional
      }
    })();
  }, []);

  return scores;
}