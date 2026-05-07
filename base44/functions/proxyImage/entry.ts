Deno.serve(async (req) => {
  const body = await req.json();
  const { productName } = body;

  if (!productName || typeof productName !== 'string') {
    return Response.json({ error: 'Missing productName' }, { status: 400 });
  }

  const englishTerm = toEnglishFoodTerm(productName);
  const imageUrl = await searchUnsplash(englishTerm);
  return Response.json({ imageUrl: imageUrl || null });
});

// German → English food term mapping
const TRANSLATIONS = {
  'vollmilch': 'whole milk',
  'milch': 'milk',
  'haferflocken': 'oats',
  'naturjoghurt': 'natural yogurt',
  'joghurt': 'yogurt',
  'jogurt': 'yogurt',
  'sahnejoghurt': 'yogurt',
  'butter': 'butter',
  'käse': 'cheese',
  'scheibenkäse': 'sliced cheese',
  'gouda': 'gouda cheese',
  'mozzarella': 'mozzarella',
  'feta': 'feta cheese',
  'parmesan': 'parmesan',
  'frischkäse': 'cream cheese',
  'quark': 'quark cheese',
  'eier': 'eggs',
  'ei': 'egg',
  'brot': 'bread',
  'brötchen': 'bread rolls',
  'toast': 'toast bread',
  'mehl': 'flour',
  'zucker': 'sugar',
  'salz': 'salt',
  'jodsalz': 'salt',
  'olivenöl': 'olive oil',
  'rapsöl': 'oil',
  'öl': 'oil',
  'essig': 'vinegar',
  'reis': 'rice',
  'nudeln': 'pasta',
  'spaghetti': 'spaghetti',
  'tortellini': 'tortellini',
  'kartoffeln': 'potatoes',
  'kartoffel': 'potato',
  'tomaten': 'tomatoes',
  'tomate': 'tomato',
  'tomatenmark': 'tomato paste',
  'tomatensauce': 'tomato sauce',
  'passata': 'tomato passata',
  'äpfel': 'apples',
  'apfel': 'apple',
  'bananen': 'bananas',
  'banane': 'banana',
  'orangen': 'oranges',
  'orange': 'orange',
  'zitronen': 'lemons',
  'zitrone': 'lemon',
  'weintrauben': 'grapes',
  'erdbeeren': 'strawberries',
  'hühnerbrust': 'chicken breast',
  'hähnchen': 'chicken',
  'hackfleisch': 'ground beef',
  'rinderhack': 'ground beef',
  'schweinefleisch': 'pork',
  'lachs': 'salmon',
  'thunfisch': 'tuna',
  'wurst': 'sausage',
  'bratwurst': 'sausage',
  'schinken': 'ham',
  'speck': 'bacon',
  'ketchup': 'ketchup',
  'senf': 'mustard',
  'mayonnaise': 'mayonnaise',
  'honig': 'honey',
  'marmelade': 'jam',
  'erdnussbutter': 'peanut butter',
  'linsen': 'lentils',
  'bohnen': 'beans',
  'kichererbsen': 'chickpeas',
  'spinat': 'spinach',
  'karotten': 'carrots',
  'möhren': 'carrots',
  'zwiebeln': 'onions',
  'zwiebel': 'onion',
  'knoblauch': 'garlic',
  'paprika': 'bell pepper',
  'gurke': 'cucumber',
  'zucchini': 'zucchini',
  'brokkoli': 'broccoli',
  'blumenkohl': 'cauliflower',
  'salat': 'salad lettuce',
  'schokolade': 'chocolate',
  'chips': 'potato chips',
  'müsli': 'muesli cereal',
  'cornflakes': 'cornflakes',
  'waffeln': 'waffles',
  'kekse': 'cookies',
  'kuchen': 'cake',
  'kaffee': 'coffee',
  'tee': 'tea',
  'saft': 'fruit juice',
  'orangensaft': 'orange juice',
  'wasser': 'water bottle',
  'mineralwasser': 'mineral water',
  'sahne': 'cream',
  'schmand': 'sour cream',
  'sojadrink': 'soy milk',
  'hafermilch': 'oat milk',
  'mandelmilch': 'almond milk',
  'tofu': 'tofu',
  'tempeh': 'tempeh',
  'waschmittel': 'laundry detergent',
  'spülmittel': 'dish soap',
  'shampoo': 'shampoo',
  'zahnpasta': 'toothpaste',
  'klopapier': 'toilet paper',
  'toilettenpapier': 'toilet paper',
  'küchenpapier': 'paper towel',
};

function toEnglishFoodTerm(productName) {
  // Strip brand names, quantities, and percentages
  const cleaned = productName
    .replace(/\d+[\.,]?\d*\s*(kg|g|ml|l|liter|stück|st\.|pcs|cl)\b/gi, '')
    .replace(/\d+[\.,]?\d*\s*%/g, '')
    .replace(/\b(ja!?|gut\s*&\s*günstig|g&g|alnatura|milbona|bioland|bio\s*bio|tandil|freeway|pilos|saskia|golden\s*sun|harvest\s*basket|happy\s*harvest|k-classic|spinnrad|formil|cien|W5|toujours|floralys|rewe|lidl|aldi|edeka|netto|penny|kaufland|norma|real|müller|ja|bio)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toLowerCase();

  // Try to find translation by matching any known German term as a substring
  const sortedKeys = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (cleaned.includes(key)) {
      return TRANSLATIONS[key];
    }
  }

  // No translation found – return cleaned name (may already be English or international)
  return cleaned || productName;
}

async function searchUnsplash(query) {
  try {
    // Use the Unsplash Source API (no key needed, redirects to a relevant photo)
    // We'll use their search API via the public access key
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    
    if (!UNSPLASH_ACCESS_KEY) {
      // Fallback: use Open Food Facts with the English term
      return await tryOpenFoodFacts(query);
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' food')}&per_page=5&orientation=squarish`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    if (!res.ok) return await tryOpenFoodFacts(query);
    const data = await res.json();
    const first = data?.results?.[0];
    return first?.urls?.small || first?.urls?.thumb || null;
  } catch {
    return await tryOpenFoodFacts(query);
  }
}

async function tryOpenFoodFacts(searchTerm) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=20&sort_by=unique_scans_n`;
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