Deno.serve(async (req) => {
  const body = await req.json();
  const { productName } = body;

  if (!productName || typeof productName !== 'string') {
    return Response.json({ error: 'Missing productName' }, { status: 400 });
  }

  const searchTerms = buildSearchTerms(productName);

  for (const term of searchTerms) {
    const imageUrl = await tryOpenFoodFacts(term);
    if (imageUrl) {
      return Response.json({ imageUrl });
    }
  }

  return Response.json({ imageUrl: null });
});

// German food word -> English translation for better Open Food Facts results
const TRANSLATIONS = {
  'vollmilch': 'whole milk',
  'milch': 'milk',
  'haferflocken': 'oats',
  'naturjoghurt': 'natural yogurt',
  'joghurt': 'yogurt',
  'jogurt': 'yogurt',
  'butter': 'butter',
  'käse': 'cheese',
  'eier': 'eggs',
  'ei': 'egg',
  'brot': 'bread',
  'brötchen': 'bread rolls',
  'mehl': 'flour',
  'zucker': 'sugar',
  'salz': 'salt',
  'olivenöl': 'olive oil',
  'rapsöl': 'rapeseed oil',
  'öl': 'oil',
  'reis': 'rice',
  'nudeln': 'pasta',
  'spaghetti': 'spaghetti',
  'kartoffeln': 'potatoes',
  'tomaten': 'tomatoes',
  'tomate': 'tomato',
  'äpfel': 'apples',
  'apfel': 'apple',
  'bananen': 'bananas',
  'banane': 'banana',
  'orangen': 'oranges',
  'orange': 'orange',
  'hühnerbrust': 'chicken breast',
  'hähnchen': 'chicken',
  'hackfleisch': 'ground beef',
  'rinderhack': 'ground beef',
  'lachs': 'salmon',
  'thunfisch': 'tuna',
  'wurst': 'sausage',
  'schinken': 'ham',
  'frischkäse': 'cream cheese',
  'quark': 'quark',
  'sahne': 'cream',
  'schmand': 'sour cream',
  'ketchup': 'ketchup',
  'senf': 'mustard',
  'essig': 'vinegar',
  'honig': 'honey',
  'marmelade': 'jam',
  'linsen': 'lentils',
  'bohnen': 'beans',
  'kichererbsen': 'chickpeas',
  'spinat': 'spinach',
  'karotten': 'carrots',
  'zwiebeln': 'onions',
  'zwiebel': 'onion',
  'knoblauch': 'garlic',
  'paprika': 'bell pepper',
  'gurke': 'cucumber',
  'zucchini': 'zucchini',
  'brokkoli': 'broccoli',
  'broccoli': 'broccoli',
  'blumenkohl': 'cauliflower',
  'schokolade': 'chocolate',
  'chips': 'chips',
  'jodsalz': 'iodized salt',
  'mozzarella': 'mozzarella',
  'gouda': 'gouda',
  'feta': 'feta',
  'parmesan': 'parmesan',
  'sahnejoghurt': 'cream yogurt',
  'müsli': 'muesli',
  'cornflakes': 'cornflakes',
  'waffeln': 'waffles',
  'kekse': 'cookies',
  'torte': 'cake',
  'kuchen': 'cake',
};

function buildSearchTerms(productName) {
  const terms = [];

  // Remove brand names, sizes, percentages
  const cleaned = productName
    .replace(/\d+[\.,]?\d*\s*(kg|g|ml|l|liter|stück|st\.|pcs|cl)/gi, '')
    .replace(/\d+[\.,]?\d*\s*%/g, '')
    .replace(/\b(ja!|ja\b|gut\s*&\s*günstig|g&g|alnatura|milbona|bioland|bio bio|tandil|freeway|pilos|saskia|golden sun|harvest basket|happy harvest|k-classic|spinnrad|formil|cien|W5|toujours|floralys|rewe|lidl|aldi|edeka)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const lowerCleaned = cleaned.toLowerCase();

  // 1. Check for direct translation match (try longest match first)
  const sortedKeys = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerCleaned.includes(key)) {
      terms.push(TRANSLATIONS[key]);
      break;
    }
  }

  // 2. Try the cleaned German term
  if (cleaned.length > 2) terms.push(cleaned);

  // 3. Try first meaningful word only
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0 && !terms.includes(words[0])) {
    terms.push(words[0]);
  }

  return [...new Set(terms)].filter(Boolean);
}

async function tryOpenFoodFacts(searchTerm) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=10`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BudgetBite/1.0 (grocery helper app)' },
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