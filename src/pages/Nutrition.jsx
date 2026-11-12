import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { invokeAI } from "@/lib/aiClient";
import GeneratingLoader from "@/components/GeneratingLoader";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { ArrowLeft, Beef, Droplets, Wheat, Flame, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

const MACRO_COLORS = {
  protein: "#78a71b",
  fat: "#FFB020",
  carbs: "#7DD3FC",
};

const PIE_COLORS = ["#78a71b", "#FFB020", "#7DD3FC"];

export default function Nutrition() {
  const { t } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") || 150;
  const stores = params.get("stores") || "aldi,lidl";
  const diet = params.get("diet") || "balanced";
  const people = params.get("people") || 1;
  const calories = params.get("calories") || 2000;
  const junkPercent = parseInt(params.get("junkPercent") || "0", 10);

  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const exportNutritionPDF = () => {
    if (!nutrition) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    let y = margin;

    const GREEN  = [15, 76, 53];
    const GRAY   = [107, 114, 128];
    const DARK   = [17, 24, 39];
    const C_GREEN  = [34, 197, 94];
    const C_AMBER  = [245, 158, 11];
    const C_BLUE   = [59, 130, 246];

    const checkPage = (needed) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    // ── Header ──
    doc.setFillColor(...GREEN);
    doc.rect(0, 0, pageW, 80, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('BUDGETBITE', margin, 24);
    doc.text(new Date().toLocaleDateString('en-DE', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 24, { align: 'right' });
    doc.setFontSize(20); doc.text('Nutritional Breakdown', margin, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`${diet} diet · €${budget}/month · ${calories} kcal/day · ${people} person(s)`, margin, 62);
    y = 96;

    // ── Daily Macro Cards ──
    const dt = nutrition.daily_totals || {};
    const cards = [
      { label: 'Calories', value: `${Math.round(dt.calories || 0)} kcal/day`, color: DARK },
      { label: 'Protein',  value: `${Math.round(dt.protein_g || 0)}g / day`,  color: C_GREEN },
      { label: 'Fat',      value: `${Math.round(dt.fat_g || 0)}g / day`,      color: C_AMBER },
      { label: 'Carbs',    value: `${Math.round(dt.carbs_g || 0)}g / day`,    color: C_BLUE  },
    ];
    const cw = (pageW - margin * 2) / 4;
    cards.forEach(({ label, value, color }, i) => {
      const cx = margin + i * cw;
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(cx, y, cw - 6, 44, 4, 4, 'S');
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
      doc.text(label, cx + 8, y + 14);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...color);
      doc.text(value, cx + 8, y + 32);
    });
    y += 56;

    // ── Macro % Split (text table) ──
    checkPage(60);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Calorie Split by Macronutrient', margin, y);
    y += 16;

    const pct = nutrition.macro_calorie_pct || {};
    const macros = [
      { label: 'Protein', pct: pct.protein_pct || 0, color: C_GREEN },
      { label: 'Fat',     pct: pct.fat_pct || 0,     color: C_AMBER },
      { label: 'Carbs',  pct: pct.carbs_pct || 0,    color: C_BLUE  },
    ];
    const barW = pageW - margin * 2;
    macros.forEach(({ label, pct: p, color }) => {
      checkPage(26);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...color);
      doc.text(label, margin, y + 9);
      doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal');
      doc.text(`${p.toFixed(1)}%`, pageW - margin, y + 9, { align: 'right' });
      // track bg
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(margin, y + 12, barW, 6, 3, 3, 'F');
      // fill
      doc.setFillColor(...color);
      doc.roundedRect(margin, y + 12, barW * (p / 100), 6, 3, 3, 'F');
      y += 26;
    });
    y += 10;

    // ── Per Meal Table ──
    if (nutrition.per_meal?.length > 0) {
      checkPage(60);
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
      doc.text('Macros per Meal', margin, y);
      y += 14;

      // Header row
      const cols = ['Meal', 'Calories', 'Protein', 'Fat', 'Carbs'];
      const colW = [120, 90, 90, 90, 90];
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y, barW, 18, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      let cx = margin;
      cols.forEach((c, i) => { doc.text(c, cx + 4, y + 12); cx += colW[i]; });
      y += 20;

      nutrition.per_meal.forEach((m, i) => {
        checkPage(18);
        if (i % 2 === 0) { doc.setFillColor(248, 250, 248); doc.rect(margin, y, barW, 16, 'F'); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK);
        const row = [m.meal, `${Math.round(m.calories)} kcal`, `${Math.round(m.protein_g)}g`, `${Math.round(m.fat_g)}g`, `${Math.round(m.carbs_g)}g`];
        cx = margin;
        row.forEach((val, j) => { doc.text(val, cx + 4, y + 11); cx += colW[j]; });
        y += 18;
      });
      y += 10;
    }

    // ── Monthly Totals ──
    checkPage(60);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
    doc.text('Monthly Totals (4 weeks)', margin, y);
    y += 14;

    const mt = nutrition.monthly_totals || {};
    const monthly = [
      { label: 'Protein / month', value: mt.protein_g ? `${(mt.protein_g / 1000).toFixed(1)} kg` : '—', color: C_GREEN },
      { label: 'Fat / month',     value: mt.fat_g     ? `${(mt.fat_g / 1000).toFixed(1)} kg`     : '—', color: C_AMBER },
      { label: 'Carbs / month',   value: mt.carbs_g   ? `${(mt.carbs_g / 1000).toFixed(1)} kg`   : '—', color: C_BLUE  },
    ];
    const mw = (barW) / 3;
    monthly.forEach(({ label, value, color }, i) => {
      const mx = margin + i * mw;
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(mx, y, mw - 6, 44, 4, 4, 'S');
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...color);
      doc.text(value, mx + 8, y + 26);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
      doc.text(label, mx + 8, y + 38);
    });
    y += 56;

    // ── Notes ──
    if (nutrition.notes) {
      checkPage(40);
      doc.setFillColor(248, 250, 248);
      doc.roundedRect(margin, y, barW, 1, 2, 2, 'F'); // will be sized below
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
      const noteLines = doc.splitTextToSize(`💡 ${nutrition.notes}`, barW - 16);
      const noteH = noteLines.length * 12 + 16;
      doc.setFillColor(248, 250, 248);
      doc.roundedRect(margin, y, barW, noteH, 4, 4, 'F');
      doc.text(noteLines, margin + 8, y + 12);
      y += noteH + 10;
    }

    // ── Footer ──
    checkPage(20);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
    doc.text('BudgetBite — Smart meal planning for students in Germany', margin, y);
    doc.text('Estimates based on typical German discount supermarket products', pageW - margin, y, { align: 'right' });

    doc.save(`nutrition-${diet}-${budget}eur.pdf`);
  };

  useEffect(() => {
    fetchNutrition();
  }, []);

  const fetchNutrition = async () => {
    const nKey = JSON.stringify({ diet, budget, stores, people, calories, junkPercent });
    try {
      const raw = localStorage.getItem("bb_nutrition_cache");
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.key === nKey) {
          setNutrition(cached.data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }
    setLoading(true);
    const result = await invokeAI({
      prompt: `Estimate macronutrient breakdown for a ${diet} diet in Germany: €${budget}/month, ${calories} kcal/day, ${people} person(s), stores: ${stores}, junk food: ${junkPercent}% of calories.
Return daily_totals (calories, protein_g, fat_g, carbs_g), macro_calorie_pct (protein_pct, fat_pct, carbs_pct), per_meal[{meal, calories, protein_g, fat_g, carbs_g}], and monthly_totals (protein_g, fat_g, carbs_g). Use real nutritional data for German discount supermarket foods.`,
      response_json_schema: {
        type: "object",
        properties: {
          daily_totals: {
            type: "object",
            properties: {
              calories: { type: "number" },
              protein_g: { type: "number" },
              fat_g: { type: "number" },
              carbs_g: { type: "number" },
            },
          },
          macro_calorie_pct: {
            type: "object",
            properties: {
              protein_pct: { type: "number" },
              fat_pct: { type: "number" },
              carbs_pct: { type: "number" },
            },
          },
          per_meal: {
            type: "array",
            items: {
              type: "object",
              properties: {
                meal: { type: "string" },
                calories: { type: "number" },
                protein_g: { type: "number" },
                fat_g: { type: "number" },
                carbs_g: { type: "number" },
              },
            },
          },
          monthly_totals: {
            type: "object",
            properties: {
              protein_g: { type: "number" },
              fat_g: { type: "number" },
              carbs_g: { type: "number" },
            },
          },
          notes: { type: "string" },
        },
      },
    });
    const targetCal = Number(calories) || 2000;
    const rawDailyCal = Number(result?.daily_totals?.calories) || 0;
    const calScale = rawDailyCal > 0 ? targetCal / rawDailyCal : 1;
    const pDay = Math.round((Number(result?.daily_totals?.protein_g) || 0) * calScale);
    const fDay = Math.round((Number(result?.daily_totals?.fat_g) || 0) * calScale);
    const cDay = Math.round((Number(result?.daily_totals?.carbs_g) || 0) * calScale);
    const macroSum = pDay * 4 + fDay * 9 + cDay * 4 || 1;
    const rawMeals = Array.isArray(result?.per_meal) ? result.per_meal : [];
    const mealSum = rawMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
    const mealScale = mealSum > 0 ? targetCal / mealSum : calScale;
    const normalized = {
      ...result,
      daily_totals: {
        calories: targetCal,
        protein_g: pDay,
        fat_g: fDay,
        carbs_g: cDay,
      },
      macro_calorie_pct: {
        protein_pct: Math.round((pDay * 4 / macroSum) * 1000) / 10,
        fat_pct: Math.round((fDay * 9 / macroSum) * 1000) / 10,
        carbs_pct: Math.round((cDay * 4 / macroSum) * 1000) / 10,
      },
      per_meal: rawMeals.map((m) => ({
        ...m,
        calories: Math.round((Number(m.calories) || 0) * mealScale),
        protein_g: Math.round((Number(m.protein_g) || 0) * mealScale),
        fat_g: Math.round((Number(m.fat_g) || 0) * mealScale),
        carbs_g: Math.round((Number(m.carbs_g) || 0) * mealScale),
      })),
      monthly_totals: {
        protein_g: pDay * 28,
        fat_g: fDay * 28,
        carbs_g: cDay * 28,
      },
    };
    setNutrition(normalized);
    try { localStorage.setItem("bb_nutrition_cache", JSON.stringify({ key: nKey, data: normalized })); } catch { /* ignore */ }
    setLoading(false);
  };

  const pieMacroData = nutrition
    ? [
        { name: "Protein", value: nutrition.macro_calorie_pct?.protein_pct || 0 },
        { name: "Fat", value: nutrition.macro_calorie_pct?.fat_pct || 0 },
        { name: "Carbs", value: nutrition.macro_calorie_pct?.carbs_pct || 0 },
      ]
    : [];

  const barData = nutrition?.per_meal?.map((m) => ({
    meal: m.meal,
    Protein: m.protein_g,
    Fat: m.fat_g,
    Carbs: m.carbs_g,
  })) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Back link */}
      <div>
        <Link
          to={`/meal-plan?budget=${budget}&stores=${encodeURIComponent(stores)}&diet=${diet}&people=${people}&calories=${calories}&junkPercent=${junkPercent}`}
          className="inline-flex items-center gap-1.5 text-xs font-heading font-extrabold text-[#111827] bg-white border-2 border-[#111827] shadow-[2px_2px_0_#111827] rounded-full px-3.5 py-1.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-transform"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to meal plan
        </Link>
      </div>

      <div className="bba-t bg-[#78a71b] text-[#111827] flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1.5">
          <span className="bba-sticker">Nutrition Stats</span>
          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-[#111827]">{t("nutritionBreakdown")}</h1>
          <p className="text-xs sm:text-sm font-semibold text-[#111827]/85">
            {diet} diet · €{budget}/month · {calories} kcal/day · {people} person(s)
          </p>
        </div>
        {!loading && (
          <Button onClick={exportNutritionPDF} variant="outline" size="sm" className="gap-2 shrink-0">
            <FileDown className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>

      {loading ? (
        <GeneratingLoader type="plan" />
      ) : (
        <>
          {/* Daily Macro Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bba-t bg-[#F3F8E6] text-[#111827] px-4 py-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/75">
                <Flame className="h-3.5 w-3.5" /> Calories
              </div>
              <p className="font-heading text-2xl font-black text-[#111827]">
                {Math.round(nutrition?.daily_totals?.calories || 0)}
              </p>
              <p className="text-xs font-semibold text-[#111827]/75">kcal / day</p>
            </div>
            <div className="bba-t bg-[#78a71b] text-[#111827] px-4 py-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/80">
                <Beef className="h-3.5 w-3.5" /> Protein
              </div>
              <p className="font-heading text-2xl font-black text-[#111827]">
                {Math.round(nutrition?.daily_totals?.protein_g || 0)}g
              </p>
              <p className="text-xs font-semibold text-[#111827]/80">per day</p>
            </div>
            <div className="bba-t bg-[#FFB020] text-[#111827] px-4 py-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/80">
                <Droplets className="h-3.5 w-3.5" /> Fat
              </div>
              <p className="font-heading text-2xl font-black text-[#111827]">
                {Math.round(nutrition?.daily_totals?.fat_g || 0)}g
              </p>
              <p className="text-xs font-semibold text-[#111827]/80">per day</p>
            </div>
            <div className="bba-t bg-[#7DD3FC] text-[#111827] px-4 py-3.5 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] font-heading font-black uppercase tracking-wider text-[#111827]/80">
                <Wheat className="h-3.5 w-3.5" /> Carbs
              </div>
              <p className="font-heading text-2xl font-black text-[#111827]">
                {Math.round(nutrition?.daily_totals?.carbs_g || 0)}g
              </p>
              <p className="text-xs font-semibold text-[#111827]/80">per day</p>
            </div>
          </div>

          {/* Macro Split Pie Chart */}
          <div className="bba-t bg-card p-5">
            <h2 className="font-heading font-black text-base mb-4">{t("calorieSplitTitle")}</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={pieMacroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#111827"
                    strokeWidth={2}
                  >
                    {pieMacroData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 w-full">
                {[
                  { label: "Protein", pct: nutrition?.macro_calorie_pct?.protein_pct, color: "bg-[#78a71b]" },
                  { label: "Fat", pct: nutrition?.macro_calorie_pct?.fat_pct, color: "bg-[#FFB020]" },
                  { label: "Carbs", pct: nutrition?.macro_calorie_pct?.carbs_pct, color: "bg-[#7DD3FC]" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-heading font-extrabold text-foreground">{label}</span>
                      <span className="font-heading font-black text-foreground">{(pct || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted border-2 border-[#111827] dark:border-[#78a71b] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per Meal Bar Chart */}
          {barData.length > 0 && (
            <div className="bba-t bg-card p-5">
              <h2 className="font-heading font-black text-base mb-4">Macros per Meal (grams)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.12)" />
                  <XAxis dataKey="meal" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="g" />
                  <Tooltip formatter={(v) => `${v}g`} />
                  <Legend />
                  <Bar dataKey="Protein" fill={MACRO_COLORS.protein} stroke="#111827" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Fat" fill={MACRO_COLORS.fat} stroke="#111827" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Carbs" fill={MACRO_COLORS.carbs} stroke="#111827" strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly totals */}
          <div className="bba-t bg-card p-5">
            <h2 className="font-heading font-black text-base mb-3">Monthly Totals (4 weeks)</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Protein", value: nutrition?.monthly_totals?.protein_g, bg: "bg-[#78a71b]" },
                { label: "Fat", value: nutrition?.monthly_totals?.fat_g, bg: "bg-[#FFB020]" },
                { label: "Carbs", value: nutrition?.monthly_totals?.carbs_g, bg: "bg-[#7DD3FC]" },
              ].map(({ label, value, bg }) => (
                <div key={label} className={`${bg} text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] rounded-2xl px-2.5 py-4`}>
                  <p className="font-heading text-xl sm:text-2xl font-black text-[#111827]">
                    {value ? (value / 1000).toFixed(1) + "kg" : "—"}
                  </p>
                  <p className="text-[11px] font-heading font-extrabold uppercase text-[#111827]/75 mt-1">{label} / mo</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {nutrition?.notes && (
            <div className="bba-t bg-[#F3F8E6] text-[#111827] px-5 py-4">
              <p className="text-sm font-medium text-[#111827] leading-relaxed">💡 {nutrition.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}