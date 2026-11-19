import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Responsive arcade sparkline. Measures its container so strokes & nodes never distort.
// Shaded gradient area + bold stroke + outlined nodes + last-value badge.
export default function LineChart({ data = [] }) {
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setDims({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (data.length < 2) {
    return (
      <div ref={wrapRef} className="w-full h-28 sm:h-36 flex items-center justify-center text-xs font-heading font-bold text-[#111827]/50 text-center px-3">
        {data.length === 1 ? `€${Number(data[0]).toFixed(0)} logged` : "Add 2+ plans for trend"}
      </div>
    );
  }

  const { w, h } = dims;
  if (w === 0 || h === 0) {
    return <div ref={wrapRef} className="w-full h-28 sm:h-36" />;
  }

  const padX = 16;
  const padTop = 22;
  const padBottom = 16;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const innerH = h - padTop - padBottom;

  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (w - 2 * padX);
    const y = padTop + (1 - (v - min) / range) * innerH;
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaD = `${d} L${pts[pts.length - 1][0].toFixed(1)},${h - padBottom} L${pts[0][0].toFixed(1)},${h - padBottom} Z`;

  const last = pts[pts.length - 1];
  const lastVal = Number(data[data.length - 1]);
  const labelW = 42;
  const lx = Math.min(Math.max(last[0], labelW / 2 + 4), w - labelW / 2 - 4);

  return (
    <div ref={wrapRef} className="w-full h-28 sm:h-36 relative">
      <svg width={w} height={h} className="overflow-visible block">
        {/* horizontal grid */}
        {[0, 0.5, 1].map((g, i) => {
          const gy = padTop + g * innerH;
          return (
            <line
              key={i}
              x1={padX} x2={w - padX}
              y1={gy} y2={gy}
              stroke="#111827" strokeOpacity={0.08} strokeWidth={1}
              strokeDasharray={i === 1 ? "0" : "3 4"}
            />
          );
        })}

        <defs>
          <linearGradient id="bb-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78a71b" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#78a71b" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#bb-line-fill)" />

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
            r={idx === pts.length - 1 ? 5 : 3.5}
            fill={idx === pts.length - 1 ? "#FF3E7F" : "#FFB020"}
            stroke="#111827"
            strokeWidth={2}
          />
        ))}

        {/* last value badge */}
        <g>
          <rect
            x={lx - labelW / 2}
            y={Math.max(last[1] - 30, 2)}
            width={labelW}
            height={19}
            rx={7}
            fill="#111827"
            stroke="#111827"
            strokeWidth={1.5}
          />
          <text
            x={lx}
            y={Math.max(last[1] - 30, 2) + 13}
            textAnchor="middle"
            fontSize="11"
            fontWeight="800"
            fill="#F3F8E6"
            fontFamily="'Space Grotesk', Arial, sans-serif"
          >
            €{lastVal.toFixed(0)}
          </text>
          <line
            x1={last[0]} x2={lx}
            y1={last[1]} y2={Math.max(last[1] - 11, 21)}
            stroke="#111827" strokeWidth={1.5}
          />
        </g>
      </svg>
    </div>
  );
}