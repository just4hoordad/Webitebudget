import { motion } from "framer-motion";

const BAR_COLORS = ["#78a71b", "#FF3E7F", "#FFB020", "#7DD3FC", "#C084FC", "#34D399"];

// Mini arcade bar chart — chunky colorful bars grow up from the baseline on mount.
export default function BarChart({ data = [], max }) {
  const series = data.length ? data.slice(0, 6) : [0, 0, 0, 0, 0];
  const maxValue = max || Math.max(...series, 1);
  const w = 180, h = 68;
  const count = series.length;
  const gap = 8;
  const barW = Math.max(12, Math.floor((w - gap * (count - 1)) / count));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16 overflow-visible">
      {series.map((v, i) => {
        const bh = Math.max((v / maxValue) * (h - 8), 8);
        const fill = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <motion.rect
            key={i}
            x={i * (barW + gap)}
            y={h - bh}
            width={barW}
            height={bh}
            rx={6}
            fill={fill}
            stroke="#111827"
            strokeWidth={2}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.65, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          />
        );
      })}
    </svg>
  );
}