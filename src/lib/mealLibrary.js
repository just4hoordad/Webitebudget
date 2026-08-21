// Curated meal library for the Plan Builder picture gallery.
// Each meal: { name, emoji, img, color (tailwind gradient) }
// Images are best-effort Unsplash URLs; MealCard falls back to a
// gradient + emoji if an image fails to load, so the gallery always renders.

const G = {
  amber: "from-amber-400/80 to-orange-500/80",
  green: "from-green-400/80 to-emerald-600/80",
  rose: "from-rose-400/80 to-red-500/80",
  sky: "from-sky-400/80 to-blue-500/80",
  violet: "from-violet-400/80 to-purple-600/80",
  yellow: "from-yellow-400/80 to-amber-600/80",
  teal: "from-teal-400/80 to-cyan-600/80",
  pink: "from-pink-400/80 to-rose-500/80",
};

export const MEAL_LIBRARY = {
  balanced: [
    { name: "Oatmeal with banana", emoji: "🥣", img: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80", color: G.amber },
    { name: "Scrambled eggs", emoji: "🍳", img: "https://images.unsplash.com/photo-1518568221620-7d0c5cd59237?w=400&q=80", color: G.yellow },
    { name: "Avocado toast", emoji: "🥑", img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c06d?w=400&q=80", color: G.green },
    { name: "Chicken rice bowl", emoji: "🍗", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", color: G.amber },
    { name: "Pasta with tomato sauce", emoji: "🍝", img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80", color: G.rose },
    { name: "Mixed salad", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", color: G.green },
    { name: "Vegetable soup", emoji: "🍲", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80", color: G.teal },
    { name: "Turkey sandwich", emoji: "🥪", img: "https://images.unsplash.com/photo-1521305916504-4a1121188589?w=400&q=80", color: G.amber },
  ],
  vegetarian: [
    { name: "Oatmeal with berries", emoji: "🥣", img: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80", color: G.amber },
    { name: "Avocado toast", emoji: "🥑", img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c06d?w=400&q=80", color: G.green },
    { name: "Veggie stir fry", emoji: "🥘", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80", color: G.green },
    { name: "Margherita pizza", emoji: "🍕", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80", color: G.rose },
    { name: "Caprese salad", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", color: G.green },
    { name: "Pasta primavera", emoji: "🍝", img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80", color: G.rose },
    { name: "Vegetable soup", emoji: "🍲", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80", color: G.teal },
    { name: "Grilled cheese", emoji: "🧀", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80", color: G.yellow },
  ],
  vegan: [
    { name: "Overnight oats", emoji: "🥣", img: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80", color: G.amber },
    { name: "Avocado toast", emoji: "🥑", img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c06d?w=400&q=80", color: G.green },
    { name: "Tofu stir fry", emoji: "🥘", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80", color: G.green },
    { name: "Lentil curry", emoji: "🍛", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", color: G.amber },
    { name: "Chickpea salad", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", color: G.green },
    { name: "Veggie bowl", emoji: "🥙", img: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=80", color: G.teal },
    { name: "Pasta arrabbiata", emoji: "🍝", img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80", color: G.rose },
    { name: "Smoothie bowl", emoji: "🍓", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80", color: G.pink },
  ],
  "high-protein": [
    { name: "Scrambled eggs", emoji: "🍳", img: "https://images.unsplash.com/photo-1518568221620-7d0c5cd59237?w=400&q=80", color: G.yellow },
    { name: "Greek yogurt", emoji: "🥛", img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80", color: G.sky },
    { name: "Grilled chicken", emoji: "🍗", img: "https://images.unsplash.com/photo-1532550907401-50034864a0d1?w=400&q=80", color: G.amber },
    { name: "Beef stir fry", emoji: "🥩", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80", color: G.rose },
    { name: "Tuna salad", emoji: "🐟", img: "https://images.unsplash.com/photo-1535399831218-d4db9f6f5dba?w=400&q=80", color: G.teal },
    { name: "Chicken rice bowl", emoji: "🍚", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", color: G.amber },
    { name: "Cottage cheese bowl", emoji: "🧀", img: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80", color: G.sky },
    { name: "Protein pancakes", emoji: "🥞", img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80", color: G.amber },
  ],
  pescatarian: [
    { name: "Smoked salmon toast", emoji: "🐟", img: "https://images.unsplash.com/photo-1541519227354-08fa5d50c06d?w=400&q=80", color: G.pink },
    { name: "Tuna salad", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", color: G.teal },
    { name: "Grilled salmon", emoji: "🐠", img: "https://images.unsplash.com/photo-1535399831218-d4db9f6f5dba?w=400&q=80", color: G.rose },
    { name: "Shrimp stir fry", emoji: "🍤", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80", color: G.rose },
    { name: "Fish tacos", emoji: "🌮", img: "https://images.unsplash.com/photo-1551504734-5ee1c3831845?w=400&q=80", color: G.amber },
    { name: "Seafood pasta", emoji: "🍝", img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80", color: G.rose },
    { name: "Sushi bowl", emoji: "🍣", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", color: G.teal },
    { name: "Vegetable soup", emoji: "🍲", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80", color: G.teal },
  ],
  "gluten-free": [
    { name: "Oatmeal with banana", emoji: "🥣", img: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80", color: G.amber },
    { name: "Scrambled eggs", emoji: "🍳", img: "https://images.unsplash.com/photo-1518568221620-7d0c5cd59237?w=400&q=80", color: G.yellow },
    { name: "Rice bowl", emoji: "🍚", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", color: G.amber },
    { name: "Grilled chicken", emoji: "🍗", img: "https://images.unsplash.com/photo-1532550907401-50034864a0d1?w=400&q=80", color: G.amber },
    { name: "Mixed salad", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", color: G.green },
    { name: "Smoothie bowl", emoji: "🍓", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80", color: G.pink },
    { name: "Lentil curry", emoji: "🍛", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", color: G.amber },
    { name: "Vegetable soup", emoji: "🍲", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80", color: G.teal },
  ],
  halal: [
    { name: "Oatmeal with banana", emoji: "🥣", img: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&q=80", color: G.amber },
    { name: "Scrambled eggs", emoji: "🍳", img: "https://images.unsplash.com/photo-1518568221620-7d0c5cd59237?w=400&q=80", color: G.yellow },
    { name: "Grilled chicken", emoji: "🍗", img: "https://images.unsplash.com/photo-1532550907401-50034864a0d1?w=400&q=80", color: G.amber },
    { name: "Lamb curry", emoji: "🍛", img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", color: G.amber },
    { name: "Chicken rice bowl", emoji: "🍚", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", color: G.amber },
    { name: "Beef stir fry", emoji: "🥘", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80", color: G.rose },
    { name: "Mixed salad", emoji: "🥗", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", color: G.green },
    { name: "Vegetable soup", emoji: "🍲", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80", color: G.teal },
  ],
  frozen: [
    { name: "Frozen pizza", emoji: "🍕", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80", color: G.rose },
    { name: "Frozen vegetables", emoji: "🥦", img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80", color: G.green },
    { name: "Frozen berries", emoji: "🫐", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80", color: G.violet },
    { name: "Frozen fish sticks", emoji: "🐟", img: "https://images.unsplash.com/photo-1535399831218-d4db9f6f5dba?w=400&q=80", color: G.teal },
    { name: "Frozen dumplings", emoji: "🥟", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", color: G.amber },
    { name: "Frozen berries bowl", emoji: "🍓", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80", color: G.pink },
  ],
};

export const FALLBACK_MEALS = MEAL_LIBRARY.balanced;