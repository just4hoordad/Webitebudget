import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import GeneratingLoader from "@/components/GeneratingLoader";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { ArrowLeft, Beef, Droplets, Wheat, Flame, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";

const MACRO_COLORS = {
  protein: "#22c55e",
  fat: "#f59e0b",
  carbs: "#3b82f6",
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#3b82f6"];

export default function Nutrition() {
  const params = new URLSearchParams(window.location.search);
  const budget = params.get("budget") || 150;
  const stores = params.get("stores") || "aldi,lidl";
  const diet = params.get("diet") || "balanced";
  const people = params.get("people") || 1;
  const calories = params.get("calories") || 2000;
  const junkPercent = parseInt(params.get("junkPercent") || "0", 10);

  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  const exportNutritionPDF = async () => {
    if (!contentRef.current) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = margin;
    let remaining = imgH;
    let srcY = 0;
    while (remaining > 0) {
      const sliceH = Math.min(remaining, pageH - margin * 2);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = (sliceH / imgH) * canvas.height;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY * (canvas.height / imgH), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
      doc.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, y, imgW, sliceH);
      remaining -= sliceH;
      srcY += sliceH;
      if (remaining > 0) { doc.addPage(); y = margin; }
    }
    doc.save(`nutrition-${diet}-${budget}eur.pdf`);
  };

  useEffect(() => {
    fetchNutrition();
  }, []);

  const fetchNutrition = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
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
    <div className="max-w-3xl mx-auto space-y-6 pb-10" ref={contentRef}>
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
          <h1 className="font-heading text-2xl font-bold">Nutritional Breakdown</h1>
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
            <h2 className="font-heading font-semibold mb-4">Calorie Split by Macronutrient</h2>
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