import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OutOfCreditsModal from "@/components/monetization/OutOfCreditsModal";
import AdInterstitial from "@/components/monetization/AdInterstitial";
import ProPricingModal from "@/components/monetization/ProPricingModal";
import DonationModal from "@/components/monetization/DonationModal";

const FREE_MONTHLY = 2;
const PRO_MONTHLY = 15;
const PRO_PLUS_MONTHLY = 30;
const FREE_KEY = "bb_free_credits";
const FREE_PERIOD_KEY = "bb_free_period_start";
const LEGACY_PRO_KEY = "bb_pro_status";

const FREE_RESET_DAYS = 30;

function readFreePeriodStart() {
  const v = parseInt(localStorage.getItem(FREE_PERIOD_KEY), 10);
  return isNaN(v) ? null : v;
}
function writeFreePeriodStart(ts) {
  localStorage.setItem(FREE_PERIOD_KEY, String(ts));
}
function readFree() {
  const periodStart = readFreePeriodStart();
  const now = Date.now();
  if (!periodStart || now - periodStart >= FREE_RESET_DAYS * 86400000) {
    writeFreePeriodStart(now);
    localStorage.setItem(FREE_KEY, String(FREE_MONTHLY));
    return FREE_MONTHLY;
  }
  const v = parseInt(localStorage.getItem(FREE_KEY), 10);
  return isNaN(v) ? FREE_MONTHLY : v;
}
function writeFree(n) {
  localStorage.setItem(FREE_KEY, String(Math.max(0, n)));
}

const MonetizationContext = createContext(null);

