import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const body = await req.json();
  const { productName } = body;

  if (!productName || typeof productName !== 'string') {
    return Response.json({ error: 'Missing productName' }, { status: 400 });
  }

  try {
    // Search Open Food Facts for the product by name (German market)
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(productName)}&search_simple=1&action=process&json=1&page_size=5&lc=de&cc=de`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'BudgetBite/1.0 (grocery helper app)',
      },
    });

    if (!response.ok) {
      return Response.json({ imageUrl: null });
    }

    const data = await response.json();
    const products = data.products || [];

    // Find first product with a valid image
    for (const product of products) {
      const imgUrl = product.image_front_small_url || product.image_front_url || product.image_url;
      if (imgUrl && imgUrl.startsWith('https://')) {
        return Response.json({ imageUrl: imgUrl });
      }
    }

    return Response.json({ imageUrl: null });
  } catch (error) {
    return Response.json({ imageUrl: null });
  }
});