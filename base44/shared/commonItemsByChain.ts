// The 100 most commonly bought items PER supermarket chain. Each chain has its
// own list built from that chain's real house-brand product names, so the daily
// price catalog fetches chain-accurate products (e.g. "Gut Bio Vollmilch" at
// Aldi, "Milbona Vollmilch" at Lidl, "JA! Spaghetti" at REWE) instead of one
// generic list shared across every chain. dm and Rossmann are drugstores, so
// their lists drop fresh meat/fish/produce/bakery and add cosmetics, baby,
// household and health items with their own brands.

type Group =
  | "dairy" | "meat" | "produce" | "bakery" | "pasta" | "pantry"
  | "beverage" | "snack" | "frozen" | "household"
  | "cosmetics" | "baby" | "health";

type BaseItem = { name: string; quantity: string; group: Group };

const GROCERY_BASE: BaseItem[] = [
  // dairy (16)
  { name: "Vollmilch 3,5% 1L", quantity: "1L", group: "dairy" },
  { name: "fettarme Milch 1,5% 1L", quantity: "1L", group: "dairy" },
  { name: "H-Milch 3,5% 1L", quantity: "1L", group: "dairy" },
  { name: "Naturjoghurt 500g", quantity: "500g", group: "dairy" },
  { name: "Griechischer Joghurt 500g", quantity: "500g", group: "dairy" },
  { name: "Magerquark 500g", quantity: "500g", group: "dairy" },
  { name: "Speisequark 250g", quantity: "250g", group: "dairy" },
  { name: "Skyr 500g", quantity: "500g", group: "dairy" },
  { name: "Gouda 200g", quantity: "200g", group: "dairy" },
  { name: "Emmentaler gerieben 200g", quantity: "200g", group: "dairy" },
  { name: "Parmesan 100g", quantity: "100g", group: "dairy" },
  { name: "Frischkäse 200g", quantity: "200g", group: "dairy" },
  { name: "Mozzarella 125g", quantity: "125g", group: "dairy" },
  { name: "Schlagsahne 200ml", quantity: "200ml", group: "dairy" },
  { name: "Butterkäse 200g", quantity: "200g", group: "dairy" },
  { name: "Eier 10er", quantity: "10 Stk", group: "dairy" },
  // meat & fish (12)
  { name: "Hähnchenbrustfilet 500g", quantity: "500g", group: "meat" },
  { name: "Hackfleisch gemischt 500g", quantity: "500g", group: "meat" },
  { name: "Rinderhackfleisch 500g", quantity: "500g", group: "meat" },
  { name: "Schweinerückensteak 400g", quantity: "400g", group: "meat" },
  { name: "Wiener Würstchen 5 Paar", quantity: "5 Paar", group: "meat" },
  { name: "Salami 100g", quantity: "100g", group: "meat" },
  { name: "Leberkäse 200g", quantity: "200g", group: "meat" },
  { name: "Schinken gekocht 100g", quantity: "100g", group: "meat" },
  { name: "Thunfisch im eigenen Saft 200g", quantity: "200g", group: "meat" },
  { name: "Lachsfilet 200g", quantity: "200g", group: "meat" },
  { name: "Fischstäbchen 450g", quantity: "450g", group: "meat" },
  { name: "Garnelen 200g", quantity: "200g", group: "meat" },
  // fruit & vegetables (16) — unbranded fresh produce
  { name: "Bananen 1kg", quantity: "1kg", group: "produce" },
  { name: "Äpfel 1kg", quantity: "1kg", group: "produce" },
  { name: "Birnen 1kg", quantity: "1kg", group: "produce" },
  { name: "Orangen 1kg", quantity: "1kg", group: "produce" },
  { name: "Zitronen 500g", quantity: "500g", group: "produce" },
  { name: "Kartoffeln 2kg", quantity: "2kg", group: "produce" },
  { name: "Tomaten 500g", quantity: "500g", group: "produce" },
  { name: "Salatgurke 1 Stk", quantity: "1 Stk", group: "produce" },
  { name: "Paprika rot 500g", quantity: "500g", group: "produce" },
  { name: "Zwiebeln 1kg", quantity: "1kg", group: "produce" },
  { name: "Knoblauch 3 Stk", quantity: "3 Stk", group: "produce" },
  { name: "Karotten 1kg", quantity: "1kg", group: "produce" },
  { name: "Eisbergsalat 1 Stk", quantity: "1 Stk", group: "produce" },
  { name: "Avocado 2 Stk", quantity: "2 Stk", group: "produce" },
  { name: "Champignons 250g", quantity: "250g", group: "produce" },
  { name: "TK-Erbsen 1kg", quantity: "1kg", group: "produce" },
  // bakery (8)
  { name: "Toastbrot 500g", quantity: "500g", group: "bakery" },
  { name: "Brötchen 5 Stk", quantity: "5 Stk", group: "bakery" },
  { name: "Vollkornbrot 750g", quantity: "750g", group: "bakery" },
  { name: "Croissant 4 Stk", quantity: "4 Stk", group: "bakery" },
  { name: "Laugenstangen 4 Stk", quantity: "4 Stk", group: "bakery" },
  { name: "Knäckebrot 250g", quantity: "250g", group: "bakery" },
  { name: "Rosinenbrötchen 4 Stk", quantity: "4 Stk", group: "bakery" },
  { name: "Baguette 1 Stk", quantity: "1 Stk", group: "bakery" },
  // grains & pasta (10)
  { name: "Spaghetti 500g", quantity: "500g", group: "pasta" },
  { name: "Penne 500g", quantity: "500g", group: "pasta" },
  { name: "Basmati Reis 1kg", quantity: "1kg", group: "pasta" },
  { name: "Jasmin Reis 1kg", quantity: "1kg", group: "pasta" },
  { name: "Haferflocken 500g", quantity: "500g", group: "pasta" },
  { name: "Couscous 500g", quantity: "500g", group: "pasta" },
  { name: "Mehl Type 405 1kg", quantity: "1kg", group: "pasta" },
  { name: "Polenta 500g", quantity: "500g", group: "pasta" },
  { name: "Cornflakes 500g", quantity: "500g", group: "pasta" },
  { name: "Müsli 750g", quantity: "750g", group: "pasta" },
  // pantry & sauces (14)
  { name: "Zucker 1kg", quantity: "1kg", group: "pantry" },
  { name: "Salz 500g", quantity: "500g", group: "pantry" },
  { name: "Sonnenblumenöl 1L", quantity: "1L", group: "pantry" },
  { name: "Olivenöl 500ml", quantity: "500ml", group: "pantry" },
  { name: "Tomatenmark 200g", quantity: "200g", group: "pantry" },
  { name: "passierte Tomaten 500g", quantity: "500g", group: "pantry" },
  { name: "Tomaten stückig 400g", quantity: "400g", group: "pantry" },
  { name: "Mayonnaise 250ml", quantity: "250ml", group: "pantry" },
  { name: "Ketchup 500ml", quantity: "500ml", group: "pantry" },
  { name: "Senf mittelscharf 200g", quantity: "200g", group: "pantry" },
  { name: "Brühe Huhn 10 Würfel", quantity: "10 Würfel", group: "pantry" },
  { name: "Sojasoße 250ml", quantity: "250ml", group: "pantry" },
  { name: "Essig 500ml", quantity: "500ml", group: "pantry" },
  { name: "Erdnussbutter 350g", quantity: "350g", group: "pantry" },
  // beverages (10)
  { name: "stilles Wasser 1,5L", quantity: "1,5L", group: "beverage" },
  { name: "Mineralwasser 1,5L", quantity: "1,5L", group: "beverage" },
  { name: "Apfelsaft 1L", quantity: "1L", group: "beverage" },
  { name: "Orangensaft 1L", quantity: "1L", group: "beverage" },
  { name: "Cola 1L", quantity: "1L", group: "beverage" },
  { name: "Eistee Pfirsich 1,5L", quantity: "1,5L", group: "beverage" },
  { name: "Kaffee gemahlen 500g", quantity: "500g", group: "beverage" },
  { name: "Schwarztee 25 Beutel", quantity: "25 Beutel", group: "beverage" },
  { name: "Bier Pils 0,5L", quantity: "0,5L", group: "beverage" },
  { name: "Weißwein 0,75L", quantity: "0,75L", group: "beverage" },
  // snacks & sweet (8)
  { name: "Schokolade Vollmilch 100g", quantity: "100g", group: "snack" },
  { name: "Gummibärchen 300g", quantity: "300g", group: "snack" },
  { name: "Kartoffelchips 150g", quantity: "150g", group: "snack" },
  { name: "Salzstangen 200g", quantity: "200g", group: "snack" },
  { name: "Studentenfutter 200g", quantity: "200g", group: "snack" },
  { name: "Butterkekse 200g", quantity: "200g", group: "snack" },
  { name: "Honig 500g", quantity: "500g", group: "snack" },
  { name: "Nuss-Nougat-Creme 400g", quantity: "400g", group: "snack" },
  // frozen & convenience (3)
  { name: "TK-Pommes 1kg", quantity: "1kg", group: "frozen" },
  { name: "TK-Pizza 1 Stk", quantity: "1 Stk", group: "frozen" },
  { name: "TK-Beeren 500g", quantity: "500g", group: "frozen" },
  // household & hygiene (3)
  { name: "Toilettenpapier 8 Rollen", quantity: "8 Rollen", group: "household" },
  { name: "Küchenrolle 4 Rollen", quantity: "4 Rollen", group: "household" },
  { name: "Spülmittel 500ml", quantity: "500ml", group: "household" },
];

