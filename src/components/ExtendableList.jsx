import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Progressive-disclosure wrapper for long day-by-day lists: renders the first
// `limit` items, then reveals the rest on demand so a 24-30 day plan doesn't
// dump every card into the DOM at once. renderItem receives (item, index).
export default function ExtendableList({
  items,
  limit = 7,
  renderItem,
  showAllLabel,
  showLessLabel,
}) {
  const [expanded, setExpanded] = useState(false);
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) return null;

  const hasMore = arr.length > limit;
  const visible = expanded ? arr : arr.slice(0, limit);

  return (
    <>
      {visible.map((item, i) => renderItem(item, i))}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 mt-1 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/30 rounded-xl transition-colors"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          {expanded
            ? (showLessLabel || "Show less")
            : (showAllLabel || `Show all ${arr.length}`)}
        </button>
      )}
    </>
  );
}