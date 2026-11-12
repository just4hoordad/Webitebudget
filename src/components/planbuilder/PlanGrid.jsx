import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowRight, Utensils, Sparkles, Loader2, ChefHat, List, CalendarRange,
  LayoutGrid, Sunrise, Sun, Moon, Dices, Trophy,
} from "lucide-react";
import MealGallery from "@/components/planbuilder/MealGallery";
import ListView from "@/components/planbuilder/ListView";
import WeekView from "@/components/planbuilder/WeekView";
import MonthView from "@/components/planbuilder/MonthView";
import StickyGenerateBar from "@/components/StickyGenerateBar";
import { planStartDate, dateForIndex, WD } from "@/lib/planDates";
import { dishList, mealFilled } from "@/lib/planDishes";

export default function PlanGrid({ days, plan, setSlot, addDish, updateDish, removeDish, addSideDish, onAutoFill, autofilling, onGenerate, generating, prepEnabled, setPrepEnabled, onSuggest, suggesting, recentMeals, diet }) {
  const { t, currentLanguage } = useLanguage();
  const [view, setView] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthAnchor, setMonthAnchor] = useState(planStartDate);
  const [slotType, setSlotType] = useState("breakfast");
  const [scope, setScope] = useState("day");
  const [activeDay, setActiveDay] = useState(0);

  const formRef = useRef(null);
  const generateRef = useRef(null);
  const [formInView, setFormInView] = useState(true);
  const [genInView, setGenInView] = useState(true);

  useEffect(() => {
    const f = formRef.current;
    const g = generateRef.current;
    if (!f || !g) return;
    const fObs = new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting), { threshold: 0.05 });
    const gObs = new IntersectionObserver(([entry]) => setGenInView(entry.isIntersecting), { threshold: 0.05 });
    fObs.observe(f);
    gObs.observe(g);
    return () => { fObs.disconnect(); gObs.disconnect(); };
  }, []);

  const showStickyGenerate = formInView && !genInView;

  const startDate = useMemo(planStartDate, []);
  const slots = [
    { key: "breakfast", label: t("breakfast"), icon: Sunrise, activeBg: "bg-[#FFB020]" },
    { key: "lunch", label: t("lunch"), icon: Sun, activeBg: "bg-[#7DD3FC]" },
    { key: "dinner", label: t("dinner"), icon: Moon, activeBg: "bg-[#C084FC]" },
  ];

  const totalSlots = plan.length * 3;
  const filledSlots = plan.reduce((acc, day) => acc + slots.filter((s) => mealFilled(day, s.key)).length, 0);
  const comboPct = totalSlots ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const isFullCombo = totalSlots > 0 && filledSlots >= totalSlots;
  const dayFilled = (d) => slots.filter((s) => mealFilled(plan[d], s.key)).length;

  const slotLabel = slots.find((s) => s.key === slotType)?.label || "";
  const targetLabel = scope === "all"
    ? `${t("everyDay") || "Every day"} · ${slotLabel}`
    : `${t("day") || "Day"} ${activeDay + 1} · ${slotLabel}`;

  const setActiveSlot = (d, key) => { setActiveDay(d); setSlotType(key); setScope("day"); };
  const selectCell = (d, key) => setActiveSlot(d, key);

  const handleAddMeal = (meal) => {
    const preCounts = scope === "all" ? plan.map((d) => dishList(d, slotType).length) : [dishList(plan[activeDay], slotType).length];
    if (scope === "all") {
      plan.forEach((_, d) => addDish(d, slotType, meal));
    } else {
      addDish(activeDay, slotType, meal);
      if (activeDay < plan.length - 1) setActiveDay(activeDay + 1);
    }
    toast.success(`${meal} → ${targetLabel}`, {
      action: {
        label: t("undo") || "Undo",
        onClick: () => {
          if (scope === "all") plan.forEach((_, d) => removeDish(d, slotType, preCounts[d]));
          else removeDish(activeDay, slotType, preCounts[0]);
        },
      },
    });
  };

  const copyToNextDay = (d) => {
    if (d + 1 >= plan.length) return;
    const src = plan[d];
    slots.forEach((s) => setSlot(d + 1, s.key, Array.isArray(src[s.key]) ? src[s.key].map((x) => ({ ...x })) : src[s.key] || ""));
  };
  const clearDay = (d) => slots.forEach((s) => setSlot(d, s.key, []));

  const VIEWS = [
    { id: "list", label: t("pbViewList"), icon: List },
    { id: "week", label: t("pbViewWeek"), icon: CalendarRange },
    { id: "month", label: t("pbViewMonth"), icon: LayoutGrid },
  ];

  return (
    <div ref={formRef} className="space-y-4">
      {/* Bento Meal Deck Header + Combo Meter */}
      <div className="bba-t bg-[#FFB020] text-[#111827] space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="bba-sticker">
              <Utensils className="h-3.5 w-3.5" /> {t("planGridTitle", { days: plan.length })}
            </span>
            <p className="text-[#111827] font-bold text-sm">{t("planGridSubtitle")}</p>
          </div>
          {isFullCombo ? (
            <motion.span
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-[#FF3E7F] text-white border-2 border-[#111827] px-3 py-1 text-xs font-heading font-black shadow-[2px_2px_0_#111827]"
            >
              <Trophy className="h-3.5 w-3.5" /> FULL COMBO!
            </motion.span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white text-[#111827] border-2 border-[#111827] px-3 py-1 text-xs font-heading font-black shadow-[2px_2px_0_#111827] tabular-nums">
              🎯 {filledSlots}/{totalSlots} Slotted
            </span>
          )}
        </div>

        {/* Live Combo Progress Bar */}
        <div className="h-3.5 w-full rounded-full bg-white border-2 border-[#111827] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 bba-progress-stripes ${
              isFullCombo ? "bg-[#FF3E7F]" : "bg-[#78a71b]"
            }`}
            style={{ width: `${Math.max(comboPct, 4)}%` }}
          />
        </div>

        <p className="text-[#111827]/85 text-xs font-semibold flex items-start gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#111827] shrink-0 mt-0.5" />
          <span>{t("planGridAIBlurb")}</span>
        </p>
      </div>

      {/* Meal Card Deck Picker */}
      <div className="bba-t bg-card space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {slots.map((s) => {
              const Icon = s.icon;
              const isSelected = slotType === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSlotType(s.key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-heading font-black border-[2.5px] border-[#111827] dark:border-[#78a71b] transition-all ${
                    isSelected
                      ? `${s.activeBg} text-[#111827] shadow-[3px_3px_0_#111827] -translate-y-0.5`
                      : "bg-secondary/70 text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setScope("day")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold border-2 border-[#111827] transition-all ${
                scope === "day"
                  ? "bg-[#78a71b] text-[#111827] shadow-[2px_2px_0_#111827]"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {t("thisDay") || "This day"}
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-extrabold border-2 border-[#111827] transition-all ${
                scope === "all"
                  ? "bg-[#78a71b] text-[#111827] shadow-[2px_2px_0_#111827]"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {t("everyDay") || "Every day"}
            </button>
            {scope === "day" && (
              <div className="flex items-center gap-1.5 ml-auto bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] rounded-full px-1.5 py-0.5 shadow-[2px_2px_0_#111827]">
                <button
                  type="button"
                  onClick={() => setActiveDay((d) => Math.max(0, d - 1))}
                  disabled={activeDay === 0}
                  className="h-6 w-6 rounded-full bg-white text-[#111827] border border-[#111827] font-black disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                >‹</button>
                <span className="text-xs font-heading font-black tabular-nums min-w-[58px] text-center text-[#111827] dark:text-foreground">
                  {t("day") || "Day"} {activeDay + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDay((d) => Math.min(plan.length - 1, d + 1))}
                  disabled={activeDay >= plan.length - 1}
                  className="h-6 w-6 rounded-full bg-white text-[#111827] border border-[#111827] font-black disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                >›</button>
              </div>
            )}
          </div>
        </div>

        <MealGallery diet={diet} onPick={handleAddMeal} targetLabel={targetLabel} activeType={slotType} />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAutoFill}
          disabled={autofilling}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#7DD3FC] text-[#111827] border-[2.5px] border-[#111827] shadow-[3px_3px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] font-heading font-black text-sm transition-all disabled:opacity-60"
        >
          {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
          {t("autoFillMeals")}
        </motion.button>

        {recentMeals && recentMeals.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-heading font-black uppercase tracking-wider text-muted-foreground">⚡ {t("recentlyUsed")}</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
              {recentMeals.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddMeal(m)}
                  className="shrink-0 max-w-[190px] truncate px-3 py-1.5 rounded-full border-2 border-[#111827] bg-[#F3F8E6] text-xs font-heading font-extrabold text-[#111827] shadow-[2px_2px_0_#111827] hover:bg-[#FFB020] transition-colors"
                  title={m}
                >
                  + {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Day plan board — below the meals */}
      <div className="bba-t bg-card space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">
            📅 Your Meal Board
          </span>
          {/* View toggle */}
          <div className="inline-flex p-1 rounded-full bg-[#F3F8E6] dark:bg-secondary border-2 border-[#111827] dark:border-[#78a71b] shadow-[2px_2px_0_#111827]">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setView(v.id)}
                  aria-label={v.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-black transition-all ${
                    view === v.id
                      ? "bg-[#78a71b] text-[#111827] border border-[#111827]"
                      : "text-[#111827]/70 dark:text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {view === "list" && (
          <ListView
            plan={plan} slots={slots} addDish={addDish} updateDish={updateDish} removeDish={removeDish} addSideDish={addSideDish}
            dayFilled={dayFilled} copyToNextDay={copyToNextDay} clearDay={clearDay}
            dateForIndex={(i) => dateForIndex(startDate, i)} WD={WD} t={t}
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

      {/* Prep Guide Power-Up Toggle */}
      <div className="bba-t bg-[#F3F8E6] dark:bg-card flex items-center justify-between gap-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-[#C084FC] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center text-[#111827] shrink-0">
            <ChefHat className="h-4 w-4" />
          </span>
          <span className="text-sm font-heading font-extrabold text-[#111827] dark:text-foreground">
            {t("includePrepGuide") || "Include meal prep guide"}
          </span>
        </div>
        <Switch checked={prepEnabled} onCheckedChange={setPrepEnabled} aria-label="Toggle prep guide" />
      </div>

      <div ref={generateRef} className="space-y-2.5">
        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full h-14 text-base bba-cta bg-[#FF3E7F] text-white flex items-center justify-center disabled:opacity-60"
        >
          {t("generateGroceryFromPlan")} <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>

      <StickyGenerateBar
        visible={showStickyGenerate}
        onClick={onGenerate}
        disabled={generating}
        label={t("generateGroceryFromPlan")}
      />
    </div>
  );
}