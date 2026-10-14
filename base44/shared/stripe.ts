import { secrets } from "base44:runtime";

export const PRO_PRODUCT_ID = "prod_V55hlAm96ZnHNa";
export const PRO_PLUS_PRODUCT_ID = "prod_VRHRM0mfGKd04P";
export const PRO_MONTHLY_CREDITS = 30;
export const PRO_PLUS_MONTHLY_CREDITS = 100;
export const FREE_MONTHLY_CREDITS = 3;
export const FREE_STARTER_CREDITS = 3;

export const TIER_CREDITS = {
  free: FREE_MONTHLY_CREDITS,
  pro: PRO_MONTHLY_CREDITS,
  pro_plus: PRO_PLUS_MONTHLY_CREDITS,
};
const STRIPE_API_VERSION = "2025-10-29.clover";

export function getSecret(name) {
  return secrets.get(name);
}

export function stripeHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${getSecret("STRIPE_SECRET_KEY")}`,
    "Stripe-Version": STRIPE_API_VERSION,
    ...extra,
  };
}

export function appId() {
  return getSecret("BASE44_APP_ID") || "";
}

const ALLOWED_ORIGINS = ["https://webitebudget.base44.app"];

// Validate redirect origin against an allowlist to prevent open-redirect phishing.
export function safeOrigin(...candidates) {
  for (const c of candidates) {
    if (c && ALLOWED_ORIGINS.includes(c)) return c;
  }
  return ALLOWED_ORIGINS[0];
}

// Find the active recurring price for the Pro product.
export async function findProPriceId() {
  const res = await fetch(
    `https://api.stripe.com/v1/prices?product=${PRO_PRODUCT_ID}&active=true&limit=10`,
    { headers: stripeHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Failed to list prices");
  const recurring = (data.data || []).find((p) => p.type === "recurring");
  if (!recurring) throw new Error("No active recurring price found for Pro product");
  return recurring.id;
}

// Find the active recurring price for a given tier ("pro" or "pro_plus").
export async function findPriceForTier(tier) {
  const productId = tier === "pro_plus" ? PRO_PLUS_PRODUCT_ID : PRO_PRODUCT_ID;
  const res = await fetch(
    `https://api.stripe.com/v1/prices?product=${productId}&active=true&limit=10`,
    { headers: stripeHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Failed to list prices");
  const recurring = (data.data || []).find((p) => p.type === "recurring");
  if (!recurring) throw new Error(`No active recurring price found for tier ${tier}`);
  return recurring.id;
}

// Determine the tier from a price ID by looking up the product.
export async function tierFromPriceId(priceId) {
  const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
    headers: stripeHeaders(),
  });
  const data = await res.json();
  if (!res.ok) return "pro";
  if (data.product === PRO_PLUS_PRODUCT_ID) return "pro_plus";
  return "pro";
}

// Verify a Stripe webhook signature using Web Crypto HMAC-SHA256 (no SDK needed).
export async function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = {};
  signatureHeader.split(",").forEach((p) => {
    const idx = p.indexOf("=");
    if (idx > -1) parts[p.slice(0, idx).trim()] = p.slice(idx + 1);
  });
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) return false;
  // Reject replayed webhooks: the signed timestamp must be within 5 minutes.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}