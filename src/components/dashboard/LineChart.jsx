import { motion } from "framer-motion";

// Mini arcade sparkline — shaded gradient area + bold stroke + outlined nodes.
export default function LineChart({ data = [] }) {
  if (data.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center text-xs font-heading font-bold text-[#111827]/50">
        {data.length === 1 ? `€${Number(data[0]).toFixed(0)} logged` : "Add 2+ plans for trend"}
      </div>
    );
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200, h = 68, pad = 8;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${d} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16 overflow-visible">
      <path d={areaD} fill="#78a71b" fillOpacity="0.22" />
      <motion.path
        d={d}
        fill="none"
        stroke="#111827"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.33, 1, 0.68, 1] }}
      />
      {pts.map((pt, idx) => (
        <circle
          key={idx}
          cx={pt[0]}
          cy={pt[1]}
          r={idx === pts.length - 1 ? 4.5 : 3}
          fill={idx === pts.length - 1 ? "#FF3E7F" : "#FFB020"}
          stroke="#111827"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}