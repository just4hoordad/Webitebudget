import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Returns { isPro, loading } based on the current user's subscription status.
 * Works for public apps — returns isPro: false if not logged in.
 */
export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) { setLoading(false); return; }
        const user = await base44.auth.me();
        if (!cancelled) setIsPro(user?.role === "pro" || user?.role === "admin");
      } catch (_) {
        // not logged in or error — default to free
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { isPro, loading };
}