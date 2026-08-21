import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Public endpoint: no user auth required. Token alone authorizes the read.
    let token = null;
    try {
      const body = await req.json();
      token = body?.token;
    } catch {
      /* no/invalid body */
    }
    if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

    const records = await base44.asServiceRole.entities.MealPlan.filter({ shareToken: token });
    const plan = records?.[0];
    if (!plan || !plan.shareToken) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Return only the display fields needed for the preview — never expose
    // ownership, unrelated plans, or the token itself.
    return Response.json({
      name: plan.name,
      diet: plan.diet,
      people: plan.people,
      stores: plan.stores,
      macros: plan.macros,
      plan: plan.plan,
      groceryList: plan.groceryList,
      prep: plan.prep,
      sharedAt: plan.sharedAt,
    });
  } catch (error) {
    console.error("getSharedPlan error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}