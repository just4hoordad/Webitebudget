import { TIER_CREDITS, FREE_MONTHLY_CREDITS } from "./stripe.ts";

// One full plan generation invokes ~2–3 AI sub-calls (groceries + meal plan + optional retry).
export const CALLS_PER_CREDIT = 4;
export const FREE_RESET_MS = 30 * 86400000;
export const FREE_MAX_CALLS_PER_PERIOD = 12; // 2 free credits + bounded ad-bonus headroom
export const ANON_IP_DAILY_CAP = 6;
export const ANON_UNIDENTIFIED_DAILY_CAP = 4;
export const GLOBAL_ANON_DAILY_CAP = 100;
export const GLOBAL_DAILY_CALL_CAP = 1000;

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

async function getBucket(svc, scopeKey) {
  const rows = await svc.entities.AIUsage.filter({ scopeKey });
  return Array.isArray(rows) ? rows[0] || null : (rows?.items?.[0] || null);
}

async function bumpDailyBucket(svc, existing, scopeKey, today, extra = {}) {
  if (!existing) {
    await svc.entities.AIUsage.create({
      scopeKey,
      periodKey: today,
      callCount: 1,
      ...extra,
    });
    return;
  }
  const nextCount = existing.periodKey === today ? (Number(existing.callCount) || 0) + 1 : 1;
  await svc.entities.AIUsage.update(existing.id, {
    periodKey: today,
    callCount: nextCount,
    ...extra,
  });
}

export async function getFreeUserCredits(base44, userId) {
  if (!userId) return FREE_MONTHLY_CREDITS;
  const svc = base44.asServiceRole;
  const rec = await getBucket(svc, `user:${userId}`);
  if (!rec) return FREE_MONTHLY_CREDITS;
  const started = Date.parse(rec.periodKey || "");
  if (!Number.isFinite(started) || Date.now() - started >= FREE_RESET_MS) {
    return FREE_MONTHLY_CREDITS;
  }
  const usedCalls = Number(rec.callCount) || 0;
  const usedCredits = Math.floor(usedCalls / CALLS_PER_CREDIT);
  return Math.max(0, FREE_MONTHLY_CREDITS - usedCredits);
}

/**
 * Enforces server-side AI quotas and cross-isolate global caps using persistent
 * Base44 entities (ProSubscription + AIUsage) BEFORE calling any LLM provider.
 * Never reads spoofable client headers (x-real-ip, x-forwarded-for).
 */
