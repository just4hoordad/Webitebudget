import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const CONNECTOR_ID = "6a80925ce10008ea48867b23";

export function useGoogleCalendarSync() {
  // status: "loading" | "unauthenticated" | "connected" | "disconnected"
  const [status, setStatus] = useState("loading");
  const [syncingId, setSyncingId] = useState(null);
  const [syncedIds, setSyncedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("bb_synced_plans") || "[]")); }
    catch { return new Set(); }
  });
  const [error, setError] = useState(null);

  const persistSynced = (set) => {
    try { localStorage.setItem("bb_synced_plans", JSON.stringify([...set])); } catch { /* ignore */ }
  };

  // Reusable connection check — also doubles as the post-OAuth refresh.
  const checkConnection = useCallback(async () => {
    try {
      await base44.functions.invoke("googleCalendarSync", { checkOnly: true });
      setStatus("connected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!authed) { setStatus("unauthenticated"); return; }
      await checkConnection();
    });
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const res = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const url = typeof res === "string" ? res : (res?.data?.url || res?.url || res?.data);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch (e) {
      setError(e?.message || "Failed to start Google connection");
    }
  }, [checkConnection]);

  const disconnect = useCallback(async () => {
    setError(null);
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setStatus("disconnected");
    } catch (e) {
      setError(e?.message || "Failed to disconnect");
    }
  }, []);

  const login = useCallback(() => {
    base44.auth.redirectToLogin();
  }, []);

  const sync = useCallback(async (planId, startDate) => {
    setError(null);
    setSyncingId(planId);
    try {
      const res = await base44.functions.invoke("googleCalendarSync", { planId, startDate });
      setSyncedIds((prev) => {
        const next = new Set(prev);
        next.add(planId);
        persistSynced(next);
        return next;
      });
      return res?.data;
    } catch (e) {
      setError(e?.message || "Sync failed");
      throw e;
    } finally {
      setSyncingId(null);
    }
  }, []);

  return { status, syncingId, syncedIds, error, connect, disconnect, login, sync, checkConnection };
}