import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { DISHES, localName } from "@/data/dishCatalog";
import { X, Eraser } from "lucide-react";

export default function DishPickerSheet({ open, onClose, mealType, diet, onPick, onClear, currentName }) {
  const { t, currentLanguage } = useLanguage();

  let list = mealType ? DISHES.filter((d) => d.type === mealType) : DISHES;
  if (diet && diet !== "balanced") {
    const filtered = list.filter((d) => d.diets.includes(diet));
    if (filtered.length) list = filtered;
  }

  const title = mealType ? t("pickDishFor", { meal: t(mealType) }) : t("pickDish");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border max-h-[80vh] flex flex-col"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h3 className="font-display font-semibold text-lg text-editorial-ink">{title}</h3>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-2 scrollbar-hide">
              <div className="grid grid-cols-2 gap-3">
                {list.map((d) => {
                  const name = localName(d, currentLanguage.code);
                  const active = name === currentName;
                  return (
                    <button
                      key={d.id}
                      onClick={() => onPick(name)}
                      className={`text-left rounded-xl overflow-hidden border transition-all ${
                        active ? "border-editorial ring-1 ring-editorial" : "border-border hover:border-editorial/40"
                      }`}
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        <img src={d.image} alt={name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      </div>
                      <div className="px-2.5 py-2">
                        <span className="text-xs font-medium text-foreground leading-tight line-clamp-2 block">{name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {currentName && (
                <button
                  onClick={onClear}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
                >
                  <Eraser className="h-4 w-4" /> {t("clearDay")}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}