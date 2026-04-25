import { forwardRef } from "react";

const MealPlanExport = forwardRef(({ weeklyPlan, diet, budget, calories, people }, ref) => {
  const days = weeklyPlan?.weeks?.[0]?.days || [];

  const mealTypes = [
    { label: "Breakfast", icon: "🌅", nameKey: "breakfast", calKey: "breakfast_calories", ingKey: "breakfast_ingredients" },
    { label: "Lunch",     icon: "☀️",  nameKey: "lunch",     calKey: "lunch_calories",     ingKey: "lunch_ingredients"     },
    { label: "Dinner",    icon: "🌙",  nameKey: "dinner",    calKey: "dinner_calories",    ingKey: "dinner_ingredients"    },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "794px",
        background: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        fontSize: "13px",
        lineHeight: "1.4",
      }}
    >
      {/* Header */}
      <div style={{
        background: "#0f4c35",
        padding: "28px 40px 22px",
        color: "#ffffff",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7, marginBottom: "6px" }}>
              BudgetBite
            </div>
            <div style={{ fontSize: "26px", fontWeight: "800" }}>7-Day Meal Plan</div>
            <div style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>
              {diet} diet · {people} person(s) · repeats for 4 weeks
            </div>
          </div>
          <div style={{ fontSize: "12px", opacity: 0.7, textAlign: "right" }}>
            {new Date().toLocaleDateString("en-DE", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Stats — use table for reliable html2canvas rendering */}
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "8px 0" }}>
          <tbody>
            <tr>
              {[
                { label: "Monthly Budget", value: `€${parseFloat(budget).toFixed(0)}` },
                { label: "Daily Calories", value: `${calories} kcal` },
                { label: "People", value: String(people) },
                { label: "Meals / Week", value: "21" },
              ].map(({ label, value }) => (
                <td key={label} style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  width: "25%",
                }}>
                  <div style={{ fontSize: "9px", opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "16px", fontWeight: "800" }}>{value}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Days */}
      <div style={{ padding: "20px 40px 30px" }}>
        {days.map((day, idx) => (
          <div key={idx} style={{
            marginBottom: "14px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}>
            {/* Day header */}
            <div style={{
              background: idx % 2 === 0 ? "#f0fdf4" : "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              padding: "7px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                background: "#0f4c35",
                color: "#ffffff",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                lineHeight: "22px",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "700",
                flexShrink: 0,
              }}>
                {idx + 1}
              </div>
              <span style={{ fontWeight: "700", fontSize: "13px", color: "#0f4c35" }}>{day.day}</span>
            </div>

            {/* Meals — use table for reliable layout */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  {mealTypes.map(({ label, icon, nameKey, calKey, ingKey }, mIdx) => {
                    const name = day[nameKey];
                    const cal = day[calKey];
                    const ings = day[ingKey];
                    return (
                      <td key={label} style={{
                        width: "33.33%",
                        verticalAlign: "top",
                        padding: "10px 12px",
                        borderRight: mIdx < 2 ? "1px solid #f0f0f0" : "none",
                        background: "#ffffff",
                      }}>
                        {/* Meal label row */}
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                          <span style={{ fontSize: "12px", marginRight: "4px" }}>{icon}</span>
                          <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>{label}</span>
                          {cal && (
                            <span style={{
                              marginLeft: "auto",
                              fontSize: "9px",
                              fontWeight: "700",
                              color: "#ffffff",
                              background: "#1a9e6e",
                              borderRadius: "10px",
                              padding: "1px 6px",
                              whiteSpace: "nowrap",
                            }}>
                              {cal} kcal
                            </span>
                          )}
                        </div>
                        {/* Meal name */}
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#111827", marginBottom: "5px" }}>{name}</div>
                        {/* Ingredients */}
                        {Array.isArray(ings) && ings.length > 0 && (
                          <div>
                            {ings.map((ing, i) => (
                              <div key={i} style={{
                                display: "inline-block",
                                fontSize: "8px",
                                background: "#f3f4f6",
                                color: "#374151",
                                borderRadius: "3px",
                                padding: "1px 5px",
                                marginRight: "3px",
                                marginBottom: "3px",
                              }}>
                                {ing.name} · {ing.quantity}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #e5e7eb",
        margin: "0 40px",
        paddingTop: "12px",
        paddingBottom: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: "10px", color: "#9ca3af" }}>BudgetBite — Smart meal planning for students in Germany</span>
        <span style={{ fontSize: "10px", color: "#9ca3af" }}>This plan repeats for 4 consecutive weeks</span>
      </div>
    </div>
  );
});

MealPlanExport.displayName = "MealPlanExport";
export default MealPlanExport;