import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function useAccordionScroll(formRef, request, prefix) {
  const { pathname } = useLocation();
  const handled = useRef(0);
  useEffect(() => {
    if (request.revision === handled.current) return;
    handled.current = request.revision;
    if (!request.key) return;
    const root = formRef.current;
    const target = root?.querySelector(`[id="${prefix}${request.key}"]`);
    if (!target?.getClientRects().length) return;
    target.querySelector('button[aria-expanded="true"]')?.focus({ preventScroll: true });
    let frame, lastLayout, stableFrames = 0;
    const align = () => {
      if (!target.isConnected || !target.getClientRects().length) return;
      const animating = Array.from(root.querySelectorAll('[role="region"]'))
        .some((panel) => panel.getAnimations().some((animation) => animation.playState === "running"));
      const viewport = window.visualViewport;
      const layout = [target.getBoundingClientRect().top, root.getBoundingClientRect().height,
        viewport?.height || window.innerHeight, viewport?.offsetTop || 0].map(Math.round).join(":");
      stableFrames = !animating && layout === lastLayout ? stableFrames + 1 : 0;
      lastLayout = layout;
      if (stableFrames < 3) {
        frame = requestAnimationFrame(align);
        return;
      }
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
        inline: "nearest",
      });
    };
    frame = requestAnimationFrame(align);
    return () => cancelAnimationFrame(frame);
  }, [formRef, request, prefix, pathname]);
}