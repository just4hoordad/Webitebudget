// Curated dish catalog for the visual Plan Builder.
// Each dish has a real generated photo, a meal type, and diet tags.
// Names are localized (EN + DE); other languages fall back to EN.

export const DISHES = [
  {
    id: "oats",
    type: "breakfast",
    name: "Overnight oats with berries",
    nameDe: "Overnight-Oats mit Beeren",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/7e25d9c22_generated_image.png",
    diets: ["balanced", "vegetarian"],
  },
  {
    id: "avocado-toast",
    type: "breakfast",
    name: "Avocado toast with egg",
    nameDe: "Avocado-Toast mit Ei",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/a438854d8_generated_image.png",
    diets: ["balanced", "vegetarian", "high-protein"],
  },
  {
    id: "yogurt-bowl",
    type: "breakfast",
    name: "Greek yogurt with granola",
    nameDe: "Griechischer Joghurt mit Granola",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/bf99915bd_generated_image.png",
    diets: ["balanced", "vegetarian"],
  },
  {
    id: "banana-pancakes",
    type: "breakfast",
    name: "Banana pancakes",
    nameDe: "Bananen-Pancakes",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/6bccc29de_generated_image.png",
    diets: ["balanced", "vegetarian"],
  },
  {
    id: "chickpea-bowl",
    type: "lunch",
    name: "Chickpea salad bowl",
    nameDe: "Kichererbsen-Salat-Bowl",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/84bc99f03_generated_image.png",
    diets: ["balanced", "vegetarian", "vegan"],
  },
  {
    id: "chicken-wrap",
    type: "lunch",
    name: "Grilled chicken wrap",
    nameDe: "Grillhähnchen-Wrap",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/12fcc21c5_generated_image.png",
    diets: ["balanced", "high-protein"],
  },
  {
    id: "tomato-pasta",
    type: "lunch",
    name: "Tomato pasta with basil",
    nameDe: "Tomaten-Nudeln mit Basilikum",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/4d27c3095_generated_image.png",
    diets: ["balanced", "vegetarian", "vegan"],
  },
  {
    id: "salmon-rice-bowl",
    type: "lunch",
    name: "Salmon rice bowl",
    nameDe: "Lachs-Reis-Bowl",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/0a881f2cc_generated_image.png",
    diets: ["balanced", "pescatarian", "high-protein", "gluten-free"],
  },
  {
    id: "veg-stirfry",
    type: "dinner",
    name: "Vegetable stir-fry",
    nameDe: "Gemüse-Pfanne",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/b5ca6390b_generated_image.png",
    diets: ["balanced", "vegetarian", "vegan", "gluten-free"],
  },
  {
    id: "beef-stirfry",
    type: "dinner",
    name: "Beef stir-fry with rice",
    nameDe: "Rindergulasch mit Reis",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/111538bd8_generated_image.png",
    diets: ["balanced", "high-protein"],
  },
  {
    id: "lentil-curry",
    type: "dinner",
    name: "Red lentil curry",
    nameDe: "Rote-Linsen-Curry",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/bf4bd49a4_generated_image.png",
    diets: ["balanced", "vegetarian", "vegan", "high-protein", "gluten-free"],
  },
  {
    id: "baked-salmon",
    type: "dinner",
    name: "Baked salmon with vegetables",
    nameDe: "Ofenlachs mit Gemüse",
    image: "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/00ddb594e_generated_image.png",
    diets: ["balanced", "pescatarian", "high-protein", "gluten-free"],
  },
];

export const localName = (dish, code) => (code === "de" ? dish.nameDe : dish.name) || dish.name;

// Lookup by either EN or DE name so tiles resolve images regardless of language.
export const DISH_BY_NAME = DISHES.reduce((map, d) => {
  map[d.name] = d;
  map[d.nameDe] = d;
  return map;
}, {});