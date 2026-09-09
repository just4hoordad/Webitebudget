import { useLanguage } from "@/lib/LanguageContext";
import { LayoutGrid, Store } from "lucide-react";

const L = {
  en: { category: "By category", store: "By supermarket" },
  de: { category: "Nach Kategorie", store: "Nach Supermarkt" },
  fr: { category: "Par catégorie", store: "Par supermarché" },
  es: { category: "Por categoría", store: "Por supermercado" },
  ar: { category: "حسب الفئة", store: "حسب السوبر ماركت" },
  ru: { category: "По категории", store: "По супермаркету" },
  uk: { category: "За категорією", store: "За супермаркетом" },
  fa: { category: "بر اساس دسته", store: "بر اساس سوپرمارکت" },
  zh: { category: "按类别", store: "按超市" },
  vi: { category: "Theo danh mục", store: "Theo siêu thị" },
  tr: { category: "Kategoriye göre", store: "Süpermarkete göre" },
  it: { category: "Per categoria", store: "Per supermercato" },
  pt: { category: "Por categoria", store: "Por supermercado" },
  pl: { category: "Według kategorii", store: "Według supermarketu" },
  nl: { category: "Op categorie", store: "Op supermarkt" },
  sv: { category: "Efter kategori", store: "Efter snabbköp" },
  no: { category: "Etter kategori", store: "Etter supermarked" },
  da: { category: "Efter kategori", store: "Efter supermarked" },
  fi: { category: "Kategorian mukaan", store: "Supermarketin mukaan" },
  cs: { category: "Podle kategorie", store: "Podle supermarketu" },
  hu: { category: "Kategória szerint", store: "Szupermarket szerint" },
  ro: { category: "După categorie", store: "După supermarket" },
  el: { category: "Κατά κατηγορία", store: "Κατά σούπερ μάρκετ" },
};

export default function GrocerySortToggle({ sortByStore, setSortByStore }) {
  const { currentLanguage } = useLanguage();
  const s = L[currentLanguage.code] || L.en;
  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
      <button
        onClick={() => setSortByStore(false)}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${!sortByStore ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {s.category}
      </button>
      <button
        onClick={() => setSortByStore(true)}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${sortByStore ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        <Store className="h-3.5 w-3.5" />
        {s.store}
      </button>
    </div>
  );
}