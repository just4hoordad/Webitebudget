import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Hardcoded realistic 2025 German supermarket price data per store.
// AI is only used for price updates — the structure is predefined.
// This ensures the catalog is always seeded correctly.

const CATALOG_DATA = {
  Aldi: [
    { product_name: "Milbona Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 0.99, normal_price: 1.29, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Halbfettmilch 1,5% 1L", category: "Dairy", comparison_key: "Halbfettmilch 1L", unit_price: 0.89, normal_price: 1.19, quantity_description: "1L", calories_info: "~46 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 1.79, normal_price: 2.49, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.59, normal_price: 0.89, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Skyr Natur 500g", category: "Dairy", comparison_key: "Skyr Natur 500g", unit_price: 1.49, normal_price: 1.99, quantity_description: "500g", calories_info: "~65 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Gouda am Stück 400g", category: "Dairy", comparison_key: "Gouda 400g", unit_price: 2.29, normal_price: 3.29, quantity_description: "400g", calories_info: "~356 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Mozzarella 125g", category: "Dairy", comparison_key: "Mozzarella 125g", unit_price: 0.69, normal_price: 0.99, quantity_description: "125g", calories_info: "~280 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Frischkäse 200g", category: "Dairy", comparison_key: "Frischkäse 200g", unit_price: 0.89, normal_price: 1.19, quantity_description: "200g", calories_info: "~160 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Goldähren Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 1.99, normal_price: 2.79, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Meine Metzgerei Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 2.99, normal_price: 4.49, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Meine Metzgerei Hackfleisch gemischt 500g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 2.99, normal_price: 3.99, quantity_description: "500g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Rio Mare Thunfisch in Wasser 185g", category: "Meat & Fish", comparison_key: "Thunfisch Dose", unit_price: 1.29, normal_price: 1.79, quantity_description: "185g", calories_info: "~99 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Gut&Günstig Toastbrot 750g", category: "Bread & Bakery", comparison_key: "Toastbrot 750g", unit_price: 0.99, normal_price: 1.49, quantity_description: "750g", calories_info: "~265 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Roggenbrot Vollkornbrot 500g", category: "Bread & Bakery", comparison_key: "Vollkornbrot 500g", unit_price: 0.99, normal_price: 1.69, quantity_description: "500g", calories_info: "~224 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 0.99, normal_price: 1.49, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.49, normal_price: 0.79, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 0.99, normal_price: 1.29, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Kartoffeln 2kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "2kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 0.89, normal_price: 1.19, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Paprika rot 3er", category: "Vegetables", comparison_key: "Paprika rot 3er", unit_price: 1.49, normal_price: 2.19, quantity_description: "3er", calories_info: "~31 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Brokkoli 500g", category: "Vegetables", comparison_key: "Brokkoli 500g", unit_price: 1.29, normal_price: 1.59, quantity_description: "500g", calories_info: "~34 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 0.99, normal_price: 1.39, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Orangen Netz 1kg", category: "Fruits", comparison_key: "Orangen 1kg", unit_price: 1.29, normal_price: 1.79, quantity_description: "1kg", calories_info: "~47 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Olivenöl 750ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 3.99, normal_price: 5.49, quantity_description: "750ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Sonnenblumenöl 1L", category: "Pantry", comparison_key: "Sonnenblumenöl 1L", unit_price: 1.49, normal_price: 1.99, quantity_description: "1L", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Tomaten Passata 500g", category: "Pantry", comparison_key: "Tomaten Passata 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~30 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Mineralwasser still 1,5L", category: "Drinks", comparison_key: "Mineralwasser 1,5L", unit_price: 0.19, normal_price: 0.49, quantity_description: "1,5L", calories_info: "~0 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 0.99, normal_price: 1.49, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Erdbeermarmelade 450g", category: "Spreads", comparison_key: "Erdbeermarmelade 450g", unit_price: 0.99, normal_price: 1.49, quantity_description: "450g", calories_info: "~250 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Choco & Nuss Schokolade 100g", category: "Snacks", comparison_key: "Vollmilchschokolade 100g", unit_price: 0.55, normal_price: 0.99, quantity_description: "100g", calories_info: "~535 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Tandil Waschmittel Pulver 1,5kg", category: "Household", comparison_key: "Waschmittel Pulver 1,5kg", unit_price: 3.49, normal_price: 5.99, quantity_description: "1,5kg", calories_info: "", diet_tags: [] },
    { product_name: "Gut&Günstig Spülmittel 500ml", category: "Household", comparison_key: "Spülmittel 500ml", unit_price: 0.69, normal_price: 1.19, quantity_description: "500ml", calories_info: "", diet_tags: [] },
  ],
  Lidl: [
    { product_name: "Milbona Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 0.99, normal_price: 1.29, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Halbfettmilch 1,5% 1L", category: "Dairy", comparison_key: "Halbfettmilch 1L", unit_price: 0.89, normal_price: 1.19, quantity_description: "1L", calories_info: "~46 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 1.89, normal_price: 2.49, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.65, normal_price: 0.89, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Skyr Natur 500g", category: "Dairy", comparison_key: "Skyr Natur 500g", unit_price: 1.49, normal_price: 1.99, quantity_description: "500g", calories_info: "~65 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Gouda am Stück 400g", category: "Dairy", comparison_key: "Gouda 400g", unit_price: 2.39, normal_price: 3.29, quantity_description: "400g", calories_info: "~356 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Mozzarella 125g", category: "Dairy", comparison_key: "Mozzarella 125g", unit_price: 0.69, normal_price: 0.99, quantity_description: "125g", calories_info: "~280 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Frischkäse 200g", category: "Dairy", comparison_key: "Frischkäse 200g", unit_price: 0.85, normal_price: 1.19, quantity_description: "200g", calories_info: "~160 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Milbona Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 1.99, normal_price: 2.79, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Landjunker Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 3.49, normal_price: 4.49, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Landjunker Hackfleisch gemischt 500g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 3.19, normal_price: 3.99, quantity_description: "500g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Nixe Thunfisch in Wasser 185g", category: "Meat & Fish", comparison_key: "Thunfisch Dose", unit_price: 1.19, normal_price: 1.79, quantity_description: "185g", calories_info: "~99 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Toastbrot 750g", category: "Bread & Bakery", comparison_key: "Toastbrot 750g", unit_price: 0.99, normal_price: 1.49, quantity_description: "750g", calories_info: "~265 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Vollkornbrot 500g", category: "Bread & Bakery", comparison_key: "Vollkornbrot 500g", unit_price: 1.09, normal_price: 1.69, quantity_description: "500g", calories_info: "~224 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Combino Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Combino Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 1.09, normal_price: 1.49, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Vitafit Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.55, normal_price: 0.79, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 0.89, normal_price: 1.29, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Kartoffeln 2kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "2kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 0.79, normal_price: 1.19, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Paprika rot 3er", category: "Vegetables", comparison_key: "Paprika rot 3er", unit_price: 1.39, normal_price: 2.19, quantity_description: "3er", calories_info: "~31 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Brokkoli 500g", category: "Vegetables", comparison_key: "Brokkoli 500g", unit_price: 1.19, normal_price: 1.59, quantity_description: "500g", calories_info: "~34 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 0.89, normal_price: 1.39, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Orangen Netz 1kg", category: "Fruits", comparison_key: "Orangen 1kg", unit_price: 1.19, normal_price: 1.79, quantity_description: "1kg", calories_info: "~47 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Primadonna Olivenöl 750ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 4.49, normal_price: 5.49, quantity_description: "750ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Vita D'or Sonnenblumenöl 1L", category: "Pantry", comparison_key: "Sonnenblumenöl 1L", unit_price: 1.49, normal_price: 1.99, quantity_description: "1L", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Combino Tomaten Passata 500g", category: "Pantry", comparison_key: "Tomaten Passata 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~30 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Saskia Mineralwasser still 1,5L", category: "Drinks", comparison_key: "Mineralwasser 1,5L", unit_price: 0.19, normal_price: 0.49, quantity_description: "1,5L", calories_info: "~0 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Vitafit Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 0.99, normal_price: 1.49, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Vitafit Apfelsaft 1L", category: "Drinks", comparison_key: "Apfelsaft 1L", unit_price: 0.89, normal_price: 1.29, quantity_description: "1L", calories_info: "~46 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Konfitüre Erdbeer 450g", category: "Spreads", comparison_key: "Erdbeermarmelade 450g", unit_price: 0.95, normal_price: 1.49, quantity_description: "450g", calories_info: "~250 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Crownfield Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 1.09, normal_price: 1.49, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "J.D. Gross Vollmilchschokolade 100g", category: "Snacks", comparison_key: "Vollmilchschokolade 100g", unit_price: 0.49, normal_price: 0.99, quantity_description: "100g", calories_info: "~535 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Formil Waschmittel Pulver 1,5kg", category: "Household", comparison_key: "Waschmittel Pulver 1,5kg", unit_price: 3.99, normal_price: 5.99, quantity_description: "1,5kg", calories_info: "", diet_tags: [] },
    { product_name: "W5 Spülmittel 500ml", category: "Household", comparison_key: "Spülmittel 500ml", unit_price: 0.65, normal_price: 1.19, quantity_description: "500ml", calories_info: "", diet_tags: [] },
  ],
  Rewe: [
    { product_name: "Ja! Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 1.05, normal_price: 1.29, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Ja! Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 1.99, normal_price: 2.69, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Ja! Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Rewe Bio Skyr Natur 500g", category: "Dairy", comparison_key: "Skyr Natur 500g", unit_price: 1.79, normal_price: 2.19, quantity_description: "500g", calories_info: "~65 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Ja! Gouda am Stück 400g", category: "Dairy", comparison_key: "Gouda 400g", unit_price: 2.69, normal_price: 3.49, quantity_description: "400g", calories_info: "~356 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Ja! Mozzarella 125g", category: "Dairy", comparison_key: "Mozzarella 125g", unit_price: 0.79, normal_price: 1.09, quantity_description: "125g", calories_info: "~280 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Ja! Frischkäse 200g", category: "Dairy", comparison_key: "Frischkäse 200g", unit_price: 0.99, normal_price: 1.29, quantity_description: "200g", calories_info: "~160 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Ja! Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 2.29, normal_price: 2.99, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Rewe Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 3.99, normal_price: 4.99, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Rewe Hackfleisch gemischt 500g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 3.49, normal_price: 4.29, quantity_description: "500g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Rewe Thunfisch in Wasser 185g", category: "Meat & Fish", comparison_key: "Thunfisch Dose", unit_price: 1.39, normal_price: 1.79, quantity_description: "185g", calories_info: "~99 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Ja! Toastbrot 750g", category: "Bread & Bakery", comparison_key: "Toastbrot 750g", unit_price: 1.09, normal_price: 1.59, quantity_description: "750g", calories_info: "~265 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Vollkornbrot 500g", category: "Bread & Bakery", comparison_key: "Vollkornbrot 500g", unit_price: 1.19, normal_price: 1.79, quantity_description: "500g", calories_info: "~224 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 0.79, normal_price: 1.09, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 1.29, normal_price: 1.69, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.59, normal_price: 0.89, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 1.19, normal_price: 1.59, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 1.09, normal_price: 1.39, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Kartoffeln 2kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.79, normal_price: 2.19, quantity_description: "2kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 0.99, normal_price: 1.29, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Paprika rot 3er", category: "Vegetables", comparison_key: "Paprika rot 3er", unit_price: 1.79, normal_price: 2.29, quantity_description: "3er", calories_info: "~31 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Brokkoli 500g", category: "Vegetables", comparison_key: "Brokkoli 500g", unit_price: 1.49, normal_price: 1.79, quantity_description: "500g", calories_info: "~34 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 1.19, normal_price: 1.49, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.79, normal_price: 2.19, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Orangen Netz 1kg", category: "Fruits", comparison_key: "Orangen 1kg", unit_price: 1.49, normal_price: 1.89, quantity_description: "1kg", calories_info: "~47 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Rewe Bio Olivenöl 750ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 5.49, normal_price: 6.99, quantity_description: "750ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Sonnenblumenöl 1L", category: "Pantry", comparison_key: "Sonnenblumenöl 1L", unit_price: 1.79, normal_price: 2.19, quantity_description: "1L", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Tomaten Passata 500g", category: "Pantry", comparison_key: "Tomaten Passata 500g", unit_price: 0.79, normal_price: 1.09, quantity_description: "500g", calories_info: "~30 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Mineralwasser still 1,5L", category: "Drinks", comparison_key: "Mineralwasser 1,5L", unit_price: 0.25, normal_price: 0.55, quantity_description: "1,5L", calories_info: "~0 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 1.09, normal_price: 1.59, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Apfelsaft 1L", category: "Drinks", comparison_key: "Apfelsaft 1L", unit_price: 0.99, normal_price: 1.39, quantity_description: "1L", calories_info: "~46 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Erdbeermarmelade 450g", category: "Spreads", comparison_key: "Erdbeermarmelade 450g", unit_price: 1.09, normal_price: 1.59, quantity_description: "450g", calories_info: "~250 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Ja! Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 1.19, normal_price: 1.69, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Rewe Schokolade Vollmilch 100g", category: "Snacks", comparison_key: "Vollmilchschokolade 100g", unit_price: 0.69, normal_price: 1.09, quantity_description: "100g", calories_info: "~535 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Rewe Waschmittel Pulver 1,5kg", category: "Household", comparison_key: "Waschmittel Pulver 1,5kg", unit_price: 4.99, normal_price: 6.49, quantity_description: "1,5kg", calories_info: "", diet_tags: [] },
    { product_name: "Ja! Spülmittel 500ml", category: "Household", comparison_key: "Spülmittel 500ml", unit_price: 0.79, normal_price: 1.19, quantity_description: "500ml", calories_info: "", diet_tags: [] },
  ],
  Edeka: [
    { product_name: "Gut&Günstig Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 1.09, normal_price: 1.39, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Gut&Günstig Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 1.99, normal_price: 2.69, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Gut&Günstig Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Gut&Günstig Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 2.19, normal_price: 2.99, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Gut&Günstig Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 3.79, normal_price: 4.99, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Gut&Günstig Hackfleisch gemischt 500g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 3.29, normal_price: 4.29, quantity_description: "500g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Gut&Günstig Toastbrot 750g", category: "Bread & Bakery", comparison_key: "Toastbrot 750g", unit_price: 1.09, normal_price: 1.59, quantity_description: "750g", calories_info: "~265 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 0.79, normal_price: 1.09, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 1.19, normal_price: 1.59, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.59, normal_price: 0.89, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 1.19, normal_price: 1.59, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 0.99, normal_price: 1.39, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Kartoffeln 2kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.79, normal_price: 2.29, quantity_description: "2kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 0.99, normal_price: 1.29, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 1.09, normal_price: 1.49, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.69, normal_price: 2.19, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Olivenöl 750ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 4.99, normal_price: 6.49, quantity_description: "750ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Sonnenblumenöl 1L", category: "Pantry", comparison_key: "Sonnenblumenöl 1L", unit_price: 1.69, normal_price: 2.19, quantity_description: "1L", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Tomaten Passata 500g", category: "Pantry", comparison_key: "Tomaten Passata 500g", unit_price: 0.79, normal_price: 1.09, quantity_description: "500g", calories_info: "~30 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Mineralwasser still 1,5L", category: "Drinks", comparison_key: "Mineralwasser 1,5L", unit_price: 0.25, normal_price: 0.55, quantity_description: "1,5L", calories_info: "~0 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 1.09, normal_price: 1.59, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Erdbeermarmelade 450g", category: "Spreads", comparison_key: "Erdbeermarmelade 450g", unit_price: 1.09, normal_price: 1.59, quantity_description: "450g", calories_info: "~250 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 1.09, normal_price: 1.59, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Gut&Günstig Schokolade 100g", category: "Snacks", comparison_key: "Vollmilchschokolade 100g", unit_price: 0.59, normal_price: 0.99, quantity_description: "100g", calories_info: "~535 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Gut&Günstig Waschmittel Pulver 1,5kg", category: "Household", comparison_key: "Waschmittel Pulver 1,5kg", unit_price: 4.49, normal_price: 5.99, quantity_description: "1,5kg", calories_info: "", diet_tags: [] },
    { product_name: "Gut&Günstig Spülmittel 500ml", category: "Household", comparison_key: "Spülmittel 500ml", unit_price: 0.69, normal_price: 1.19, quantity_description: "500ml", calories_info: "", diet_tags: [] },
  ],
  Penny: [
    { product_name: "Penny Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 0.99, normal_price: 1.29, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Penny Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 1.79, normal_price: 2.49, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Penny Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.59, normal_price: 0.89, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Penny Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 1.99, normal_price: 2.79, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Penny Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 3.29, normal_price: 4.49, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Penny Hackfleisch gemischt 500g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 2.99, normal_price: 3.99, quantity_description: "500g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Penny Toastbrot 750g", category: "Bread & Bakery", comparison_key: "Toastbrot 750g", unit_price: 0.99, normal_price: 1.49, quantity_description: "750g", calories_info: "~265 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 0.99, normal_price: 1.49, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.49, normal_price: 0.79, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 0.89, normal_price: 1.29, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Kartoffeln 2kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "2kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 0.89, normal_price: 1.19, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 0.99, normal_price: 1.39, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Olivenöl 750ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 4.29, normal_price: 5.49, quantity_description: "750ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Sonnenblumenöl 1L", category: "Pantry", comparison_key: "Sonnenblumenöl 1L", unit_price: 1.49, normal_price: 1.99, quantity_description: "1L", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Mineralwasser still 1,5L", category: "Drinks", comparison_key: "Mineralwasser 1,5L", unit_price: 0.19, normal_price: 0.49, quantity_description: "1,5L", calories_info: "~0 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 0.99, normal_price: 1.49, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Penny Schokolade 100g", category: "Snacks", comparison_key: "Vollmilchschokolade 100g", unit_price: 0.55, normal_price: 0.99, quantity_description: "100g", calories_info: "~535 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Penny Spülmittel 500ml", category: "Household", comparison_key: "Spülmittel 500ml", unit_price: 0.69, normal_price: 1.19, quantity_description: "500ml", calories_info: "", diet_tags: [] },
  ],
  Netto: [
    { product_name: "Netto Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 0.99, normal_price: 1.29, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Netto Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 1.79, normal_price: 2.49, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Netto Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.59, normal_price: 0.89, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Netto Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 1.99, normal_price: 2.79, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Netto Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 3.19, normal_price: 4.49, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Netto Hackfleisch gemischt 500g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 2.99, normal_price: 3.99, quantity_description: "500g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"] },
    { product_name: "Netto Toastbrot 750g", category: "Bread & Bakery", comparison_key: "Toastbrot 750g", unit_price: 0.99, normal_price: 1.49, quantity_description: "750g", calories_info: "~265 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 0.69, normal_price: 0.99, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 0.99, normal_price: 1.49, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.49, normal_price: 0.79, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 0.89, normal_price: 1.29, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Kartoffeln 2kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "2kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 0.89, normal_price: 1.19, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 0.99, normal_price: 1.39, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.49, normal_price: 1.99, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Olivenöl 750ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 4.19, normal_price: 5.49, quantity_description: "750ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Sonnenblumenöl 1L", category: "Pantry", comparison_key: "Sonnenblumenöl 1L", unit_price: 1.39, normal_price: 1.99, quantity_description: "1L", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Mineralwasser still 1,5L", category: "Drinks", comparison_key: "Mineralwasser 1,5L", unit_price: 0.19, normal_price: 0.49, quantity_description: "1,5L", calories_info: "~0 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 0.99, normal_price: 1.49, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 0.99, normal_price: 1.49, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"] },
    { product_name: "Netto Schokolade 100g", category: "Snacks", comparison_key: "Vollmilchschokolade 100g", unit_price: 0.55, normal_price: 0.99, quantity_description: "100g", calories_info: "~535 kcal/100g", diet_tags: ["balanced", "vegetarian"] },
    { product_name: "Netto Spülmittel 500ml", category: "Household", comparison_key: "Spülmittel 500ml", unit_price: 0.69, normal_price: 1.19, quantity_description: "500ml", calories_info: "", diet_tags: [] },
  ],
};

// Bio / organic products available at major German chains
const BIO_CATALOG_DATA = [
  // Rewe Bio line
  { store: "Rewe", product_name: "Rewe Bio Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 1.29, normal_price: 1.59, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 2.49, normal_price: 2.99, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.99, normal_price: 1.29, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 3.49, normal_price: 3.99, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Gouda 400g", category: "Dairy", comparison_key: "Gouda 400g", unit_price: 3.49, normal_price: 3.99, quantity_description: "400g", calories_info: "~356 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Hähnchenbrust 500g", category: "Meat & Fish", comparison_key: "Hähnchenbrust 500g", unit_price: 5.99, normal_price: 6.99, quantity_description: "500g", calories_info: "~165 kcal/100g", diet_tags: ["balanced"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Hackfleisch Rind 400g", category: "Meat & Fish", comparison_key: "Hackfleisch 500g", unit_price: 5.49, normal_price: 6.49, quantity_description: "400g", calories_info: "~215 kcal/100g", diet_tags: ["balanced"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 1.29, normal_price: 1.59, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 1.99, normal_price: 2.49, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 1.09, normal_price: 1.39, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Müsli 500g", category: "Grains & Pasta", comparison_key: "Müsli 500g", unit_price: 1.99, normal_price: 2.49, quantity_description: "500g", calories_info: "~375 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Vollkornbrot 500g", category: "Bread & Bakery", comparison_key: "Vollkornbrot 500g", unit_price: 1.79, normal_price: 2.19, quantity_description: "500g", calories_info: "~224 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 1.69, normal_price: 1.99, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 1.49, normal_price: 1.79, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Kartoffeln 1,5kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.99, normal_price: 2.49, quantity_description: "1,5kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Zwiebeln 1kg", category: "Vegetables", comparison_key: "Zwiebeln 1kg", unit_price: 1.29, normal_price: 1.59, quantity_description: "1kg", calories_info: "~40 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Paprika rot 3er", category: "Vegetables", comparison_key: "Paprika rot 3er", unit_price: 2.29, normal_price: 2.79, quantity_description: "3er", calories_info: "~31 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Brokkoli 500g", category: "Vegetables", comparison_key: "Brokkoli 500g", unit_price: 1.79, normal_price: 2.19, quantity_description: "500g", calories_info: "~34 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 1.49, normal_price: 1.79, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 2.29, normal_price: 2.79, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Olivenöl 500ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 4.99, normal_price: 5.99, quantity_description: "500ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Tomaten Passata 500g", category: "Pantry", comparison_key: "Tomaten Passata 500g", unit_price: 1.29, normal_price: 1.59, quantity_description: "500g", calories_info: "~30 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Erdbeerkonfitüre 330g", category: "Spreads", comparison_key: "Erdbeermarmelade 450g", unit_price: 1.99, normal_price: 2.49, quantity_description: "330g", calories_info: "~250 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Rewe", product_name: "Rewe Bio Orangensaft 1L", category: "Drinks", comparison_key: "Orangensaft 1L", unit_price: 1.49, normal_price: 1.79, quantity_description: "1L", calories_info: "~45 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  // Aldi Bio / GUT BIO line
  { store: "Aldi", product_name: "GUT BIO Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 1.09, normal_price: 1.39, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 2.29, normal_price: 2.79, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.89, normal_price: 1.19, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 3.29, normal_price: 3.79, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 1.19, normal_price: 1.49, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 1.79, normal_price: 2.19, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.89, normal_price: 1.19, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 1.49, normal_price: 1.79, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 1.29, normal_price: 1.59, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Kartoffeln 1,5kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.79, normal_price: 2.19, quantity_description: "1,5kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 1.29, normal_price: 1.59, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.99, normal_price: 2.49, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Olivenöl 500ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 3.99, normal_price: 4.99, quantity_description: "500ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Vollkornbrot 500g", category: "Bread & Bakery", comparison_key: "Vollkornbrot 500g", unit_price: 1.59, normal_price: 1.99, quantity_description: "500g", calories_info: "~224 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Aldi", product_name: "GUT BIO Tomaten Passata 500g", category: "Pantry", comparison_key: "Tomaten Passata 500g", unit_price: 1.09, normal_price: 1.39, quantity_description: "500g", calories_info: "~30 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  // Lidl Bio line
  { store: "Lidl", product_name: "Bio Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 1.09, normal_price: 1.39, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Lidl", product_name: "Bio Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 2.29, normal_price: 2.79, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Lidl", product_name: "Bio Naturjoghurt 500g", category: "Dairy", comparison_key: "Naturjoghurt 500g", unit_price: 0.89, normal_price: 1.19, quantity_description: "500g", calories_info: "~61 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Lidl", product_name: "Bio Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 3.19, normal_price: 3.69, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Lidl", product_name: "Bio Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 1.19, normal_price: 1.49, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Langkornreis 1kg", category: "Grains & Pasta", comparison_key: "Reis Langkorn 1kg", unit_price: 1.79, normal_price: 2.19, quantity_description: "1kg", calories_info: "~350 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Haferflocken 500g", category: "Grains & Pasta", comparison_key: "Haferflocken 500g", unit_price: 0.89, normal_price: 1.19, quantity_description: "500g", calories_info: "~372 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 1.49, normal_price: 1.79, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 1.29, normal_price: 1.59, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Kartoffeln 1,5kg", category: "Vegetables", comparison_key: "Kartoffeln 2kg", unit_price: 1.79, normal_price: 2.19, quantity_description: "1,5kg", calories_info: "~77 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 1.19, normal_price: 1.49, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 1.99, normal_price: 2.49, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Lidl", product_name: "Bio Olivenöl 500ml", category: "Pantry", comparison_key: "Olivenöl 750ml", unit_price: 3.99, normal_price: 4.79, quantity_description: "500ml", calories_info: "~884 kcal/100ml", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  // Edeka Bio line
  { store: "Edeka", product_name: "Edeka Bio Vollmilch 3,5% 1L", category: "Dairy", comparison_key: "Vollmilch 1L", unit_price: 1.19, normal_price: 1.49, quantity_description: "1L", calories_info: "~65 kcal/100ml", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Butter 250g", category: "Dairy", comparison_key: "Butter 250g", unit_price: 2.49, normal_price: 2.99, quantity_description: "250g", calories_info: "~717 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Eier 10er", category: "Dairy", comparison_key: "Eier 10er", unit_price: 3.49, normal_price: 3.99, quantity_description: "10er", calories_info: "~155 kcal/100g", diet_tags: ["balanced", "vegetarian"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Spaghetti 500g", category: "Grains & Pasta", comparison_key: "Nudeln Spaghetti 500g", unit_price: 1.29, normal_price: 1.59, quantity_description: "500g", calories_info: "~352 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Tomaten 500g", category: "Vegetables", comparison_key: "Tomaten 500g", unit_price: 1.59, normal_price: 1.99, quantity_description: "500g", calories_info: "~18 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Karotten 1kg", category: "Vegetables", comparison_key: "Karotten 1kg", unit_price: 1.39, normal_price: 1.69, quantity_description: "1kg", calories_info: "~41 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Bananen 1kg", category: "Fruits", comparison_key: "Bananen 1kg", unit_price: 1.39, normal_price: 1.69, quantity_description: "1kg", calories_info: "~89 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
  { store: "Edeka", product_name: "Edeka Bio Äpfel 1kg", category: "Fruits", comparison_key: "Äpfel 1kg", unit_price: 2.19, normal_price: 2.69, quantity_description: "1kg", calories_info: "~52 kcal/100g", diet_tags: ["balanced", "vegetarian", "vegan"], bio: true },
];

// Additional stores use Aldi prices as baseline with slight adjustments
const EXTRA_STORES = ["Kaufland", "Norma", "Globus", "Tegut"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().split('T')[0];

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { store: specificStore = null, reseed = false } = body;

    // If reseed, clear existing records first
    if (reseed) {
      console.log("Reseed requested — clearing old PriceCatalog...");
      // Delete all existing records by fetching and deleting in batches
      const existing = await base44.asServiceRole.entities.PriceCatalog.list();
      if (existing.length > 0) {
        for (const record of existing) {
          await base44.asServiceRole.entities.PriceCatalog.delete(record.id);
        }
        console.log(`Deleted ${existing.length} old records`);
      }
    }

    // Seed bio items (store-agnostic pass — always run unless specific store requested)
    if (!specificStore || reseed) {
      const bioStoresToRun = specificStore
        ? BIO_CATALOG_DATA.filter(i => i.store.toLowerCase() === specificStore.toLowerCase())
        : BIO_CATALOG_DATA;
      const bioByStore = {};
      for (const item of bioStoresToRun) {
        if (!bioByStore[item.store]) bioByStore[item.store] = [];
        bioByStore[item.store].push(item);
      }
      for (const [store, items] of Object.entries(bioByStore)) {
        const existingBio = await base44.asServiceRole.entities.PriceCatalog.filter({ store, last_updated: today, bio: true });
        if (!reseed && existingBio.length >= 5) {
          console.log(`${store} bio: already up to date (${existingBio.length} items), skipping`);
          continue;
        }
        const records = items.map(item => ({ ...item, last_updated: today }));
        await base44.asServiceRole.entities.PriceCatalog.bulkCreate(records);
        console.log(`${store} bio: inserted ${records.length} bio products`);
      }
    }

    // Always ensure bio items are seeded (check by bio flag)
    const existingBio = await base44.asServiceRole.entities.PriceCatalog.filter({ bio: true });
    if (existingBio.length < BIO_CATALOG_DATA.length) {
      const bioToInsert = BIO_CATALOG_DATA.map(item => ({ ...item, last_updated: today }));
      await base44.asServiceRole.entities.PriceCatalog.bulkCreate(bioToInsert);
      console.log(`Seeded ${bioToInsert.length} bio products`);
    }

    const storesToRun = specificStore ? [specificStore] : Object.keys(CATALOG_DATA);
    const allInserted = [];

    for (const store of storesToRun) {
      let items = CATALOG_DATA[store];

      // For extra stores not in CATALOG_DATA, generate from Aldi with price variance
      if (!items && EXTRA_STORES.includes(store)) {
        items = (CATALOG_DATA.Aldi || []).map(item => ({
          ...item,
          store,
          product_name: item.product_name.replace(/Gut&Günstig|Milbona|Goldähren|Meine Metzgerei|Tandil/g, store),
          unit_price: parseFloat((item.unit_price * (0.95 + Math.random() * 0.15)).toFixed(2)),
        }));
      }

      if (!items || items.length === 0) {
        console.log(`No data for store: ${store}`);
        continue;
      }

      // Check if this store already has fresh data (updated today)
      const existing = await base44.asServiceRole.entities.PriceCatalog.filter({ store, last_updated: today });
      if (!reseed && existing.length >= 20) {
        console.log(`${store}: already up to date (${existing.length} items), skipping`);
        continue;
      }

      const records = items.map(item => ({ ...item, store, last_updated: today }));
      await base44.asServiceRole.entities.PriceCatalog.bulkCreate(records);
      allInserted.push(...records.map(r => `${store}: ${r.product_name}`));
      console.log(`${store}: inserted ${records.length} products`);
    }

    return Response.json({
      updated: allInserted.length,
      stores: storesToRun,
      message: allInserted.length === 0 ? "All stores already up to date" : `Inserted ${allInserted.length} records`,
    });
  } catch (error) {
    console.error("refreshPriceCatalog error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});