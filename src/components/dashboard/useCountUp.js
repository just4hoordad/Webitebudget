import { useState, useEffect, useRef } from "react";

// Eased count-up from 0 → target over `duration` ms (easeOutCubic).
// Renders the baked target as the resting value if rAF never fires.
export function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return value;
}

export function formatNumber(value, decimals = 0, prefix = "") {
  const fixed = Number(value).toFixed(decimals);
  const parts = fixed.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return prefix + parts.join(".");
}

// Compact relative time — universal m/h/d abbreviations work in EN + DE.
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}