export async function consumeAIQuota(base44, req, user) {
  const svc = base44.asServiceRole;
  const today = todayUtc();
  const globalKey = `global:${today}`;

  const globalBucket = await getBucket(svc, globalKey);
  const globalCalls = globalBucket?.periodKey === today ? (Number(globalBucket.callCount) || 0) : 0;
  if (globalCalls >= GLOBAL_DAILY_CALL_CAP) {
    return {
      allowed: false,
      status: 429,
      error: "Daily AI capacity reached. Please try again tomorrow.",
    };
  }

  // ── 1. Authenticated user ─────────────────────────────────────────────────
  if (user?.id) {
    if (user.role === "admin") {
      await bumpDailyBucket(svc, globalBucket, globalKey, today);
      return { allowed: true };
    }

    const userKey = `user:${user.id}`;
    const [subs, userBucket] = await Promise.all([
      user.email ? svc.entities.ProSubscription.filter({ email: user.email }) : Promise.resolve([]),
      getBucket(svc, userKey),
    ]);
    const sub = Array.isArray(subs) ? subs[0] : subs?.items?.[0];

    // Verified active Pro / Pro+ subscription
    if (sub?.active) {
      const tier = sub.tier === "pro_plus" ? "pro_plus" : "pro";
      const tierCredits = TIER_CREDITS[tier] || TIER_CREDITS.pro;
      let creditsRemaining = Number(sub.creditsRemaining ?? tierCredits);
      let periodEnd = sub.periodEnd;

      // Auto-reset expired billing window
      if (!periodEnd || new Date(periodEnd) < new Date()) {
        creditsRemaining = tierCredits;
        periodEnd = new Date(Date.now() + FREE_RESET_MS).toISOString();
        await svc.entities.ProSubscription.update(sub.id, {
          creditsRemaining,
          periodEnd,
        });
      }

      const periodMarker = `pro:${periodEnd}`;
      const callCount = userBucket?.periodKey === periodMarker ? (Number(userBucket.callCount) || 0) : 0;
      const maxCalls = tierCredits * CALLS_PER_CREDIT;
      const spentCredits = Math.max(0, tierCredits - creditsRemaining);
      const coveredCalls = spentCredits * CALLS_PER_CREDIT;

      if (callCount >= maxCalls || (callCount >= coveredCalls && creditsRemaining <= 0)) {
        return {
          allowed: false,
          status: 429,
          error: "Monthly Pro AI credit limit reached.",
        };
      }

      const needsCreditDecrement = callCount >= coveredCalls;
      const nextCredits = needsCreditDecrement ? Math.max(0, creditsRemaining - 1) : creditsRemaining;
      const nextCalls = callCount + 1;

      await Promise.all([
        needsCreditDecrement
          ? svc.entities.ProSubscription.update(sub.id, { creditsRemaining: nextCredits })
          : Promise.resolve(),
        userBucket
          ? svc.entities.AIUsage.update(userBucket.id, {
              periodKey: periodMarker,
              callCount: nextCalls,
              creditsRemaining: nextCredits,
            })
          : svc.entities.AIUsage.create({
              scopeKey: userKey,
              periodKey: periodMarker,
              callCount: nextCalls,
              creditsRemaining: nextCredits,
            }),
        bumpDailyBucket(svc, globalBucket, globalKey, today),
      ]);

      return { allowed: true };
    }

    // Signed-in free-tier user (30-day server-side window)
    const nowIso = new Date().toISOString();
    const started = Date.parse(userBucket?.periodKey || "");
    const expired = !userBucket || !Number.isFinite(started) || Date.now() - started >= FREE_RESET_MS;
    const periodKey = expired ? nowIso : userBucket.periodKey;
    const callCount = expired ? 0 : (Number(userBucket.callCount) || 0);

    if (callCount >= FREE_MAX_CALLS_PER_PERIOD) {
      return {
        allowed: false,
        status: 429,
        error: "Free monthly AI quota reached. Upgrade to Pro for more generations.",
      };
    }

    const nextCalls = callCount + 1;
    const nextCredits = Math.max(0, FREE_MONTHLY_CREDITS - Math.floor(nextCalls / CALLS_PER_CREDIT));

    await Promise.all([
      userBucket
        ? svc.entities.AIUsage.update(userBucket.id, {
            periodKey,
            callCount: nextCalls,
            creditsRemaining: nextCredits,
          })
        : svc.entities.AIUsage.create({
            scopeKey: userKey,
            periodKey,
            callCount: nextCalls,
            creditsRemaining: nextCredits,
          }),
      bumpDailyBucket(svc, globalBucket, globalKey, today),
    ]);

    return { allowed: true };
  }

  // ── 2. Anonymous visitor ──────────────────────────────────────────────────
  // Only trust Cloudflare's edge-injected cf-connecting-ip header. Never use
  // client-controlled headers (x-real-ip, x-forwarded-for).
  const cfIp = req.headers.get("cf-connecting-ip")?.trim() || "";
  const anonKey = cfIp ? `anon:${cfIp}` : "anon:unidentified";
  const anonCap = cfIp ? ANON_IP_DAILY_CAP : ANON_UNIDENTIFIED_DAILY_CAP;
  const globalAnonKey = `global-anon:${today}`;

  const [globalAnonBucket, anonBucket] = await Promise.all([
    getBucket(svc, globalAnonKey),
    getBucket(svc, anonKey),
  ]);

  const globalAnonCalls =
    globalAnonBucket?.periodKey === today ? (Number(globalAnonBucket.callCount) || 0) : 0;
  if (globalAnonCalls >= GLOBAL_ANON_DAILY_CAP) {
    return {
      allowed: false,
      status: 429,
      error: "Anonymous AI limit reached. Please sign in to continue.",
    };
  }

  const anonCalls = anonBucket?.periodKey === today ? (Number(anonBucket.callCount) || 0) : 0;
  if (anonCalls >= anonCap) {
    return {
      allowed: false,
      status: 429,
      error: "Free daily AI limit reached. Please sign in or upgrade to Pro to continue.",
    };
  }

  await Promise.all([
    bumpDailyBucket(svc, anonBucket, anonKey, today, { creditsRemaining: 0 }),
    bumpDailyBucket(svc, globalAnonBucket, globalAnonKey, today, { creditsRemaining: 0 }),
    bumpDailyBucket(svc, globalBucket, globalKey, today),
  ]);

  return { allowed: true };
}