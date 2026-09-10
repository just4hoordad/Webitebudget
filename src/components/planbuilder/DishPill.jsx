import MealThumb from "@/components/planbuilder/MealThumb";
import { X } from "lucide-react";

export default function DishPill({ dish, t, onType, onRemove }) {
  const name = dish?.name || "";
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border pl-1 pr-1.5 py-1">
      {name.trim() ? (
        <MealThumb name={name} size="h-8 w-8" />
      ) : (
        <div className="h-8 w-8 rounded-full border border-dashed border-border shrink-0" />
      )}
      <input
        type="text"
        value={name}
        onChange={(e) => onType(e.target.value)}
        placeholder={t("mealNamePlaceholder")}
        className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
      />
      {dish?.side && (
        <span className="shrink-0 text-[10px] font-semibold rounded-full bg-primary/20 text-primary px-2 py-0.5">{t("side")}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="remove"
        className="shrink-0 h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}