import { forwardRef } from "react";

const MEAL_ICONS = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙" };

const MealPlanExport = forwardRef(({ weeklyPlan, diet, budget, calories, people }, ref) => {
  const days = weeklyPlan?.weeks?.[0]?.days || [];

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "794px",
        background: "#ffffff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f4c35 0%, #1a9e6e 100%)",
        padding: "36px 48px 28px",
        color: "#ffffff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75, marginBottom: "8px" }}>
              🌿 BudgetBite
            </div>
            <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              7-Day Meal Plan
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "14px", opacity: 0.8 }}>
              Repeats for 4 weeks · {diet} diet · {people} person(s)
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "13px", opacity: 0.75 }}>
            {new Date().toLocaleDateString("en-DE", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          {[
            { label: "Monthly Budget", value: `€${parseFloat(budget).toFixed(0)}` },
            { label: "Daily Calories", value: `${calories} kcal` },
            { label: "People", value: people },
            { label: "Meals / Week", value: "21" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1,
              background: "rgba(255,255,255,0.15)",
              borderRadius: "10px",
              padding: "10px 14px",
              backdropFilter: "blur(4px)",
            }}>
              <div style={{ fontSize: "10px", opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Days */}
      <div style={{ padding: "28px 48px 36px" }}>
        {days.map((day, idx) => (
          <div key={idx} style={{
            marginBottom: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            {/* Day header */}
            <div style={{
              background: idx % 2 === 0 ? "#f0fdf4" : "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <div style={{
                background: "#0f4c35",
                color: "#ffffff",
                borderRadius: "50%",
                width: "26px",
                height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                {idx + 1}
              </div>
              <span style={{ fontWeight: "700", fontSize: "15px", color: "#0f4c35" }}>{day.day}</span>
            </div>

            {/* Meals grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0" }}>
              {[
                { label: "Breakfast", name: day.breakfast, cal: day.breakfast_calories, ings: day.breakfast_ingredients },
                { label: "Lunch", name: day.lunch, cal: day.lunch_calories, ings: day.lunch_ingredients },
                { label: "Dinner", name: day.dinner, cal: day.dinner_calories, ings: day.dinner_ingredients },
              ].map(({ label, name, cal, ings }, mIdx) => (
                <div key={label} style={{
                  padding: "14px 16px",
                  borderRight: mIdx < 2 ? "1px solid #f3f4f6" : "none",
                  background: "#ffffff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px" }}>{MEAL_ICONS[label]}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>{label}</span>
                    {cal && (
                      <span style={{
                        marginLeft: "auto",
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#ffffff",
                        background: "#1a9e6e",
                        borderRadius: "20px",
                        padding: "2px 8px",
                      }}>
                        {cal} kcal
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: "600", color: "#111827", lineHeight: "1.4" }}>{name}</p>
                  {Array.isArray(ings) && ings.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "6px" }}>
                      {ings.map((ing, i) => (
                        <span key={i} style={{
                          fontSize: "9px",
                          background: "#f3f4f6",
                          color: "#374151",
                          borderRadius: "4px",
                          padding: "2px 6px",
                        }}>
                          {ing.name} · {ing.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "2px solid #e5e7eb",
        margin: "0 48px",
        paddingBottom: "32px",
        paddingTop: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          🌿 BudgetBite — Smart meal planning for students in Germany
        </span>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          This plan repeats for 4 consecutive weeks
        </span>
      </div>
    </div>
  );
});

MealPlanExport.displayName = "MealPlanExport";
export default MealPlanExport;