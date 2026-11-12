import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function downloadGroceryListPDF({
  items,
  activeTotal,
  subtitleText,
  titleText,
  totalLabel,
  translateCategory,
  langCode,
  filename,
}) {
  const categories = {};
  items.forEach((item) => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });

  const pageWidth = 794;
  const pageHeight = 1123;
  const pagePadding = 48;
  const contentWidth = pageWidth - pagePadding * 2;

  const headerHtml = `
    <div style="margin:0 -48px 28px;padding:24px 48px 26px;background:#78a71b;color:#111827;border-bottom:4px solid #111827;">
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;letter-spacing:.08em;margin-bottom:12px;">
        <span>BUDGETBITE</span>
        <span>${new Date().toLocaleDateString(langCode || "en-DE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</span>
      </div>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 8px;font-weight:900;">${esc(titleText)}</h1>
      <p style="margin:0;font-size:14px;font-weight:600;">${esc(subtitleText)}</p>
    </div>
  `;

  const itemHtml = (item) => `
    <div style="display:flex;justify-content:space-between;gap:18px;padding:12px 16px;border-top:1.5px solid #e5e7eb;break-inside:avoid;">
      <div>
        <div style="font-size:14px;font-weight:800;color:#111827;">${esc(item.name || "")}</div>
        <div style="font-size:12px;color:#4b5563;margin-top:3px;">${esc(item.quantity || "")}</div>
      </div>
      <div style="text-align:right;min-width:90px;">
        <div style="font-size:15px;font-weight:900;color:#111827;">€${(item.price || 0).toFixed(2)}</div>
        <div style="font-size:11px;color:#4b5563;margin-top:3px;font-weight:700;">${esc(item.store || "")}</div>
      </div>
    </div>
  `;

  const sectionHtml = (catName, catItems) => `
    <section style="break-inside:avoid;margin-bottom:18px;border:2.5px solid #111827;border-radius:16px;overflow:hidden;">
      <h2 style="margin:0;padding:12px 16px;background:#F3F8E6;color:#111827;border-bottom:2px solid #111827;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;">${esc(
        translateCategory(catName)
      )}</h2>
      ${catItems.map(itemHtml).join("")}
    </section>
  `;

  const totalHtml = `
    <div style="margin-top:24px;padding:16px 20px;background:#FFB020;color:#111827;border:3px solid #111827;border-radius:16px;display:flex;justify-content:space-between;font-size:18px;font-weight:900;break-inside:avoid;">
      <span>${esc(totalLabel)}</span>
      <span>€${activeTotal.toFixed(2)}</span>
    </div>
  `;

  const measureNode = document.createElement("div");
  measureNode.style.position = "fixed";
  measureNode.style.left = "-10000px";
  measureNode.style.top = "0";
  measureNode.style.width = `${contentWidth}px`;
  measureNode.style.fontFamily = "'DM Sans', Arial, sans-serif";
  document.body.appendChild(measureNode);

  const measure = (html) => {
    measureNode.innerHTML = html;
    return measureNode.offsetHeight;
  };

  const pages = [];
  let currentBlocks = [headerHtml];
  let currentHeight = measure(headerHtml);
  const maxContentHeight = pageHeight - pagePadding * 2;

  const pushPage = () => {
    pages.push(currentBlocks.join(""));
    currentBlocks = [];
    currentHeight = 0;
  };

  Object.entries(categories).forEach(([catName, catItems]) => {
    const fullSection = sectionHtml(catName, catItems);
    const fullHeight = measure(fullSection);

    if (currentHeight + fullHeight <= maxContentHeight) {
      currentBlocks.push(fullSection);
      currentHeight += fullHeight;
      return;
    }

    if (currentHeight > 0) pushPage();

    const heading = `<section style="margin-bottom:18px;border:2.5px solid #111827;border-radius:16px;overflow:hidden;"><h2 style="margin:0;padding:12px 16px;background:#F3F8E6;color:#111827;border-bottom:2px solid #111827;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;">${esc(
      translateCategory(catName)
    )}</h2>`;
    const close = `</section>`;
    let sectionBlocks = [heading];
    let sectionHeight = measure(heading + close);

    catItems.forEach((item) => {
      const block = itemHtml(item);
      const blockHeight = measure(block);
      if (sectionHeight + blockHeight > maxContentHeight && sectionBlocks.length > 1) {
        currentBlocks.push(sectionBlocks.join("") + close);
        currentHeight = measure(currentBlocks.join(""));
        pushPage();
        sectionBlocks = [heading];
        sectionHeight = measure(heading + close);
      }
      sectionBlocks.push(block);
      sectionHeight += blockHeight;
    });

    currentBlocks.push(sectionBlocks.join("") + close);
    currentHeight = measure(currentBlocks.join(""));
  });

  const tHeight = measure(totalHtml);
  if (currentHeight + tHeight > maxContentHeight) pushPage();
  currentBlocks.push(totalHtml);
  pages.push(currentBlocks.join(""));
  document.body.removeChild(measureNode);

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  for (let i = 0; i < pages.length; i += 1) {
    const exportNode = document.createElement("div");
    exportNode.style.position = "fixed";
    exportNode.style.left = "-10000px";
    exportNode.style.top = "0";
    exportNode.style.width = `${pageWidth}px`;
    exportNode.style.minHeight = `${pageHeight}px`;
    exportNode.style.background = "#ffffff";
    exportNode.style.color = "#111827";
    exportNode.style.fontFamily = "'DM Sans', Arial, sans-serif";
    exportNode.style.padding = `0 ${pagePadding}px ${pagePadding}px`;
    exportNode.style.boxSizing = "border-box";
    exportNode.innerHTML = pages[i];
    document.body.appendChild(exportNode);

    const canvas = await html2canvas(exportNode, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    document.body.removeChild(exportNode);

    if (i > 0) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight()
    );
  }

  pdf.save(filename);
}

