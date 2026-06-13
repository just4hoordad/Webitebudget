import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useStoreSaleScores() {
  const [storeSaleScores, setStoreSaleScores] = useState({});

  useEffect(() => {
    const calculate = async () => {
      try {
        const catalog = await base44.entities.PriceCatalog.list();
        if (!catalog || catalog.length === 0) return;

        const storeMap = {};
        catalog.forEach(item => {
          if (!item.store || item.unit_price == null || item.normal_price == null) return;
          if (item.normal_price <= item.unit_price) return;

          const storeKey = item.store.toLowerCase();
          const saving = (item.normal_price - item.unit_price) / item.normal_price;

          if (!storeMap[storeKey]) storeMap[storeKey] = [];
          storeMap[storeKey].push(saving);
        });

        const scores = {};
        Object.entries(storeMap).forEach(([store, savings]) => {
          const avg = savings.reduce((a, b) => a + b, 0) / savings.length;
          if (avg >= 0.03) {
            scores[store] = Math.round(avg * 100);
          }
        });

        setStoreSaleScores(scores);
      } catch (_) {}
    };

    calculate();
  }, []);

  return storeSaleScores;
}