const DRUGSTORE_BASE: BaseItem[] = [
  // dairy (10)
  { name: "Vollmilch 3,5% 1L", quantity: "1L", group: "dairy" },
  { name: "fettarme Milch 1,5% 1L", quantity: "1L", group: "dairy" },
  { name: "H-Milch 3,5% 1L", quantity: "1L", group: "dairy" },
  { name: "Naturjoghurt 500g", quantity: "500g", group: "dairy" },
  { name: "Griechischer Joghurt 500g", quantity: "500g", group: "dairy" },
  { name: "Magerquark 500g", quantity: "500g", group: "dairy" },
  { name: "Skyr 500g", quantity: "500g", group: "dairy" },
  { name: "Gouda 200g", quantity: "200g", group: "dairy" },
  { name: "Mozzarella 125g", quantity: "125g", group: "dairy" },
  { name: "Eier 10er", quantity: "10 Stk", group: "dairy" },
  // pantry (15)
  { name: "Haferflocken 500g", quantity: "500g", group: "pantry" },
  { name: "Couscous 500g", quantity: "500g", group: "pantry" },
  { name: "Mehl Type 405 1kg", quantity: "1kg", group: "pantry" },
  { name: "Zucker 1kg", quantity: "1kg", group: "pantry" },
  { name: "Salz 500g", quantity: "500g", group: "pantry" },
  { name: "Sonnenblumenöl 1L", quantity: "1L", group: "pantry" },
  { name: "Olivenöl 500ml", quantity: "500ml", group: "pantry" },
  { name: "Tomatenmark 200g", quantity: "200g", group: "pantry" },
  { name: "passierte Tomaten 500g", quantity: "500g", group: "pantry" },
  { name: "Tomaten stückig 400g", quantity: "400g", group: "pantry" },
  { name: "Spaghetti 500g", quantity: "500g", group: "pantry" },
  { name: "Penne 500g", quantity: "500g", group: "pantry" },
  { name: "Basmati Reis 1kg", quantity: "1kg", group: "pantry" },
  { name: "Sojasoße 250ml", quantity: "250ml", group: "pantry" },
  { name: "Essig 500ml", quantity: "500ml", group: "pantry" },
  // snacks & sweet (12)
  { name: "Schokolade Vollmilch 100g", quantity: "100g", group: "snack" },
  { name: "Gummibärchen 300g", quantity: "300g", group: "snack" },
  { name: "Studentenfutter 200g", quantity: "200g", group: "snack" },
  { name: "Butterkekse 200g", quantity: "200g", group: "snack" },
  { name: "Honig 500g", quantity: "500g", group: "snack" },
  { name: "Nuss-Nougat-Creme 400g", quantity: "400g", group: "snack" },
  { name: "Cornflakes 500g", quantity: "500g", group: "snack" },
  { name: "Müsli 750g", quantity: "750g", group: "snack" },
  { name: "Kartoffelchips 150g", quantity: "150g", group: "snack" },
  { name: "Salzstangen 200g", quantity: "200g", group: "snack" },
  { name: "Erdnussbutter 350g", quantity: "350g", group: "snack" },
  { name: "Kaffee gemahlen 500g", quantity: "500g", group: "snack" },
  // beverages (10)
  { name: "stilles Wasser 1,5L", quantity: "1,5L", group: "beverage" },
  { name: "Mineralwasser 1,5L", quantity: "1,5L", group: "beverage" },
  { name: "Apfelsaft 1L", quantity: "1L", group: "beverage" },
  { name: "Orangensaft 1L", quantity: "1L", group: "beverage" },
  { name: "Eistee Pfirsich 1,5L", quantity: "1,5L", group: "beverage" },
  { name: "Schwarztee 25 Beutel", quantity: "25 Beutel", group: "beverage" },
  { name: "Grüner Tee 25 Beutel", quantity: "25 Beutel", group: "beverage" },
  { name: "Cola 1L", quantity: "1L", group: "beverage" },
  { name: "Traubensaft 1L", quantity: "1L", group: "beverage" },
  { name: "Multivitaminsaft 1L", quantity: "1L", group: "beverage" },
  // frozen (5)
  { name: "TK-Erbsen 1kg", quantity: "1kg", group: "frozen" },
  { name: "TK-Pommes 1kg", quantity: "1kg", group: "frozen" },
  { name: "TK-Beeren 500g", quantity: "500g", group: "frozen" },
  { name: "TK-Pizza 1 Stk", quantity: "1 Stk", group: "frozen" },
  { name: "TK-Gemüse 1kg", quantity: "1kg", group: "frozen" },
  // cosmetics (20)
  { name: "Duschgel 250ml", quantity: "250ml", group: "cosmetics" },
  { name: "Shampoo 250ml", quantity: "250ml", group: "cosmetics" },
  { name: "Conditioner 250ml", quantity: "250ml", group: "cosmetics" },
  { name: "Seife 100g", quantity: "100g", group: "cosmetics" },
  { name: "Handcreme 100ml", quantity: "100ml", group: "cosmetics" },
  { name: "Gesichtscreme 50ml", quantity: "50ml", group: "cosmetics" },
  { name: "Zahncreme 75ml", quantity: "75ml", group: "cosmetics" },
  { name: "Deo Roll-on 50ml", quantity: "50ml", group: "cosmetics" },
  { name: "Deo Spray 150ml", quantity: "150ml", group: "cosmetics" },
  { name: "Rasierschaum 200ml", quantity: "200ml", group: "cosmetics" },
  { name: "Tagescreme 50ml", quantity: "50ml", group: "cosmetics" },
  { name: "Nachtcreme 50ml", quantity: "50ml", group: "cosmetics" },
  { name: "Bodylotion 250ml", quantity: "250ml", group: "cosmetics" },
  { name: "Sonnencreme 200ml", quantity: "200ml", group: "cosmetics" },
  { name: "Gesichtsreinigung 200ml", quantity: "200ml", group: "cosmetics" },
  { name: "Haarmaske 200ml", quantity: "200ml", group: "cosmetics" },
  { name: "Handseife 300ml", quantity: "300ml", group: "cosmetics" },
  { name: "Wattepads 80 Stk", quantity: "80 Stk", group: "cosmetics" },
  { name: "Zahnseide 50m", quantity: "50m", group: "cosmetics" },
  { name: "Mundspülung 500ml", quantity: "500ml", group: "cosmetics" },
  // baby (10)
  { name: "Windeln Größe 4 56 Stk", quantity: "56 Stk", group: "baby" },
  { name: "Feuchttücher 60 Stk", quantity: "60 Stk", group: "baby" },
  { name: "Babyshampoo 200ml", quantity: "200ml", group: "baby" },
  { name: "Babyöl 200ml", quantity: "200ml", group: "baby" },
  { name: "Babycreme 100ml", quantity: "100ml", group: "baby" },
  { name: "Brei Apfel 250g", quantity: "250g", group: "baby" },
  { name: "Brei Banane 250g", quantity: "250g", group: "baby" },
  { name: "Milchbrei 250g", quantity: "250g", group: "baby" },
  { name: "Gläschen Karotten 190g", quantity: "190g", group: "baby" },
  { name: "Trinklernflasche 260ml", quantity: "260ml", group: "baby" },
  // household (10)
  { name: "Spülmittel 500ml", quantity: "500ml", group: "household" },
  { name: "Waschmittel 3kg", quantity: "3kg", group: "household" },
  { name: "Weichspüler 2,5L", quantity: "2,5L", group: "household" },
  { name: "Allzweckreiniger 1L", quantity: "1L", group: "household" },
  { name: "Glasreiniger 500ml", quantity: "500ml", group: "household" },
  { name: "Badreiniger 750ml", quantity: "750ml", group: "household" },
  { name: "Toilettenreiniger 750ml", quantity: "750ml", group: "household" },
  { name: "Kalklöser 500ml", quantity: "500ml", group: "household" },
  { name: "Maschinenspülmittel 1,2kg", quantity: "1,2kg", group: "household" },
  { name: "Waschmittel Pods 30 Stk", quantity: "30 Stk", group: "household" },
  // health & nutrition (8)
  { name: "Protein Riegel 50g", quantity: "50g", group: "health" },
  { name: "Protein Shake 500ml", quantity: "500ml", group: "health" },
  { name: "Müsli 750g", quantity: "750g", group: "health" },
  { name: "Tofu 400g", quantity: "400g", group: "health" },
  { name: "Sojadrink 1L", quantity: "1L", group: "health" },
  { name: "Nüsse 200g", quantity: "200g", group: "health" },
  { name: "Datteln 250g", quantity: "250g", group: "health" },
  { name: "Trockenfrüchte 250g", quantity: "250g", group: "health" },
];

