// Deterministic calorie & macro math verification for grocery items and daily meal plans.
// AI models frequently miscalculate total_kcal (e.g. forgetting the pack multiplier "3 × 500g"
// or returning per-100g calories as total_kcal) and drift from daily meal calorie goals.

import { packCount } from "@/lib/priceSanity";

function parseGramsOrMl(str) {
  const m = String(str || "").trim().match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)\b/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  if (!(val > 0)) return null;
  const unit = m[2].toLowerCase();
  if (unit === "kg" || unit === "l") return val * 1000;
  return val;
}

// Extracts total purchased weight/volume in grams or ml from quantity (and name fallback).
export function parseTotalWeightOrVolume(quantity, name, fallbackPacks = 1) {
  const q = String(quantity || "").trim();
  const multi = q.match(/^\s*(\d+)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml)\b/i);
  if (multi) {
    const packs = parseInt(multi[1], 10);
    const val = parseFloat(multi[2].replace(",", "."));
    const unit = multi[3].toLowerCase();
    const perPack = unit === "kg" || unit === "l" ? val * 1000 : val;
    if (packs > 0 && perPack > 0) return packs * perPack;
  }
  // Single weight/volume in quantity, e.g. "500g" or "1.5L"
  if (!/[x×*]/i.test(q)) {
    const single = parseGramsOrMl(q);
    if (single) return single;
  }
  // Fallback: pack count × trailing weight/volume in product name (e.g. "Ja! Haferflocken 500g")
  const packs = packCount(q) || fallbackPacks || 1;
  const fromName = parseGramsOrMl(name);
  if (fromName) return packs * fromName;
  return null;
}

// Extracts kcal per 100g / 100ml when explicitly present in calories_info.
export function parseDensityPer100(caloriesInfo) {
  const m = String(caloriesInfo || "").match(/(\d+(?:[.,]\d+)?)\s*kcal\s*\/\s*100\s*(?:g|ml)\b/i);
  if (!m) return null;
  const kcal = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(kcal) || kcal < 0 || kcal > 900) return null;
  return kcal;
}

export function sanitizeItemCalories(item) {
  if (!item || typeof item !== "object") return item;
  const i = { ...item };
  const unit = Number(i.unit_price) || 0;
  const price = Number(i.price) || 0;
  const packs = packCount(i.quantity) || (unit > 0 && price > 0 ? Math.max(1, Math.round(price / unit)) : 1);

  const totalAmount = parseTotalWeightOrVolume(i.quantity, i.name, packs);
  const density = parseDensityPer100(i.calories_info);

  const pG = Number(i.protein_g) || 0;
  const cG = Number(i.carb_g) || 0;
  const fG = Number(i.fat_g) || 0;
  const hasMacros = pG > 0 || cG > 0 || fG > 0;
  const macroKcal = pG * 4 + cG * 4 + fG * 9;

  if (totalAmount != null && density != null) {
    // Exact shelf math: (total grams or ml / 100) × kcal per 100g/ml
    const exactKcal = Math.round((totalAmount / 100) * density);
    i.total_kcal = exactKcal;
    if (exactKcal === 0) {
      if (i.protein_g != null) i.protein_g = 0;
      if (i.carb_g != null) i.carb_g = 0;
      if (i.fat_g != null) i.fat_g = 0;
    } else if (hasMacros && macroKcal > 0) {
      const ratio = exactKcal / macroKcal;
      if (ratio < 0.8 || ratio > 1.25) {
        i.protein_g = Math.round(pG * ratio);
        i.carb_g = Math.round(cG * ratio);
        i.fat_g = Math.round(fG * ratio);
      }
    }
  } else if (hasMacros && macroKcal > 0 && macroKcal <= packs * 5000) {
    const rawKcal = Number(i.total_kcal) || 0;
    if (!(rawKcal > 0)) {
      i.total_kcal = Math.round(macroKcal);
    } else if (packs > 1 && Math.abs(rawKcal * packs - macroKcal) <= macroKcal * 0.2) {
      // AI forgot to multiply total_kcal by pack count, while macros were multiplied
      i.total_kcal = Math.round(macroKcal);
    } else if (packs > 1 && Math.abs(macroKcal * packs - rawKcal) <= rawKcal * 0.2) {
      // AI multiplied total_kcal by pack count, while macros were for 1 pack
      i.protein_g = Math.round(pG * packs);
      i.carb_g = Math.round(cG * packs);
      i.fat_g = Math.round(fG * packs);
    } else if (Math.abs(rawKcal - macroKcal) > Math.max(macroKcal * 0.25, 120)) {
      i.total_kcal = Math.round(macroKcal);
    }
  }

  if (Array.isArray(i.alternatives)) {
    i.alternatives = i.alternatives.map(sanitizeItemCalories);
  }
  return i;
}

