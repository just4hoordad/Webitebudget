import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";

export function useDietSaleScores(selectedStores = []) {
  const [allItems, setAllItems] = useState([]);

  // Fetch once
  useEffect(() => {
    (async () => {
      try {
        const items = await base44.entities.PriceCatalog.list();
        if (items && items.length > 0) setAllItems(items);
      } catch (_) {}
    })();
  }, []);

  // Recompute instantly whenever selectedStores or allItems change
  const scores = useMemo(() => {
    if (allItems.length === 0) return {};

    const filtered = selectedStores.length > 0
      ? allItems.filter(item => selectedStores.some(s => s.toLowerCase() === (item.store || '').toLowerCase()))
      : allItems;

    if (filtered.length === 0) return {};

    const totals = {};
    for (const item of filtered) {
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
      if (avg >= 5) result[tag] = Math.round(avg);
    }
    return result;
  }, [allItems, selectedStores.join(',')]);

  return scores;
}