const GROCERY_BRANDS: Record<string, Partial<Record<Group, string>>> = {
  Aldi: { dairy: "Gut Bio", meat: "Meine Metzgerei", bakery: "Gut Bio", pasta: "Cucina Nobile", pantry: "Gut Bio", beverage: "Rio d'Oro", snack: "Choceur", frozen: "Gut Bio", household: "Tandil" },
  Lidl: { dairy: "Milbona", meat: "Chef Select", bakery: "Belbake", pasta: "Vitasia", pantry: "Combino", beverage: "Solevita", snack: "Crownfield", frozen: "Freshona", household: "W5" },
  REWE: { dairy: "REWE Beste Wahl", meat: "REWE Beste Wahl", bakery: "JA!", pasta: "JA!", pantry: "JA!", beverage: "REWE Beste Wahl", snack: "REWE Beste Wahl", frozen: "JA!", household: "JA!" },
  Edeka: { dairy: "Gut & Günstig", meat: "Gut & Günstig", bakery: "Gut & Günstig", pasta: "Gut & Günstig", pantry: "Gut & Günstig", beverage: "Gut & Günstig", snack: "Gut & Günstig", frozen: "Gut & Günstig", household: "Gut & Günstig" },
  Kaufland: { dairy: "K-Classic", meat: "K-Classic", bakery: "K-Classic", pasta: "K-Classic", pantry: "K-Classic", beverage: "K-Classic", snack: "K-Classic", frozen: "K-Classic", household: "K-Classic" },
  Penny: { dairy: "Penny", meat: "Penny", bakery: "Penny", pasta: "Penny", pantry: "Penny", beverage: "Penny", snack: "Penny", frozen: "Penny", household: "Penny" },
  Netto: { dairy: "Netto", meat: "Netto", bakery: "Netto", pasta: "Netto", pantry: "Netto", beverage: "Netto", snack: "Netto", frozen: "Netto", household: "Netto" },
  Norma: { dairy: "Norma", meat: "Norma", bakery: "Norma", pasta: "Norma", pantry: "Norma", beverage: "Norma", snack: "Norma", frozen: "Norma", household: "Norma" },
  tegut: { dairy: "tegut", meat: "tegut", bakery: "tegut", pasta: "tegut", pantry: "tegut", beverage: "tegut", snack: "tegut", frozen: "tegut", household: "tegut" },
};

