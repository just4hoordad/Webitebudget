import { useEffect, useRef } from "react";
import { useMonetization } from "@/lib/MonetizationContext";

// Your AdSense publisher client ID.
export const ADSENSE_CLIENT_ID = "ca-pub-2924224061309943";

// Paste a manual ad-unit slot ID here (from your AdSense dashboard → Ads →
// By ad unit → Display ads). Leave empty to hide manual banners — Auto Ads
// (enabled in your AdSense dashboard) will still place ads automatically.
const MANUAL_SLOT_ID = "";

/**
 * Reusable AdSense display ad slot.
 *
 * Renders nothing while MANUAL_SLOT_ID is empty, so the app stays clean until
 * you create an ad unit in AdSense. Auto Ads (via the loader in index.html)
 * work independently of this component.
 *
 * Props:
 *  - slot:    ad unit slot ID (overrides MANUAL_SLOT_ID)
 *  - format:  ad format string, default "auto"
 *  - layout:  optional layout key (e.g. "fixed-height")
 *  - className, style: passthrough
 */
export default function AdSlot({
  slot = MANUAL_SLOT_ID,
  format = "auto",
  layout,
  className = "",
  style,
}) {
  const { isPro, credits } = useMonetization();
  // Ads only surface once a free user has exhausted their 3 free generations.
  // Pro users never see ads, and free users with credits remaining don't either.
  const showAd = !isPro && credits <= 0;
  const insRef = useRef(null);

  useEffect(() => {
    if (!slot || !showAd) return;
    try {
      // AdSense pushes ad creatives into the <ins> tag via this queue.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* adsbygoogle not loaded yet (e.g. inside builder preview) — safe to ignore */
    }
  }, [slot, showAd]);

  if (!slot || !showAd) return null;

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { "data-ad-layout": layout } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
}