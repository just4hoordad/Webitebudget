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
  protein: "#22c55e",
  fat: "#f59e0b",
  carbs: "#3b82f6",
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#3b82f6"];

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
      prompt: `You are a nutritionist. Estimate the total monthly macronutrient breakdown for a person following a ${diet} diet in Germany with these parameters:
- Budget: €${budget}/month
- Calories target: ${calories} kcal/day for ${people} person(s)
- Stores: ${stores}
- Junk food allowance: ${junkPercent}% of daily calories

Provide the DAILY average macronutrient breakdown (protein, fat, carbohydrates) in grams, assuming a realistic grocery list for this diet. 
Also provide a per-meal breakdown (breakfast, lunch, dinner) for an average day, in grams of protein, fat, carbs and calories.
Also estimate the percentage of calories from each macro (protein%, fat%, carbs%).

Use real nutritional data for typical ${diet} diet foods bought from German discount supermarkets.`,
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
    setNutrition(result);
    try { localStorage.setItem("bb_nutrition_cache", JSON.stringify({ key: nKey, data: result })); } catch { /* ignore */ }
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
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link
          to={`/meal-plan?budget=${budget}&stores=${encodeURIComponent(stores)}&diet=${diet}&people=${people}&calories=${calories}&junkPercent=${junkPercent}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to meal plan
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("nutritionBreakdown")}</h1>
          <p className="text-sm text-muted-foreground">
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
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5" /> Calories
              </div>
              <p className="font-heading text-xl font-bold text-foreground">
                {Math.round(nutrition?.daily_totals?.calories || 0)}
              </p>
              <p className="text-xs text-muted-foreground">kcal / day</p>
            </div>
            <div className="bg-card border border-green-200 rounded-xl px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <Beef className="h-3.5 w-3.5" /> Protein
              </div>
              <p className="font-heading text-xl font-bold text-green-600">
                {Math.round(nutrition?.daily_totals?.protein_g || 0)}g
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
            <div className="bg-card border border-amber-200 rounded-xl px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <Droplets className="h-3.5 w-3.5" /> Fat
              </div>
              <p className="font-heading text-xl font-bold text-amber-600">
                {Math.round(nutrition?.daily_totals?.fat_g || 0)}g
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
            <div className="bg-card border border-blue-200 rounded-xl px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-600">
                <Wheat className="h-3.5 w-3.5" /> Carbs
              </div>
              <p className="font-heading text-xl font-bold text-blue-600">
                {Math.round(nutrition?.daily_totals?.carbs_g || 0)}g
              </p>
              <p className="text-xs text-muted-foreground">per day</p>
            </div>
          </div>

          {/* Macro Split Pie Chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-heading font-semibold mb-4">{t("calorieSplitTitle")}</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={pieMacroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
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
                  { label: "Protein", pct: nutrition?.macro_calorie_pct?.protein_pct, color: "bg-green-500", text: "text-green-600" },
                  { label: "Fat", pct: nutrition?.macro_calorie_pct?.fat_pct, color: "bg-amber-500", text: "text-amber-600" },
                  { label: "Carbs", pct: nutrition?.macro_calorie_pct?.carbs_pct, color: "bg-blue-500", text: "text-blue-600" },
                ].map(({ label, pct, color, text }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-medium ${text}`}>{label}</span>
                      <span className="text-muted-foreground">{(pct || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per Meal Bar Chart */}
          {barData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-heading font-semibold mb-4">Macros per Meal (grams)</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="meal" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="g" />
                  <Tooltip formatter={(v) => `${v}g`} />
                  <Legend />
                  <Bar dataKey="Protein" fill={MACRO_COLORS.protein} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Fat" fill={MACRO_COLORS.fat} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Carbs" fill={MACRO_COLORS.carbs} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly totals */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-heading font-semibold mb-3">Monthly Totals (4 weeks)</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Protein", value: nutrition?.monthly_totals?.protein_g, unit: "g", color: "text-green-600", border: "border-green-200" },
                { label: "Fat", value: nutrition?.monthly_totals?.fat_g, unit: "g", color: "text-amber-600", border: "border-amber-200" },
                { label: "Carbs", value: nutrition?.monthly_totals?.carbs_g, unit: "g", color: "text-blue-600", border: "border-blue-200" },
              ].map(({ label, value, unit, color, border }) => (
                <div key={label} className={`bg-card border ${border} rounded-xl px-3 py-4`}>
                  <p className={`font-heading text-2xl font-bold ${color}`}>
                    {value ? (value / 1000).toFixed(1) + "kg" : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{label} / month</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {nutrition?.notes && (
            <div className="bg-muted/50 border border-border rounded-xl px-5 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">💡 {nutrition.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}