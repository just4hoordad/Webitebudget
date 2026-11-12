import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";

// Community browsing for signed-in users (strict opt-in + safe field projection):
//   - A plan is ONLY visible in the community when BOTH:
//       1) the owner enabled communityPublic === true on that MealPlan, AND
//       2) the owner's Profile has profilePublic === true.
//   - Single plan detail additionally enforces an active ProSubscription (unless
//     the caller is the plan owner or an admin) and returns ONLY display fields —
//     never postalCode, shareToken, lockedMeals, cookingDays, created_by_id, or email.

function safeAuthorLabel(displayName: unknown): string {
  const raw = typeof displayName === "string" ? displayName.trim() : "";
  if (!raw) return "Community Member";
  // Never leak an email address if a user left their email as displayName
  if (raw.includes("@")) {
    const prefix = raw.split("@")[0].trim();
    return prefix || "Community Member";
  }
  return raw;
}

function sanitizeGroceryList(gl: any) {
  if (!gl || typeof gl !== "object") return undefined;
  return {
    total_estimated_cost: gl.total_estimated_cost,
    categories: Array.isArray(gl.categories)
      ? gl.categories.map((cat: any) => ({
          name: cat?.name,
          items: Array.isArray(cat?.items)
            ? cat.items.map((it: any) => ({
                name: it?.name,
                quantity: it?.quantity,
                store: it?.store,
                price: it?.price,
                calories_info: it?.calories_info,
              }))
            : [],
        }))
      : [],
  };
}

function projectPlanDetail(plan: any) {
  return {
    id: plan.id,
    name: plan.name,
    diet: plan.diet,
    budget: plan.budget,
    calories: plan.calories,
    days: plan.days,
    people: plan.people,
    stores: plan.stores,
    macros: plan.macros,
    plan: plan.plan,
    groceryList: sanitizeGroceryList(plan.groceryList),
    recipes: plan.recipes,
    created_date: plan.created_date,
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) =>
      e?.status === 401 ? null : Promise.reject(e)
    );
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId, diet, cursor } = body;

    // ── Single plan detail ────────────────────────────────────────────────
    if (planId !== undefined && planId !== null) {
      if (typeof planId !== "string" || planId.trim().length === 0) {
        return Response.json({ error: "Invalid planId" }, { status: 400 });
      }

      const plan = await base44.asServiceRole.entities.MealPlan.get(planId.trim()).catch((e) =>
        e?.status === 404 ? null : Promise.reject(e)
      );
      if (!plan) {
        return Response.json({ error: "Plan not found" }, { status: 404 });
      }

      const isOwnerOrAdmin = plan.created_by_id === user.id || user.role === "admin";

      // Strict opt-in check: plan AND owner profile must both be explicitly opted in.
      const ownerProfiles = await base44.asServiceRole.entities.Profile.filter(
        { userId: plan.created_by_id },
        { limit: 1 }
      );
      const profile = (ownerProfiles.items || [])[0];

      if (!isOwnerOrAdmin && (plan.communityPublic !== true || !profile || profile.profilePublic !== true)) {
        return Response.json({ error: "This plan is not shared with the community" }, { status: 403 });
      }

      // Server-side Pro entitlement check for viewing full community plan details.
      if (!isOwnerOrAdmin) {
        const subs = user.email
          ? await base44.asServiceRole.entities.ProSubscription.filter({ email: user.email, active: true })
          : [];
        const hasPro = Array.isArray(subs) ? subs.length > 0 : (subs?.items?.length || 0) > 0;
        if (!hasPro) {
          return Response.json({ error: "Pro subscription required to view community plan details" }, { status: 403 });
        }
      }

      return Response.json({
        plan: projectPlanDetail(plan),
        ownerDisplayName: safeAuthorLabel(profile?.displayName),
      });
    }

    // ── List of community-visible plans (explicit opt-in only) ────────────
    const optedInPage = await base44.asServiceRole.entities.Profile.filter(
      { profilePublic: true },
      { limit: 500 }
    );
    const optedInProfiles = optedInPage.items || [];
    if (optedInProfiles.length === 0) {
      return Response.json({ items: [], next_cursor: null, has_more: false });
    }

    const nameMap: Record<string, string> = {};
    const optedInIds = new Set<string>();
    for (const p of optedInProfiles) {
      if (p.userId) {
        optedInIds.add(p.userId);
        nameMap[p.userId] = safeAuthorLabel(p.displayName);
      }
    }

    const safeDiet = typeof diet === "string" && diet.trim() ? diet.trim() : undefined;
    const filterQuery: Record<string, unknown> = { communityPublic: true };
    if (safeDiet) filterQuery.diet = safeDiet;

    const plansPage = await base44.asServiceRole.entities.MealPlan.filter(
      filterQuery,
      { sort: "-created_date", limit: 30, ...(typeof cursor === "string" && cursor ? { cursor } : {}) }
    );
    const visiblePlans = (plansPage.items || []).filter(
      (p: any) => optedInIds.has(p.created_by_id)
    );

    const items = visiblePlans.map((p: any) => {
      const cats = p.groceryList?.categories || [];
      const itemCount = cats.reduce(
        (s: number, c: any) => s + (c.items || []).length,
        0
      );
      const recipeCount =
        p.recipes && typeof p.recipes === "object" && !Array.isArray(p.recipes)
          ? Object.keys(p.recipes).length
          : 0;
      return {
        id: p.id,
        name: p.name,
        diet: p.diet,
        budget: p.budget,
        calories: p.calories,
        days: p.days,
        people: p.people,
        stores: p.stores,
        created_date: p.created_date,
        ownerDisplayName: nameMap[p.created_by_id] || "Community Member",
        totalCost: p.groceryList?.total_estimated_cost,
        itemCount,
        recipeCount,
      };
    });

    return Response.json({
      items,
      next_cursor: plansPage.next_cursor,
      has_more: plansPage.has_more,
    });
  } catch (error) {
    return Response.json(
      { error: (error as Error)?.message || "Failed to load community plans" },
      { status: 500 }
    );
  }
}