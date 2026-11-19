import { motion } from "framer-motion";

const BAR_COLORS = ["#78a71b", "#FF3E7F", "#FFB020", "#7DD3FC", "#C084FC", "#34D399"];

// Responsive arcade bar chart — CSS fl. Bars grow up from the baseline on mount.
export default function BarChart({ data = [], max }) {
  const series = data.length ? data.slice(0, 6) : [0, 0, 0, 0, 0];
  const maxValue = max || Math.max(...series, 1);

  return (
    <div className="w-full">
      <div className="flex items-end justify-center gap-2 sm:gap-3 h-28 sm:h-36 px-1">
        {series.map((v, i) => {
          const pct = Math.max((v / maxValue) * 100, v > 0 ? 9 : 4);
          const fill = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-heading font-black tabular-nums text-[#111827] leading-none h-4">
                {v > 0 ? v : ""}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.65, delay: i * 0.06, ease: [0.33, 1, 0.68, 1] }}
                className="w-full max-w-[46px] rounded-t-2xl border-[2.5px] border-[#111827] relative"
                style={{ backgroundColor: fill, minHeight: 10 }}
              >
                <span className="absolute inset-x-0 top-1.5 mx-auto h-1.5 w-2/3 rounded-full bg-white/45" />
              </motion.div>
            </div>
          );
        })}
      </div>
      {/* baseline */}
      <div className="h-[3px] w-full bg-[#111827] rounded-full" />
    </div>
  );
}