export function downloadWeeklyMealPlanPDF({ weeklyPlan, diet, budget, calories, people, t }) {
  const days = weeklyPlan?.weeks?.[0]?.days || [];
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const col = (pageW - margin * 2) / 3;
  let y = margin;

  const GREEN = [120, 167, 27];
  const DARK = [17, 24, 39];
  const GRAY = [107, 114, 128];
  const BG_LIGHT = [243, 248, 230];

  const checkPage = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 110, "F");
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BUDGETBITE", margin, 28);
  doc.text(
    new Date().toLocaleDateString("en-DE", { year: "numeric", month: "long", day: "numeric" }),
    pageW - margin,
    28,
    { align: "right" }
  );
  doc.setFontSize(22);
  doc.text(t("yourWeeklyMealPlan"), margin, 52);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${diet} · ${people} ${t("personS")} · ${t("repeatNote").replace(/^💡\s*/, "")}`, margin, 66);

  const stats = [
    { label: t("yourBudget").toUpperCase(), value: `€${parseFloat(budget).toFixed(0)}` },
    { label: t("calorieGoal").toUpperCase(), value: `${calories} kcal` },
    { label: t("numberOfPeople").toUpperCase(), value: String(people) },
    { label: "MEALS / WEEK", value: "21" },
  ];
  const bw = (pageW - margin * 2) / 4;
  stats.forEach(({ label, value }, i) => {
    const bx = margin + i * bw;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(bx, 76, bw - 6, 28, 4, 4, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text(label, bx + 8, 87);
    doc.setFontSize(14);
    doc.setTextColor(...DARK);
    doc.text(value, bx + 8, 100);
  });
  y = 126;

  days.forEach((day, idx) => {
    const meals = [
      { label: t("breakfast").toUpperCase(), name: day.breakfast, cal: day.breakfast_calories, ings: day.breakfast_ingredients },
      { label: t("lunch").toUpperCase(), name: day.lunch, cal: day.lunch_calories, ings: day.lunch_ingredients },
      { label: t("dinner").toUpperCase(), name: day.dinner, cal: day.dinner_calories, ings: day.dinner_ingredients },
    ];
    const ingLines = meals.reduce((sum, m) => sum + (m.ings?.length || 0), 0);
    const needed = 28 + 14 + meals.length * 38 + ingLines * 10 + 12;
    checkPage(needed);

    doc.setFillColor(...(idx % 2 === 0 ? BG_LIGHT : [249, 250, 251]));
    doc.rect(margin, y, pageW - margin * 2, 20, "F");
    doc.setFillColor(...DARK);
    doc.circle(margin + 10, y + 10, 8, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(idx + 1), margin + 10, y + 13, { align: "center" });
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.text(day.day, margin + 22, y + 14);
    y += 22;

    const rowStartY = y;
    let maxColH = 0;
    meals.forEach((meal, mIdx) => {
      const cx = margin + mIdx * col;
      let cy = rowStartY + 4;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GRAY);
      doc.text(meal.label, cx + 4, cy + 7);
      cy += 10;
      if (meal.cal) {
        doc.setFillColor(...GREEN);
        doc.roundedRect(cx + 4, cy, 48, 10, 3, 3, "F");
        doc.setFontSize(7);
        doc.setTextColor(...DARK);
        doc.text(`${meal.cal} kcal`, cx + 28, cy + 7, { align: "center" });
        cy += 13;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      const nameLines = doc.splitTextToSize(meal.name || "", col - 10);
      doc.text(nameLines, cx + 4, cy + 9);
      cy += nameLines.length * 11 + 2;
      if (Array.isArray(meal.ings) && meal.ings.length > 0) {
        meal.ings.forEach((ing) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...GRAY);
          const ingText = doc.splitTextToSize(`· ${ing.name} ${ing.quantity}`, col - 10);
          doc.text(ingText, cx + 4, cy + 7);
          cy += ingText.length * 9;
        });
      }
      maxColH = Math.max(maxColH, cy - rowStartY);
    });

    doc.setDrawColor(220, 224, 230);
    doc.line(margin + col, rowStartY, margin + col, rowStartY + maxColH + 4);
    doc.line(margin + col * 2, rowStartY, margin + col * 2, rowStartY + maxColH + 4);
    doc.setDrawColor(...DARK);
    doc.rect(margin, rowStartY - 22, pageW - margin * 2, maxColH + 26, "S");
    y = rowStartY + maxColH + 10;
  });

  checkPage(20);
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageW - margin, y);
  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(t("footerText"), margin, y);
  doc.text(t("repeatNote").replace(/^💡\s*/, ""), pageW - margin, y, { align: "right" });

  doc.save(`meal-plan-${diet}-${budget}eur.pdf`);
}