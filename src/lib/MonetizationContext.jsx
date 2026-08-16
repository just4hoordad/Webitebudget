import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import OutOfCreditsModal from "@/components/monetization/OutOfCreditsModal";
import AdInterstitial from "@/components/monetization/AdInterstitial";
import ProPricingModal from "@/components/monetization/ProPricingModal";
import DonationModal from "@/components/monetization/DonationModal";

const FREE_DEFAULT = 3;
const PRO_MONTHLY = 30;
const FREE_KEY = "bb_free_credits";
const PRO_KEY = "bb_pro_status";

function readFree() {
  const v = parseInt(localStorage.getItem(FREE_KEY), 10);
  return isNaN(v) ? FREE_DEFAULT : v;
}
function writeFree(n) {
  localStorage.setItem(FREE_KEY, String(Math.max(0, n)));
}
function readPro() {
  try {
    return JSON.parse(localStorage.getItem(PRO_KEY)) || null;
  } catch {
    return null;
  }
}
function writePro(s) {
  if (s) localStorage.setItem(PRO_KEY, JSON.stringify(s));
  else localStorage.removeItem(PRO_KEY);
}

const MonetizationContext = createContext(null);

export function MonetizationProvider({ children }) {
  const [freeCredits, setFreeCredits] = useState(readFree);
  const [proStatus, setProStatus] = useState(readPro);
  const [showOutOfCredits, setShowOutOfCredits] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const pending = useRef(null);
  const syncedRef = useRef(false);

  // Refs keep the latest values for mutations (avoids stale closures across rapid calls).
  const freeRef = useRef(readFree());
  const proRef = useRef(readPro());

  const isPro = !!(proStatus?.active);
  const credits = isPro ? proStatus?.creditsRemaining ?? 0 : freeCredits;
  const periodEnd = proStatus?.periodEnd;

  const syncProStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("getProStatus", {});
      const data = res.data;
      if (data?.active) {
        const ns = {
          active: true,
          creditsRemaining: data.creditsRemaining ?? PRO_MONTHLY,
          periodEnd: data.periodEnd,
          email: data.email,
        };
        proRef.current = ns;
        writePro(ns);
        setProStatus(ns);
      } else if (data && data.active === false && proRef.current) {
        proRef.current = null;
        writePro(null);
        setProStatus(null);
      }
    } catch {
      /* public app / not authenticated — rely on localStorage */
    }
  }, []);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const justSubscribed = params.get("pro") === "success";
    const justDonated = params.get("donation") === "success";

    if (justSubscribed) {
      const ns = {
        active: true,
        creditsRemaining: PRO_MONTHLY,
        periodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      proRef.current = ns;
      writePro(ns);
      setProStatus(ns);
      toast.success("Welcome to BudgetBite Pro! 👑");
    }
    if (justDonated) {
      toast.success("Thank you for supporting BudgetBite! 🎉");
    }
    if (justSubscribed || justDonated) {
      params.delete("pro");
      params.delete("donation");
      const clean = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (clean ? `?${clean}` : ""));
    }

    if (!justSubscribed) syncProStatus();
  }, [syncProStatus]);

  const spend = useCallback(() => {
    if (proRef.current?.active) {
      const rem = (proRef.current.creditsRemaining ?? 0) - 1;
      if (rem < 0) return false;
      const ns = { ...proRef.current, creditsRemaining: rem };
      proRef.current = ns;
      writePro(ns);
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
    else if (!fn) toast.success("+1 free generation added 🎬");
  };
  const handleGoPro = () => {
    setShowOutOfCredits(false);
    setShowPricing(true);
  };

  const openPricing = useCallback(() => setShowPricing(true), []);
  const openDonation = useCallback(() => setShowDonation(true), []);
  const openWatchAd = useCallback(() => setShowAd(true), []);

  const value = {
    credits,
    isPro,
    tier: isPro ? "pro" : "free",
    periodEnd,
    guarded,
    openPricing,
    openDonation,
    openWatchAd,
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