// Shared reactive visual presets & localized copy (EN / DE fallback) for Budget & Plan Builders.

export const DIET_VISUALS = {
  balanced: {
    accent: "#78a71b",
    tint: "#F3F8E6",
    badge: "⚖️ Balanced",
    badgeDe: "⚖️ Ausgewogen",
    foods: ["🥣", "🍝", "🥗", "🍎", "🥚", "🍞"],
  },
  vegetarian: {
    accent: "#34D399",
    tint: "#ECFDF5",
    badge: "🥬 Veggie",
    badgeDe: "🥬 Vegetarisch",
    foods: ["🧀", "🥑", "🥦", "🍝", "🥚", "🍅"],
  },
  vegan: {
    accent: "#A3E635",
    tint: "#F7FEE7",
    badge: "🌱 Plant Power",
    badgeDe: "🌱 Vegan",
    foods: ["🥑", "🫘", "🥦", "🍌", "🥜", "🌾"],
  },
  "high-protein": {
    accent: "#FF8FB5",
    tint: "#FFF1F5",
    badge: "💪 High Protein",
    badgeDe: "💪 Viel Protein",
    foods: ["🍗", "🥚", "🥛", "🥩", "🐟", "🥜"],
  },
  pescatarian: {
    accent: "#7DD3FC",
    tint: "#F0F9FF",
    badge: "🐟 Pescatarian",
    badgeDe: "🐟 Pescetarisch",
    foods: ["🐟", "🍤", "🥑", "🥗", "🍋", "🍚"],
  },
  "gluten-free": {
    accent: "#FFB020",
    tint: "#FFFBEB",
    badge: "🌾 Gluten-Free",
    badgeDe: "🌾 Glutenfrei",
    foods: ["🍚", "🥔", "🍗", "🥗", "🍳", "🍓"],
  },
  halal: {
    accent: "#C084FC",
    tint: "#FAF5FF",
    badge: "✨ Halal",
    badgeDe: "✨ Halal",
    foods: ["🍗", "🥙", "🍚", "🥗", "🫘", "🍋"],
  },
  frozen: {
    accent: "#60A5FA",
    tint: "#EFF6FF",
    badge: "❄️ Quick Heat",
    badgeDe: "❄️ Tiefkühl",
    foods: ["🧊", "🍕", "🥟", "🥦", "🫐", "🍲"],
  },
};

export function getDietVisual(dietId) {
  return DIET_VISUALS[dietId] || DIET_VISUALS.balanced;
}

export function getBudgetTier(perPersonDay, hasBudget, isDe) {
  if (!hasBudget) {
    return {
      key: "idle",
      color: "#9CA3AF",
      bg: "bg-secondary",
      label: isDe ? "Münze einwerfen — Budget wählen!" : "Insert coin — set your budget!",
      sub: isDe ? "Ziehe den Regler und sieh deinen Korb wachsen" : "Slide your budget to watch your basket fill up",
      fillCount: 0,
      pct: 6,
    };
  }
  if (perPersonDay < 3.5) {
    return {
      key: "saver",
      color: "#7DD3FC",
      bg: "bg-[#7DD3FC]",
      label: isDe ? "⚡ Ultra-Sparmodus" : "⚡ Ultra Saver Mode",
      sub: isDe ? "Smarte Basics: Hafer, Pasta, Linsen & Quark" : "Max-value staples: oats, pasta, legumes & skyr",
      fillCount: 3,
      pct: 32,
    };
  }
  if (perPersonDay < 6.5) {
    return {
      key: "sweet",
      color: "#78a71b",
      bg: "bg-[#78a71b]",
      label: isDe ? "🎯 Studenten-Sweet-Spot" : "🎯 Smart Sweet Spot",
      sub: isDe ? "Frisches Gemüse, Proteine & Discounter-Hits" : "Fresh produce, solid proteins & discount steals",
      fillCount: 4,
      pct: 60,
    };
  }
  if (perPersonDay < 11) {
    return {
      key: "feast",
      color: "#FFB020",
      bg: "bg-[#FFB020]",
      label: isDe ? "🔥 Komfort-Schlemmerzone" : "🔥 Feast Comfort Zone",
      sub: isDe ? "Viel Abwechslung, Beeren, Fisch & Extras" : "Wide variety, berries, fish & tasty extras",
      fillCount: 5,
      pct: 84,
    };
  }
  return {
    key: "boss",
    color: "#FF3E7F",
    bg: "bg-[#FF3E7F]",
    label: isDe ? "👑 Gourmet-Boss-Level" : "👑 Gourmet Boss Level",
    sub: isDe ? "Premium-Auswahl, Bio-Optionen & volle Freiheit" : "Premium picks, organic upgrades & zero compromises",
    fillCount: 6,
    pct: 100,
  };
}

export const REACTOR_COPY = {
  en: {
    livePreview: "LIVE BASKET RADAR",
    perDayPerson: "/ person / day",
    perMeal: "/ meal",
    mealsTotal: "meals covered",
    storesLockedIn: "stores locked",
    pickStorePrompt: "Tap a store below to lock prices",
    readyBadge: "READY TO LAUNCH!",
    configuringBadge: "TUNING LOADOUT…",
    saleRadar: "Flyer Hunt ON",
    bioBoost: "Bio Boost",
    loadoutTitle: "LIVE PLAN LOADOUT",
    tableFor: "Table for",
    daysDeck: "day deck",
    PlannedSlots: "meal slots",
    recipesUnlocked: "recipes ready",
    pickDietHint: "Pick a diet",
    pickStoreHint: "Pick stores",
    trayTitle: "Active Day Tray",
    tapSlotHint: "Tap a plate to switch active slot",
    emptyPlate: "Empty",
    uniqueRecipes: "recipes to unlock",
  },
  de: {
    livePreview: "LIVE-WARENKORB-RADAR",
    perDayPerson: "/ Person / Tag",
    perMeal: "/ Mahlzeit",
    mealsTotal: "Mahlzeiten",
    storesLockedIn: "Märkte aktiv",
    pickStorePrompt: "Tippe unten einen Markt an",
    readyBadge: "STARTKLAR!",
    configuringBadge: "KONFIGURIERE…",
    saleRadar: "Angebots-Radar AN",
    bioBoost: "Bio-Fokus",
    loadoutTitle: "LIVE-PLAN-VORSCHAU",
    tableFor: "Tisch für",
    daysDeck: "Tage-Deck",
    PlannedSlots: "Mahlzeiten-Slots",
    recipesUnlocked: "Rezepte inklusive",
    pickDietHint: "Diät wählen",
    pickStoreHint: "Märkte wählen",
    trayTitle: "Aktives Tages-Tablett",
    tapSlotHint: "Tippe auf einen Teller zum Wechseln",
    emptyPlate: "Leer",
    uniqueRecipes: "Rezepte freischaltbar",
  },
};