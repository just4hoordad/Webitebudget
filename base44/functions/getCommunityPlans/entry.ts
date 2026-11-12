import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Community browsing for signed-in users.
//   - No planId: returns a page of community-visible plan summaries.
//     Visibility = profile-level: a user is visible UNLESS they created a
//     Profile record with profilePublic === false (default is public/on).
//   - planId:    returns a single plan's full detail (after the same visibility
//     check), so the detail view never exposes a plan whose owner opted out.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) =>
      e.status === 401 ? null : Promise.reject(e)
    );
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId, diet, cursor } = body;

    // ── Single plan detail ────────────────────────────────────────────────
    if (planId) {
      const plan = await base44.asServiceRole.entities.MealPlan.get(planId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e)
      );
      if (!plan) {
        return Response.json({ error: "Plan not found" }, { status: 404 });
      }
      const ownerProfiles = await base44.asServiceRole.entities.Profile.filter(
        { userId: plan.created_by_id },
        { limit: 1 }
      );
      const profile = (ownerProfiles.items || [])[0];
      if (profile && profile.profilePublic === false) {
        return Response.json({ error: "This plan is no longer public" }, { status: 403 });
      }
      return Response.json({
        plan,
        ownerDisplayName: profile?.displayName || plan.created_by || "Anonymous",
      });
    }

    // ── List of community-visible plans ───────────────────────────────────
    // 1. Collect opted-out user IDs (profiles with profilePublic === false).
    const optedOutPage = await base44.asServiceRole.entities.Profile.filter(
      { profilePublic: false },
      { limit: 500 }
    );
    const optedOutIds = new Set((optedOutPage.items || []).map((p) => p.userId));

    // 2. Fetch recent MealPlans (service role = all users), filtered by diet.
    const filterQuery = diet ? { diet } : {};
    const plansPage = await base44.asServiceRole.entities.MealPlan.filter(
      filterQuery,
      { sort: "-created_date", limit: 30, cursor }
    );
    const allPlans = (plansPage.items || []).filter(
      (p) => !optedOutIds.has(p.created_by_id)
    );

    // 3. Resolve display names for the remaining owners.
    const ownerIds = [...new Set(allPlans.map((p) => p.created_by_id))];
    const nameMap: Record<string, string> = {};
    if (ownerIds.length) {
      const nameProfiles = await base44.asServiceRole.entities.Profile.filter(
        { userId: { $in: ownerIds } },
        { limit: 500 }
      );
      (nameProfiles.items || []).forEach((p) => {
        nameMap[p.userId] = p.displayName;
      });
    }

    // 4. Build summaries (no grocery-list / meal-plan payload in the list).
    const items = allPlans.map((p) => {
      const cats = p.groceryList?.categories || [];
      const itemCount = cats.reduce(
        (s: number, c: any) => s + (c.items || []).length,
        0
      );
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
        ownerDisplayName: nameMap[p.created_by_id] || p.created_by || "Anonymous",
        totalCost: p.groceryList?.total_estimated_cost,
        itemCount,
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