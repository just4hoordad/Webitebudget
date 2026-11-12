import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Share2, Copy, Link as LinkIcon, Loader2, Check, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharePlanModal({ plan, open, onClose }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState(plan?.shareToken || "");
  const [copied, setCopied] = useState(false);

  // Reset token state when a different plan is opened.
  useEffect(() => {
    if (open) setToken(plan?.shareToken || "");
  }, [open, plan?.id]);

  if (!open) return null;

  const link = token ? `${window.location.origin}/share/${token}` : "";

  const createLink = async () => {
    setBusy(true);
    try {
      const newToken = crypto.randomUUID();
      await base44.entities.MealPlan.update(plan.id, {
        shareToken: newToken,
        sharedAt: new Date().toISOString(),
      });
      setToken(newToken);
      toast.success(t("shareLinkCreated") || "Share link created");
    } catch {
      toast.error(t("shareLinkFailed") || "Couldn't create share link");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    if (!confirm(t("revokeConfirm") || "Revoke this share link? Anyone with the old link will lose access.")) return;
    setBusy(true);
    try {
      await base44.entities.MealPlan.update(plan.id, { shareToken: "" });
      setToken("");
      toast.success(t("shareRevoked") || "Share link revoked");
    } catch {
      toast.error(t("shareRevokeFailed") || "Couldn't revoke link");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed") || "Couldn't copy");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: plan?.name || "BudgetBite plan", url: link });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border-[3px] border-[#111827] dark:border-[#78a71b] shadow-[6px_6px_0_#111827] rounded-3xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#7DD3FC] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center shrink-0 text-[#111827]">
            <Share2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-black text-base">{t("sharePlan") || "Share plan"}</h3>
            <p className="text-xs font-medium text-muted-foreground truncate">{plan?.name}</p>
          </div>
        </div>

        {!token ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("shareExplain") ||
                "Create a link so anyone can preview this plan and copy it to their library."}
            </p>
            <Button onClick={createLink} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              {t("createShareLink") || "Create share link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 bg-transparent text-xs text-foreground outline-none truncate"
              />
              <button onClick={copyLink} className="text-primary shrink-0" title={t("copy") || "Copy"}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={nativeShare} variant="outline" className="w-full">
                <Share2 className="h-4 w-4" /> {t("share") || "Share"}
              </Button>
              <Button
                onClick={revoke}
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={busy}
              >
                <Unlink className="h-4 w-4" /> {t("revoke") || "Revoke"}
              </Button>
            </div>
          </div>
        )}

        <Button onClick={onClose} variant="ghost" className="w-full">
          {t("close") || "Close"}
        </Button>
      </div>
    </div>
  );
}