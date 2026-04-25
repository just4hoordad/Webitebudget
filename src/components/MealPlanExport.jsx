import { forwardRef } from "react";

const MealPlanExport = forwardRef(({ weeklyPlan, diet, budget, calories, people }, ref) => {
  const days = weeklyPlan?.weeks?.[0]?.days || [];

  const mealTypes = [
    { label: "Breakfast", icon: "Breakfast", nameKey: "breakfast", calKey: "breakfast_calories", ingKey: "breakfast_ingredients" },
    { label: "Lunch",     icon: "Lunch",     nameKey: "lunch",     calKey: "lunch_calories",     ingKey: "lunch_ingredients"     },
    { label: "Dinner",    icon: "Dinner",    nameKey: "dinner",    calKey: "dinner_calories",    ingKey: "dinner_ingredients"    },
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
        fontSize: "12px",
        lineHeight: "1.4",
        color: "#111827",
      }}
    >
      {/* ── Header ── */}
      <div style={{ background: "#0f4c35", padding: "28px 40px 22px", color: "#ffffff" }}>
        {/* Title row */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7, marginBottom: "4px" }}>BudgetBite</div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff" }}>7-Day Meal Plan</div>
                <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px", color: "#ffffff" }}>
                  {diet} diet &middot; {people} person(s) &middot; repeats for 4 weeks
                </div>
              </td>
              <td style={{ verticalAlign: "top", textAlign: "right", fontSize: "11px", opacity: 0.7, color: "#ffffff" }}>
                {new Date().toLocaleDateString("en-DE", { year: "numeric", month: "long", day: "numeric" })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Stats row */}
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "6px 0" }}>
          <tbody>
            <tr>
              {[
                { label: "Monthly Budget", value: `\u20AC${parseFloat(budget).toFixed(0)}` },
                { label: "Daily Calories",  value: `${calories} kcal` },
                { label: "People",          value: String(people) },
                { label: "Meals / Week",    value: "21" },
              ].map(({ label, value }) => (
                <td key={label} style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  width: "25%",
                }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px", opacity: 0.75, color: "#ffffff" }}>{label}</div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>{value}</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Days ── */}
      <div style={{ padding: "18px 40px 24px" }}>
        {days.map((day, idx) => (
          <div key={idx} style={{
            marginBottom: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
          }}>
            {/* Day header */}
            <table style={{ width: "100%", borderCollapse: "collapse", background: idx % 2 === 0 ? "#f0fdf4" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "7px 14px", width: "30px", verticalAlign: "middle" }}>
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
                    }}>
                      {idx + 1}
                    </div>
                  </td>
                  <td style={{ padding: "7px 6px", fontWeight: "700", fontSize: "13px", color: "#0f4c35", verticalAlign: "middle" }}>
                    {day.day}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Meals — pure table, no flex */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  {mealTypes.map(({ label, nameKey, calKey, ingKey }, mIdx) => {
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
                        {/* Label + kcal on same row via table */}
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px" }}>
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: "middle" }}>
                                <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b7280" }}>{label}</span>
                              </td>
                              {cal ? (
                                <td style={{ verticalAlign: "middle", textAlign: "right" }}>
                                  <span style={{
                                    fontSize: "9px",
                                    fontWeight: "700",
                                    color: "#ffffff",
                                    background: "#1a9e6e",
                                    borderRadius: "10px",
                                    padding: "2px 7px",
                                  }}>
                                    {cal} kcal
                                  </span>
                                </td>
                              ) : <td />}
                            </tr>
                          </tbody>
                        </table>
                        {/* Meal name */}
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#111827", marginBottom: "5px" }}>{name}</div>
                        {/* Ingredients */}
                        {Array.isArray(ings) && ings.length > 0 && (
                          <div>
                            {ings.map((ing, i) => (
                              <span key={i} style={{
                                display: "inline-block",
                                fontSize: "8px",
                                background: "#f3f4f6",
                                color: "#374151",
                                borderRadius: "3px",
                                padding: "1px 5px",
                                marginRight: "3px",
                                marginBottom: "3px",
                              }}>
                                {ing.name} &middot; {ing.quantity}
                              </span>
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

      {/* ── Footer ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #e5e7eb", padding: "0 40px" }}>
        <tbody>
          <tr>
            <td style={{ padding: "12px 40px", fontSize: "10px", color: "#9ca3af" }}>
              BudgetBite — Smart meal planning for students in Germany
            </td>
            <td style={{ padding: "12px 40px", fontSize: "10px", color: "#9ca3af", textAlign: "right" }}>
              This plan repeats for 4 consecutive weeks
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

MealPlanExport.displayName = "MealPlanExport";
export default MealPlanExport;