const DRUGSTORE_BRANDS: Record<string, Partial<Record<Group, string>>> = {
  dm: { dairy: "dmBio", pantry: "dmBio", snack: "dmBio", beverage: "dmBio", frozen: "dmBio", cosmetics: "Balea", baby: "Babylove", household: "DENK MIT", health: "Sportness" },
  Rossmann: { dairy: "EnerBio", pantry: "EnerBio", snack: "EnerBio", beverage: "EnerBio", frozen: "EnerBio", cosmetics: "Isana", baby: "babydream", household: "Domol", health: "EnerBio" },
};

const SUPERMARKETS = ["Aldi", "Lidl", "REWE", "Edeka", "Kaufland", "Penny", "Netto", "Norma", "tegut"];
const DRUGSTORES = ["dm", "Rossmann"];

function buildList(chain: string, base: BaseItem[], brands: Record<string, Partial<Record<Group, string>>>): { name: string; quantity: string }[] {
  const map = brands[chain] || {};
  return base.map((it) => {
    // Fresh produce is unbranded — sold by weight, identical across chains.
    if (it.group === "produce") return { name: it.name, quantity: it.quantity };
    const brand = map[it.group];
    return { name: brand ? `${brand} ${it.name}` : it.name, quantity: it.quantity };
  });
}

export const COMMON_ITEMS_BY_CHAIN: Record<string, { name: string; quantity: string }[]> = {};
for (const ch of SUPERMARKETS) COMMON_ITEMS_BY_CHAIN[ch] = buildList(ch, GROCERY_BASE, GROCERY_BRANDS);
for (const ch of DRUGSTORES) COMMON_ITEMS_BY_CHAIN[ch] = buildList(ch, DRUGSTORE_BASE, DRUGSTORE_BRANDS);

export const CHAINS_WITH_CATALOG = Object.keys(COMMON_ITEMS_BY_CHAIN);