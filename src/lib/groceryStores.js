export const GROCERY_STORES = [
  { id: "aldi", name: "Aldi" },
  { id: "lidl", name: "Lidl" },
  { id: "rewe", name: "REWE" },
  { id: "edeka", name: "Edeka" },
  { id: "penny", name: "Penny" },
  { id: "netto", name: "Netto" },
  { id: "kaufland", name: "Kaufland" },
  { id: "norma", name: "Norma" },
  { id: "globus", name: "Globus" },
  { id: "tegut", name: "Tegut" },
];

export function storeNameFromId(id) {
  return GROCERY_STORES.find((s) => s.id === id)?.name || id;
}