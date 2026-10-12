import { Tag } from "lucide-react";
import { getStoreDiscount } from "@/lib/storeDiscounts";

const STORES = ["Aldi", "Lidl", "Kaufland", "Penny", "Netto", "REWE", "Edeka"];

export default function SetupStoreChoices({ stores, toggleStore, diet, macros, onComplete }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STORES.map((store) => {
        const discount = getStoreDiscount(store, diet, macros);
        const selected = stores.includes(store);
        return (
          <button key={store} onClick={() => toggleStore(store)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all inline-flex items-center gap-1.5 ${selected ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
            <span>{store}</span>
            {discount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 transition-colors ${selected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary border border-primary/30"}`}
                title={`Estimated ~${discount}% cheaper than mid-range supermarkets (REWE/Edeka) on ${diet || "staple"} essentials`}>
                <Tag className="h-2.5 w-2.5" /> -{discount}%
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}