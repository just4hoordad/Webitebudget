import { motion } from "framer-motion";

// Mini bar chart — bars grow up from the baseline on mount (staggered).
export default function BarChart({ data = [], max }) {
  if (!data.length) data = [0, 0, 0, 0, 0];
  const maxValue = max || Math.max(...data, 1);
  const w = 150, h = 64, barW = 6, gap = 5;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16">
      {data.map((v, i) => {
        const bh = Math.max((v / maxValue) * h, 2);
        return (
          <motion.rect
            key={i}
            x={i * (barW + gap)}
            y={h - bh}
            width={barW}
            height={bh}
            rx={1}
            fill="currentColor"
            className="text-primary"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.33, 1, 0.68, 1] }}
            style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
          />
        );
      })}
    </svg>
  );
}