export function sanitizeGroceryCalories(result) {
  if (!result?.categories) return result;
  return {
    ...result,
    categories: result.categories.map((cat) => ({
      ...cat,
      items: (cat.items || []).map(sanitizeItemCalories),
    })),
  };
}

// Scales numeric gram/ml portions inside meal ingredients when meal calories are adjusted.
function scaleIngredientList(ings, scale) {
  if (!Array.isArray(ings) || !Number.isFinite(scale) || Math.abs(1 - scale) <= 0.08) return ings;
  const clamped = Math.min(2.0, Math.max(0.5, scale));
  return ings.map((ing) => {
    if (!ing || !ing.quantity) return ing;
    const updatedQty = String(ing.quantity).replace(
      /(\d+(?:[.,]\d+)?)\s*(g|ml|kg|l)\b/gi,
      (_, numStr, unit) => {
        const val = parseFloat(numStr.replace(",", ".")) * clamped;
        const u = unit.toLowerCase();
        if (u === "kg" || u === "l") {
          const rounded = Math.max(0.05, Math.round(val * 20) / 20);
          return `${rounded}${unit}`;
        }
        const step = val >= 50 ? 5 : 1;
        const rounded = Math.max(5, Math.round(val / step) * step);
        return `${rounded}${unit}`;
      }
    );
    return { ...ing, quantity: updatedQty };
  });
}

const DEFAULT_MEAL_SHARES = { breakfast: 0.25, lunch: 0.35, dinner: 0.40 };

// Normalizes every meal-plan day so breakfast + lunch + dinner equals targetCalories.
// Supports partially locked days (e.g. "Regenerate remaining") via lockedSetForDay(dayIdx).
export function normalizePlanDaysCalories(planDays, targetCalories, getLockedMealsForDay = null) {
  const target = Math.round(Number(targetCalories) || 2000);
  if (target <= 0) return planDays || [];

  return (planDays || []).map((d, dayIdx) => {
    if (!d) return d;
    const locked = getLockedMealsForDay ? getLockedMealsForDay(dayIdx) : null;
    const slots = ["breakfast", "lunch", "dinner"];
    const unlockedSlots = slots.filter((mt) => !(locked && locked.has(mt)));
    if (unlockedSlots.length === 0) return d;

    const lockedSum = slots
      .filter((mt) => locked && locked.has(mt))
      .reduce((s, mt) => s + (Number(d[`${mt}_calories`]) || 0), 0);

    const remainingTarget = Math.max(unlockedSlots.length * 100, target - lockedSum);

    // Ensure every non-empty unlocked meal has a positive baseline before scaling
    const rawValues = {};
    unlockedSlots.forEach((mt) => {
      const raw = Number(d[`${mt}_calories`]) || 0;
      const hasMeal = Boolean(d[mt] && String(d[mt]).trim());
      rawValues[mt] = raw > 0 ? raw : hasMeal ? Math.round(target * DEFAULT_MEAL_SHARES[mt]) : 0;
    });

    let rawUnlockedSum = unlockedSlots.reduce((s, mt) => s + rawValues[mt], 0);
    if (rawUnlockedSum <= 0) {
      unlockedSlots.forEach((mt) => {
        rawValues[mt] = Math.round(target * DEFAULT_MEAL_SHARES[mt]);
      });
      rawUnlockedSum = unlockedSlots.reduce((s, mt) => s + rawValues[mt], 0) || 1;
    }

    const scale = remainingTarget / rawUnlockedSum;
    const next = { ...d };
    let assigned = 0;

    unlockedSlots.forEach((mt, idx) => {
      const isLast = idx === unlockedSlots.length - 1;
      const kcal = isLast
        ? Math.max(50, remainingTarget - assigned)
        : Math.max(50, Math.round((rawValues[mt] * scale) / 5) * 5);
      assigned += kcal;
      next[`${mt}_calories`] = kcal;
      next[`${mt}_ingredients`] = scaleIngredientList(d[`${mt}_ingredients`], scale);
    });

    return next;
  });
}