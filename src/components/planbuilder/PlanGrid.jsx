import { useLanguage } from "@/lib/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { DISH_BY_NAME } from "@/data/dishCatalog";
import { ArrowRight, Utensils, RefreshCw, ChefHat, Copy, Eraser, Plus } from "lucide-react";

export default function PlanGrid({ days, plan, onPickSlot, onSetSlot, onAutoFill, onGenerate, generating, prepEnabled, setPrepEnabled }) {
  const { t } = useLanguage();
  const slots = [
    { key: "breakfast", label: t("breakfast") },
    { key: "lunch", label: t("lunch") },
    { key: "dinner", label: t("dinner") },
  ];

  const totalSlots = plan.length * 3;
  const filledSlots = plan.reduce(
    (acc, day) => acc + slots.filter((s) => (day[s.key] || "").trim()).length,
    0
  );

  const copyToNextDay = (d) => {
    if (d + 1 >= plan.length) return;
    const src = plan[d];
    slots.forEach((s) => onSetSlot(d + 1, s.key, src[s.key] || ""));
  };
  const clearDay = (d) => slots.forEach((s) => onSetSlot(d, s.key, ""));

  const renderDayActions = (d) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => copyToNextDay(d)}
        disabled={d + 1 >= plan.length}
        title={t("copyToNextDay")}
        aria-label={t("copyToNextDay")}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-editorial hover:bg-editorial/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => clearDay(d)}
        title={t("clearDay")}
        aria-label={t("clearDay")}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Eraser className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const renderTile = (d, s) => {
    const name = (plan[d][s.key] || "").trim();
    const dish = name ? DISH_BY_NAME[name] : null;
    return (
      <button
        key={s.key}
        type="button"
        onClick={() => onPickSlot(d, s.key)}
        className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-card transition-all hover:ring-2 hover:ring-editorial/50"
      >
        {dish ? (
          <>
            <img src={dish.image} alt={name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[11px] font-medium text-white leading-tight line-clamp-2 drop-shadow-sm">
              {name}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <span className="h-7 w-7 rounded-full border border-dashed border-border flex items-center justify-center">
              <Plus className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-medium">{s.label}</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-editorial text-sm font-medium mb-1">
          <Utensils className="h-4 w-4" /> {t("planGridTitle", { days })}
        </div>
        <p className="text-muted-foreground text-sm">{t("planGridSubtitle")}</p>
      </div>

      <button
        onClick={onAutoFill}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-editorial/30 text-editorial bg-editorial/5 hover:bg-editorial/10 text-sm font-medium transition-all"
      >
        <RefreshCw className="h-4 w-4" /> {t("autoFillMeals")}
      </button>

      <div className="space-y-2">
        {plan.map((day, d) => (
          <div key={d} className="bg-card border border-border rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold text-sm text-editorial-ink">
                {t("day") || "Day"} {d + 1}
              </span>
              {renderDayActions(d)}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => renderTile(d, s))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t("includePrepGuide") || "Include meal prep guide"}</span>
        </div>
        <Switch checked={prepEnabled} onCheckedChange={setPrepEnabled} aria-label="Toggle prep guide" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-editorial transition-all duration-300"
              style={{ width: `${totalSlots ? (filledSlots / totalSlots) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {filledSlots}/{totalSlots}
          </span>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full h-12 text-sm font-display font-semibold rounded-xl bg-editorial text-white hover:bg-editorial/90 hover:shadow-lg hover:shadow-editorial/40 transition-all flex items-center justify-center disabled:opacity-60"
        >
          {t("generateGroceryFromPlan")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}