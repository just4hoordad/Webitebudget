import { Tag } from "lucide-react";
import { motion } from "framer-motion";
import { getStoreDiscount } from "@/lib/storeDiscounts";

const STORES = ["Aldi", "Lidl", "Kaufland", "Penny", "Netto", "REWE", "Edeka"];

export default function SetupStoreChoices({ stores, toggleStore, diet, macros }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {STORES.map((store) => {
        const discount = getStoreDiscount(store, diet, macros);
        const selected = stores.includes(store);
        return (
          <motion.button
            key={store}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => toggleStore(store)}
            className={`px-3.5 py-2 text-sm inline-flex items-center gap-2 bba-chip ${
              selected ? "bba-chip-active" : ""
            }`}
          >
            <span>{store}</span>
            {discount > 0 && (
              <span
                className={`text-[10px] font-heading font-black px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 border border-[#111827] ${
                  selected ? "bg-[#FFB020] text-[#111827]" : "bg-[#F3F8E6] text-[#111827]"
                }`}
                title={`Estimated ~${discount}% cheaper than mid-range supermarkets (REWE/Edeka) on ${diet || "staple"} essentials`}
              >
                <Tag className="h-2.5 w-2.5" /> -{discount}%
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}