export function MonetizationProvider({ children }) {
  const [freeCredits, setFreeCredits] = useState(readFree);
  // Pro entitlement is NEVER initialized from or persisted to localStorage or URL params;
  // it comes exclusively from server-verified ProSubscription via getProStatus.
  const [proStatus, setProStatus] = useState(null);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const pending = useRef(null);
  const syncedRef = useRef(false);

  const freeRef = useRef(readFree());
  const proRef = useRef(null);

  const isPro = !!(proStatus?.active);
  const tier = isPro ? (proStatus?.tier || "pro") : "free";
  const credits = isPro ? proStatus?.creditsRemaining ?? 0 : freeCredits;
  const periodEnd = proStatus?.periodEnd;
  const tierLimit = isPro
    ? (tier === "pro_plus" ? PRO_PLUS_MONTHLY : PRO_MONTHLY)
    : FREE_MONTHLY;

  const syncProStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getProStatus", {});
      const data = res?.data;
      if (data?.active) {
        const ns = {
          active: true,
          tier: data.tier || "pro",
          creditsRemaining: data.creditsRemaining ?? PRO_MONTHLY,
          periodEnd: data.periodEnd,
          email: data.email,
        };
        proRef.current = ns;
        setProStatus(ns);
        return ns;
      }
      proRef.current = null;
      setProStatus(null);
      if (typeof data?.freeCreditsRemaining === "number") {
        freeRef.current = data.freeCreditsRemaining;
        writeFree(data.freeCreditsRemaining);
        setFreeCredits(data.freeCreditsRemaining);
      }
      return null;
    } catch {
      proRef.current = null;
      setProStatus(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Purge any legacy client-side Pro cache from older versions.
    try { localStorage.removeItem(LEGACY_PRO_KEY); } catch { /* ignore */ }

    if (syncedRef.current) return;
    syncedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const justSubscribed = params.get("pro") === "success";
    const justDonated = params.get("donation") === "success";

    if (justDonated) {
      toast.success("Thank you for supporting BudgetBite!");
    }
    if (justSubscribed || justDonated) {
      params.delete("pro");
      params.delete("donation");
      params.delete("tier");
      const clean = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (clean ? `?${clean}` : ""));
    }

    (async () => {
      let verified = await syncProStatus();
      // If returning from Stripe Checkout, webhook delivery can take 1-3 seconds.
      // Poll server-side getProStatus briefly and only unlock Pro once verified.
      if (justSubscribed && !verified) {
        toast.info("Verifying your subscription…");
        for (let i = 0; i < 3 && !verified; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          verified = await syncProStatus();
        }
      }
      if (justSubscribed && verified?.active) {
        toast.success(
          verified.tier === "pro_plus"
            ? "Welcome to BudgetBite Pro+!"
            : "Welcome to BudgetBite Pro!"
        );
      }
    })();
  }, [syncProStatus]);

  // Keep UI credit balance aligned with server-side AIUsage / ProSubscription after AI calls.
  useEffect(() => {
    const onAiUsed = () => { syncProStatus(); };
    window.addEventListener("bb:ai-used", onAiUsed);
    return () => window.removeEventListener("bb:ai-used", onAiUsed);
  }, [syncProStatus]);

  const spend = useCallback(() => {
    if (proRef.current?.active) {
      const rem = (proRef.current.creditsRemaining ?? 0) - 1;
      if (rem < 0) return false;
      const ns = { ...proRef.current, creditsRemaining: rem };
      proRef.current = ns;
      setProStatus(ns);
      return true;
    }
    const rem = freeRef.current - 1;
    if (rem < 0) return false;
    freeRef.current = rem;
    writeFree(rem);
    setFreeCredits(rem);
    return true;
  }, []);

  const grantAdCredit = useCallback(() => {
    if (proRef.current?.active) return;
    const nf = freeRef.current + 1;
    freeRef.current = nf;
    writeFree(nf);
    setFreeCredits(nf);
  }, []);

  const guarded = useCallback(
    (fn) => {
      if (spend()) {
        fn();
        return;
      }
      pending.current = fn;
      setShowOutOfCredits(true);
    },
    [spend]
  );

  const handleWatchAd = () => {
    setShowOutOfCredits(false);
    setShowAd(true);
  };
  const handleAdComplete = () => {
    grantAdCredit();
    setShowAd(false);
    const fn = pending.current;
    pending.current = null;
    if (fn && spend()) fn();
    else if (!fn) toast.success("+1 free generation added");
  };
  const handleGoPro = () => {
    setShowOutOfCredits(false);
    setShowPricing(true);
  };

  const openPricing = useCallback(() => setShowPricing(true), []);
  const openDonation = useCallback(() => setShowDonation(true), []);
  const openWatchAd = useCallback(() => setShowAd(true), []);
  const clearProStatus = useCallback(() => {
    proRef.current = null;
    setProStatus(null);
  }, []);

  const value = {
    credits,
    isPro,
    tier,
    tierLimit,
    periodEnd,
    guarded,
    openPricing,
    openDonation,
    openWatchAd,
    clearProStatus,
    proStatus,
  };

  return (
    <MonetizationContext.Provider value={value}>
      {children}
      <OutOfCreditsModal
        open={showOutOfCredits}
        onClose={() => setShowOutOfCredits(false)}
        onWatchAd={handleWatchAd}
        onGoPro={handleGoPro}
        isPro={isPro}
        tier={tier}
        periodEnd={periodEnd}
      />
      <AdInterstitial
        open={showAd}
        onComplete={handleAdComplete}
        onClose={() => setShowAd(false)}
      />
      <ProPricingModal open={showPricing} onClose={() => setShowPricing(false)} />
      <DonationModal open={showDonation} onClose={() => setShowDonation(false)} />
    </MonetizationContext.Provider>
  );
}

export function useMonetization() {
  const ctx = useContext(MonetizationContext);
  if (!ctx) {
    return {
      credits: 0,
      isPro: false,
      tier: "free",
      tierLimit: FREE_MONTHLY,
      periodEnd: undefined,
      guarded: (fn) => fn(),
      openPricing: () => {},
      openDonation: () => {},
      openWatchAd: () => {},
      proStatus: null,
    };
  }
  return ctx;
}