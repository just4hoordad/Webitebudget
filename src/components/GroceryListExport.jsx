import { forwardRef } from "react";

const GroceryListExport = forwardRef(({ groceries, activeItems, activeTotal, budget, diet, people, calories }, ref) => {
  const remaining = parseFloat(budget) - activeTotal;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: "-9999px",
        left: "-9999px",
        width: "794px",
        background: "#ffffff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Header section */}
      <div data-pdf-section style={{ padding: "32px 48px 24px", borderBottom: "3px solid #1a9e6e", background: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#0f4c35", letterSpacing: "-0.5px" }}>
              🛒 BudgetBite Grocery List
            </h1>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
              {diet} diet · {people} person(s) · {calories} kcal/day
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "13px", color: "#6b7280" }}>
            Generated {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Budget Summary */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 18px" }}>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estimated Total</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#16a34a" }}>€{activeTotal.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px 18px" }}>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Budget</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#111827" }}>€{parseFloat(budget).toFixed(2)}</div>
          </div>
          <div style={{ flex: 1, background: remaining >= 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${remaining >= 0 ? "#bbf7d0" : "#fecaca"}`, borderRadius: "12px", padding: "14px 18px" }}>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Remaining</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: remaining >= 0 ? "#16a34a" : "#dc2626" }}>€{remaining.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Categories — each is its own pdf section */}
      {groceries?.categories?.map((category) => {
        const visibleItems = activeItems.filter(i => i.category === category.name);
        if (visibleItems.length === 0) return null;
        const catTotal = visibleItems.reduce((s, i) => s + (i.price || 0), 0);

        return (
          <div key={category.name} data-pdf-section style={{ padding: "0 48px 4px", background: "#ffffff" }}>
            {/* Category Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f4c35", color: "#ffffff", borderRadius: "8px 8px 0 0", padding: "10px 16px", marginTop: "16px" }}>
              <span style={{ fontWeight: "700", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{category.name}</span>
              <span style={{ fontWeight: "700", fontSize: "13px" }}>€{catTotal.toFixed(2)}</span>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb", borderTop: "none" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "8px 14px", fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>Item</th>
                  <th style={{ textAlign: "left", padding: "8px 14px", fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                  <th style={{ textAlign: "left", padding: "8px 14px", fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>Store</th>
                  <th style={{ textAlign: "right", padding: "8px 14px", fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>Unit Price</th>
                  <th style={{ textAlign: "right", padding: "8px 14px", fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                    <td style={{ padding: "9px 14px", fontSize: "12px", color: "#111827", fontWeight: "500", borderBottom: "1px solid #f3f4f6" }}>
                      {item.name}
                      {item.calories_info && <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{item.calories_info}</div>}
                    </td>
                    <td style={{ padding: "9px 14px", fontSize: "12px", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{item.quantity}</td>
                    <td style={{ padding: "9px 14px", fontSize: "12px", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{item.store || "—"}</td>
                    <td style={{ padding: "9px 14px", fontSize: "12px", color: "#374151", textAlign: "right", borderBottom: "1px solid #f3f4f6" }}>
                      {item.unit_price != null ? `€${item.unit_price.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "9px 14px", fontSize: "12px", fontWeight: "600", color: "#0f4c35", textAlign: "right", borderBottom: "1px solid #f3f4f6" }}>
                      €{item.price?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Footer */}
      <div data-pdf-section style={{ padding: "16px 48px 32px", background: "#ffffff" }}>
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>BudgetBite — Smart meal planning for students in Germany</span>
          <div style={{ background: "#0f4c35", color: "#ffffff", borderRadius: "8px", padding: "8px 20px", fontSize: "15px", fontWeight: "700" }}>
            TOTAL: €{activeTotal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
});

GroceryListExport.displayName = "GroceryListExport";
export default GroceryListExport;