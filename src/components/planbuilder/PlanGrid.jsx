import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowRight, Utensils, Sparkles, Loader2, ChefHat, List, CalendarRange,
  LayoutGrid, Sunrise, Sun, Moon,
} from "lucide-react";
import MealGallery from "@/components/planbuilder/MealGallery";
import ListView from "@/components/planbuilder/ListView";
import WeekView from "@/components/planbuilder/WeekView";
import MonthView from "@/components/planbuilder/MonthView";
import { planStartDate, dateForIndex, WD } from "@/lib/planDates";

export default function PlanGrid({ days, plan, setSlot, onAutoFill, autofilling, onGenerate, generating, prepEnabled, setPrepEnabled, onSuggest, suggesting, recentMeals, diet }) {
  const { t, currentLanguage } = useLanguage();
  const [view, setView] = useState("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthAnchor, setMonthAnchor] = useState(planStartDate);
  const [slotType, setSlotType] = useState("breakfast");
  const [scope, setScope] = useState("day");
  const [activeDay, setActiveDay] = useState(0);

  const startDate = useMemo(planStartDate, []);
  const slots = [
    { key: "breakfast", label: t("breakfast"), icon: Sunrise },
    { key: "lunch", label: t("lunch"), icon: Sun },
    { key: "dinner", label: t("dinner"), icon: Moon },
  ];

  const totalSlots = plan.length * 3;
  const filledSlots = plan.reduce((acc, day) => acc + slots.filter((s) => (day[s.key] || "").trim()).length, 0);
  const dayFilled = (d) => slots.filter((s) => (plan[d][s.key] || "").trim()).length;

  const slotLabel = slots.find((s) => s.key === slotType)?.label || "";
  const targetLabel = scope === "all"
    ? `${t("everyDay") || "Every day"} · ${slotLabel}`
    : `${t("day") || "Day"} ${activeDay + 1} · ${slotLabel}`;

  const setActiveSlot = (d, key) => { setActiveDay(d); setSlotType(key); setScope("day"); };
  const selectCell = (d, key) => setActiveSlot(d, key);

  const handleAddMeal = (meal) => {
    const prev = scope === "all" ? plan.map((d) => d[slotType] || "") : [plan[activeDay]?.[slotType] || ""];
    if (scope === "all") {
      plan.forEach((_, d) => setSlot(d, slotType, meal));
    } else {
      setSlot(activeDay, slotType, meal);
      if (activeDay < plan.length - 1) setActiveDay(activeDay + 1);
    }
    toast.success(`${meal} → ${targetLabel}`, {
      action: {
        label: t("undo") || "Undo",
        onClick: () => {
          if (scope === "all") prev.forEach((v, d) => setSlot(d, slotType, v));
          else setSlot(activeDay, slotType, prev[0]);
        },
      },
    });
  };

  const copyToNextDay = (d) => {
    if (d + 1 >= plan.length) return;
    const src = plan[d];
    slots.forEach((s) => setSlot(d + 1, s.key, src[s.key] || ""));
  };
  const clearDay = (d) => slots.forEach((s) => setSlot(d, s.key, ""));

  const VIEWS = [
    { id: "list", label: t("pbViewList"), icon: List },
    { id: "week", label: t("pbViewWeek"), icon: CalendarRange },
    { id: "month", label: t("pbViewMonth"), icon: LayoutGrid },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
          <Utensils className="h-4 w-4" /> {t("planGridTitle", { days: plan.length })}
        </div>
        <p className="text-muted-foreground text-sm">{t("planGridSubtitle")}</p>
      </div>

      {/* View toggle */}
      <div className="inline-flex p-1 rounded-full bg-muted">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-label={v.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${view === v.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Meal picker — meals on top */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {slots.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSlotType(s.key)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${slotType === s.key ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-foreground border-border hover:border-primary/40"}`}
              >
                <Icon className="h-3.5 w-3.5" /> {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setScope("day")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${scope === "day" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
            {t("thisDay") || "This day"}
          </button>
          <button type="button" onClick={() => setScope("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${scope === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}>
            {t("everyDay") || "Every day"}
          </button>
          {scope === "day" && (
            <div className="flex items-center gap-1 ml-auto">
              <button type="button" onClick={() => setActiveDay((d) => Math.max(0, d - 1))} disabled={activeDay === 0} className="h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center">‹</button>
              <span className="text-xs font-medium tabular-nums min-w-[56px] text-center">{t("day") || "Day"} {activeDay + 1}</span>
              <button type="button" onClick={() => setActiveDay((d) => Math.min(plan.length - 1, d + 1))} disabled={activeDay >= plan.length - 1} className="h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center">›</button>
            </div>
          )}
        </div>
      </div>

      <MealGallery diet={diet} onPick={handleAddMeal} targetLabel={targetLabel} activeType={slotType} />

      <button
        onClick={onAutoFill}
        disabled={autofilling}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-sm font-medium transition-all disabled:opacity-60"
      >
        {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t("autoFillMeals")}
      </button>

      {recentMeals && recentMeals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{t("recentlyUsed")}</p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
            {recentMeals.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAddMeal(m)}
                className="shrink-0 max-w-[180px] truncate px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                title={m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day plan list — below the meals */}
      <div className="pt-3 border-t border-border space-y-3">
        {view === "list" && (
          <ListView
            plan={plan} slots={slots} setSlot={setSlot} onSuggest={onSuggest}
            dayFilled={dayFilled} copyToNextDay={copyToNextDay} clearDay={clearDay}
            dateForIndex={(i) => dateForIndex(startDate, i)} WD={WD} t={t} setActiveSlot={setActiveSlot}
          />
        )}
        {view === "week" && (
          <WeekView
            plan={plan} slots={slots} selectCell={selectCell} activeDay={activeDay} slotType={slotType}
            dateForIndex={(i) => dateForIndex(startDate, i)} WD={WD} weekOffset={weekOffset} setWeekOffset={setWeekOffset}
          />
        )}
        {view === "month" && (
          <MonthView
            plan={plan} slots={slots} selectCell={selectCell} activeDay={activeDay}
            monthAnchor={monthAnchor} setMonthAnchor={setMonthAnchor}
            startDate={startDate} days={plan.length} currentLanguage={currentLanguage}
          />
        )}
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
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${totalSlots ? (filledSlots / totalSlots) * 100 : 0}%` }} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">{filledSlots}/{totalSlots}</span>
        </div>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full h-12 text-sm font-heading font-semibold rounded-xl bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/40 transition-all flex items-center justify-center text-primary-foreground disabled:opacity-60"
        >
          {t("generateGroceryFromPlan")} <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}