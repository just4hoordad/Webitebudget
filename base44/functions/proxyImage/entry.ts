Deno.serve(async (req) => {
  const body = await req.json();
  const { productName } = body;

  if (!productName || typeof productName !== 'string') {
    return Response.json({ error: 'Missing productName' }, { status: 400 });
  }

  const { offTerms, wikiTerm } = buildTerms(productName);

  // 1. Try Open Food Facts with each term (good for branded/specific products)
  for (const term of offTerms) {
    const img = await tryOpenFoodFacts(term);
    if (img) return Response.json({ imageUrl: img });
  }

  // 2. Fallback: Wikipedia image (great for generic food categories)
  if (wikiTerm) {
    const img = await tryWikipedia(wikiTerm);
    if (img) return Response.json({ imageUrl: img });
  }

  return Response.json({ imageUrl: null });
});

// German → English mapping for Wikipedia fallback
const DE_TO_EN = {
  'vollmilch': 'Milk',
  'milch': 'Milk',
  'haferflocken': 'Oat',
  'naturjoghurt': 'Yogurt',
  'sahnejoghurt': 'Yogurt',
  'joghurt': 'Yogurt',
  'jogurt': 'Yogurt',
  'butter': 'Butter',
  'käse': 'Cheese',
  'frischkäse': 'Cream cheese',
  'quark': 'Quark (dairy product)',
  'eier': 'Egg',
  'brot': 'Bread',
  'brötchen': 'Bread roll',
  'toast': 'Toast bread',
  'mehl': 'Flour',
  'zucker': 'Sugar',
  'salz': 'Salt',
  'jodsalz': 'Salt',
  'olivenöl': 'Olive oil',
  'rapsöl': 'Rapeseed oil',
  'öl': 'Cooking oil',
  'essig': 'Vinegar',
  'reis': 'Rice',
  'nudeln': 'Pasta',
  'spaghetti': 'Spaghetti',
  'kartoffeln': 'Potato',
  'kartoffel': 'Potato',
  'tomaten': 'Tomato',
  'tomate': 'Tomato',
  'tomatenmark': 'Tomato paste',
  'äpfel': 'Apple',
  'apfel': 'Apple',
  'bananen': 'Banana',
  'banane': 'Banana',
  'orangen': 'Orange (fruit)',
  'orange': 'Orange (fruit)',
  'zitronen': 'Lemon',
  'zitrone': 'Lemon',
  'hühnerbrust': 'Chicken as food',
  'hähnchen': 'Chicken as food',
  'hackfleisch': 'Ground meat',
  'rinderhack': 'Ground beef',
  'schweinefleisch': 'Pork',
  'lachs': 'Salmon',
  'thunfisch': 'Tuna',
  'wurst': 'Sausage',
  'bratwurst': 'Bratwurst',
  'schinken': 'Ham',
  'speck': 'Bacon',
  'ketchup': 'Ketchup',
  'senf': 'Mustard (condiment)',
  'honig': 'Honey',
  'marmelade': 'Jam',
  'erdnussbutter': 'Peanut butter',
  'linsen': 'Lentil',
  'bohnen': 'Bean',
  'kichererbsen': 'Chickpea',
  'spinat': 'Spinach',
  'karotten': 'Carrot',
  'möhren': 'Carrot',
  'zwiebeln': 'Onion',
  'zwiebel': 'Onion',
  'knoblauch': 'Garlic',
  'paprika': 'Bell pepper',
  'gurke': 'Cucumber',
  'zucchini': 'Zucchini',
  'brokkoli': 'Broccoli',
  'blumenkohl': 'Cauliflower',
  'schokolade': 'Chocolate',
  'chips': 'Potato chip',
  'müsli': 'Muesli',
  'cornflakes': 'Corn flakes',
  'kekse': 'Cookie',
  'kuchen': 'Cake',
  'kaffee': 'Coffee',
  'tee': 'Tea',
  'saft': 'Juice',
  'orangensaft': 'Orange juice',
  'mineralwasser': 'Mineral water',
  'sahne': 'Cream',
  'schmand': 'Sour cream',
  'hafermilch': 'Oat milk',
  'sojadrink': 'Soy milk',
  'mandelmilch': 'Almond milk',
  'tofu': 'Tofu',
  'gouda': 'Gouda cheese',
  'mozzarella': 'Mozzarella',
  'feta': 'Feta',
  'parmesan': 'Parmesan cheese',
  'weintrauben': 'Grape',
  'erdbeeren': 'Strawberry',
  'salat': 'Lettuce',
  'waschmittel': 'Laundry detergent',
  'spülmittel': 'Dishwashing liquid',
  'zahnpasta': 'Toothpaste',
  'shampoo': 'Shampoo',
  'toilettenpapier': 'Toilet paper',
  'klopapier': 'Toilet paper',
};

const BRAND_PATTERN = /\b(ja!?|gut\s*&\s*günstig|g&g|alnatura|milbona|bioland|bio\s*bio|tandil|freeway|pilos|saskia|golden\s*sun|harvest\s*basket|happy\s*harvest|k-classic|spinnrad|formil|cien|W5|toujours|floralys|bio)\b/gi;
const SIZE_PATTERN = /\d+[\.,]?\d*\s*(kg|g|ml|l|liter|stück|st\.|pcs|cl|x)\b|\d+[\.,]?\d*\s*%/gi;

function buildTerms(productName) {
  // Core German name (brand + size stripped)
  const coreGerman = productName
    .replace(BRAND_PATTERN, '')
    .replace(SIZE_PATTERN, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const offTerms = [];
  // Try full original first (might be exact product in OFF)
  offTerms.push(productName.trim());
  if (coreGerman && coreGerman !== productName.trim() && coreGerman.length > 2) {
    offTerms.push(coreGerman);
  }

  // Find Wikipedia English article title
  const lower = coreGerman.toLowerCase();
  const sortedKeys = Object.keys(DE_TO_EN).sort((a, b) => b.length - a.length);
  let wikiTerm = null;
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      wikiTerm = DE_TO_EN[key];
      // Also add the English term to OFF search
      offTerms.push(DE_TO_EN[key].toLowerCase().replace(/\s*\(.*?\)/g, '').trim());
      break;
    }
  }

  return { offTerms: [...new Set(offTerms)].filter(Boolean), wikiTerm };
}

async function tryOpenFoodFacts(searchTerm) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BudgetBite/1.0 (contact: info@budgetbite.app)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    for (const product of (data.products || [])) {
      const img = product.image_front_small_url || product.image_front_url || product.image_url;
      if (img && img.startsWith('https://')) return img;
    }
    return null;
  } catch {
    return null;
  }
}

async function tryWikipedia(articleTitle) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BudgetBite/1.0 (contact: info@budgetbite.app)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail?.source || data?.originalimage?.source || null;
  } catch {
    return null;
  }
}