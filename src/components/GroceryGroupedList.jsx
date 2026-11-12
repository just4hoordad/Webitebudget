import GroceryItemRow from "@/components/GroceryItemRow";
import StoreBadge from "@/components/StoreBadge";
import GrocerySortToggle from "@/components/GrocerySortToggle";

const CAT_HEADER_BGS = [
  "bg-[#78a71b]",
  "bg-[#FFB020]",
  "bg-[#7DD3FC]",
  "bg-[#FF8FB5]",
  "bg-[#C084FC]",
];

export default function GroceryGroupedList({
  categories = [],
  activeItems = [],
  removedItems,
  sortByStore,
  setSortByStore,
  translateCategory,
  stores,
  boughtItems,
  onToggleBought,
  onSwap,
  onRemove,
  readOnly = false,
}) {
  return (
    <div className="space-y-4">
      <GrocerySortToggle sortByStore={sortByStore} setSortByStore={setSortByStore} />
      {!sortByStore ? (
        categories.map((category, catIdx) => {
          const visibleItems = (category.items || []).filter(
            (item) => !removedItems.has(`${category.name}::${item.name}`)
          );
          if (!visibleItems.length) return null;
          const catTotal = visibleItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
          const headerBg = CAT_HEADER_BGS[catIdx % CAT_HEADER_BGS.length];
          return (
            <div key={category.name} className="bba-t bg-card text-card-foreground p-0 overflow-hidden">
              <div className={`${headerBg} text-[#111827] border-b-[3px] border-[#111827] px-4 sm:px-5 py-3 flex items-center justify-between gap-2`}>
                <h2 className="font-heading font-black text-sm uppercase tracking-wider text-[#111827]">
                  {translateCategory(category.name)}
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-heading font-black bg-white/80 text-[#111827] border-[1.5px] border-[#111827] rounded-full px-2.5 py-0.5">
                    {visibleItems.length}
                  </span>
                  <span className="text-xs font-heading font-black bg-white text-[#111827] border-[1.5px] border-[#111827] rounded-full px-2.5 py-0.5 shadow-[1.5px_1.5px_0_#111827] tabular-nums">
                    €{catTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="divide-y-2 divide-[#111827]/12 dark:divide-white/15">
                {visibleItems.map((item, idx) => (
                  <GroceryItemRow
                    key={idx}
                    item={item}
                    categoryName={category.name}
                    stores={stores}
                    bought={boughtItems.has(`${category.name}::${item.name}`)}
                    onToggleBought={() => onToggleBought(`${category.name}::${item.name}`)}
                    onSwap={onSwap}
                    onRemove={onRemove}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        (() => {
          const groups = {};
          activeItems.forEach((it) => {
            const key = it.store || "__other__";
            (groups[key] = groups[key] || []).push(it);
          });
          return Object.keys(groups)
            .sort()
            .map((storeName, sIdx) => {
              const storeItems = groups[storeName];
              const storeTotal = storeItems.reduce((s, it) => s + (Number(it.price) || 0), 0);
              const headerBg = CAT_HEADER_BGS[sIdx % CAT_HEADER_BGS.length];
              return (
                <div key={storeName} className="bba-t bg-card text-card-foreground p-0 overflow-hidden">
                  <div className={`${headerBg} text-[#111827] border-b-[3px] border-[#111827] px-4 sm:px-5 py-3 flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {storeName !== "__other__" && <StoreBadge store={storeName} />}
                      <span className="font-heading font-black text-sm uppercase tracking-wider text-[#111827] truncate">
                        {storeName === "__other__" ? "Other" : storeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-heading font-black bg-white/80 text-[#111827] border-[1.5px] border-[#111827] rounded-full px-2.5 py-0.5">
                        {storeItems.length}
                      </span>
                      <span className="text-xs font-heading font-black bg-white text-[#111827] border-[1.5px] border-[#111827] rounded-full px-2.5 py-0.5 shadow-[1.5px_1.5px_0_#111827] tabular-nums">
                        €{storeTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y-2 divide-[#111827]/12 dark:divide-white/15">
                    {storeItems.map((item, idx) => (
                      <GroceryItemRow
                        key={idx}
                        item={item}
                        categoryName={item.category}
                        stores={stores}
                        bought={boughtItems.has(`${item.category}::${item.name}`)}
                        onToggleBought={() => onToggleBought(`${item.category}::${item.name}`)}
                        onSwap={onSwap}
                        onRemove={onRemove}
                        readOnly={readOnly}
                      />
                    ))}
                  </div>
                </div>
              );
            });
        })()
      )}
    </div>
  );
}