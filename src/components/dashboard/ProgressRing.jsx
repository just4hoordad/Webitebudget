import { useCountUp } from "./useCountUp";

// Animated SVG progress ring. `percent` fills from 0 → target on mount.
export default function ProgressRing({ percent = 0, size = 72, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const animated = useCountUp(percent, 1200);
  const offset = circumference - (animated / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-heading font-semibold text-foreground">
        {Math.round(animated)}%
      </span>
    </div>
  );
}