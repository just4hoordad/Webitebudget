import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CONNECTOR_ID = "6a80925ce10008ea48867b23";

function sanitizeId(s) {
  return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

// Normalize the two plan shapes (array of days, or { weeks: [{ days }] }) into a flat day list.
function normalizeDays(plan) {
  const p = plan?.plan;
  if (Array.isArray(p)) {
    return p.map((day, i) => ({
      label: `Day ${i + 1}`,
      breakfast: day.breakfast,
      lunch: day.lunch,
      dinner: day.dinner,
    }));
  }
  if (p && Array.isArray(p.weeks)) {
    const days = [];
    for (const w of p.weeks) {
      for (const d of (w.days || [])) {
        days.push({
          label: d.day || `Day ${days.length + 1}`,
          breakfast: d.breakfast,
          lunch: d.lunch,
          dinner: d.dinner,
        });
      }
    }
    return days;
  }
  return [];
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Always verify the app-user calendar connection (throws if not connected).
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Connection-check mode: caller just wants to know if connected.
    if (body.checkOnly) {
      return Response.json({ connected: true });
    }

    const planId = body.planId;
    if (!planId) return Response.json({ error: "planId required" }, { status: 400 });

    const plan = await base44.entities.MealPlan.get(planId);
    const days = normalizeDays(plan);
    if (days.length === 0) return Response.json({ error: "No meal days found in plan" }, { status: 400 });

    const start = body.startDate ? new Date(body.startDate + "T00:00:00Z") : new Date();
    start.setUTCHours(0, 0, 0, 0);

    const baseId = sanitizeId(planId);
    let created = 0;
    const errors = [];
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const date = new Date(start.getTime() + i * 86400000);
      const dateStr = toISODate(date);
      const endStr = toISODate(new Date(date.getTime() + 86400000));

      const lines = [];
      if (day.breakfast) lines.push(`🍳 Breakfast: ${day.breakfast}`);
      if (day.lunch) lines.push(`🥗 Lunch: ${day.lunch}`);
      if (day.dinner) lines.push(`🍽 Dinner: ${day.dinner}`);
      const summary = `${day.label} · BudgetBite`;
      const description = lines.join("\n") + (plan.name ? `\n\nPlan: ${plan.name}` : "") + (plan.diet ? `\nDiet: ${plan.diet}` : "");

      // Deterministic event id → PUT upserts, so re-syncing updates instead of duplicating.
      const eventId = `bb-${baseId}-d${i}`.slice(0, 60);
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          description,
          start: { date: dateStr },
          end: { date: endStr },
          extendedProperties: {
            private: { budgetbite_plan_id: planId, budgetbite_day: String(i) },
          },
        }),
      });
      if (res.ok) created++;
      else errors.push({ day: i, status: res.status });
    }

    return Response.json({ success: true, eventsCreated: created, totalDays: days.length, errors: errors.slice(0, 3) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}