import { motion } from "framer-motion";

// Mini sparkline — line draws in on mount, endpoints highlighted.
export default function LineChart({ data = [] }) {
  if (data.length < 2) return <div className="h-16" />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200, h = 64, pad = 6;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16 overflow-visible">
      <motion.path
        d={d} fill="none" stroke="currentColor" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" className="text-primary"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOutCubic" }}
      />
      <circle cx={pts[0][0]} cy={pts[0][1]} r={2.5} fill="currentColor" className="text-primary" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="currentColor" className="text-primary" />
    </svg>
  );
}