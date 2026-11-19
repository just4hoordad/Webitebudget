import { motion } from "framer-motion";
import { ShopperCharacter } from "./HeroJourneyScenes";

export function BudgetSceneCap() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="108" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />
      <path d="M92 120 Q112 114 126 102" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />

      {/* Budget & Calorie Control Board */}
      <g>
        <rect x="122" y="28" width="142" height="126" rx="16" fill="#FFFFFF" stroke="#111827" strokeWidth="3.2" />
        <rect x="122" y="28" width="142" height="24" rx="13" fill="#FF3E7F" stroke="#111827" strokeWidth="3" />
        <text x="193" y="44" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="10.5" fontFamily="Space Grotesk, sans-serif">
          BUDGET &amp; KCAL DIAL
        </text>

        {/* Budget Slider Track */}
        <text x="134" y="70" fill="#111827" fontWeight="900" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          SPEND CAP
        </text>
        <rect x="134" y="76" width="118" height="10" rx="5" fill="#E5E7EB" stroke="#111827" strokeWidth="2" />
        <motion.rect
          x="134"
          y="76"
          height="10"
          rx="5"
          fill="#78a71b"
          stroke="#111827"
          strokeWidth="2"
          animate={{ width: [52, 86, 74] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.g
          animate={{ x: [52, 86, 74] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="134" cy="81" r="9" fill="#FFB020" stroke="#111827" strokeWidth="2.5" />
          <rect x="116" y="56" width="36" height="16" rx="6" fill="#111827" />
          <text x="134" y="67" textAnchor="middle" fill="#F3F8E6" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">
            €45
          </text>
        </motion.g>

        {/* Calorie Target Row */}
        <rect x="134" y="98" width="118" height="22" rx="7" fill="#FFFBEB" stroke="#111827" strokeWidth="2" />
        <text x="142" y="113" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">
          🔥 2,200 kcal / day
        </text>

        {/* Store chips */}
        <rect x="134" y="127" width="36" height="17" rx="6" fill="#7DD3FC" stroke="#111827" strokeWidth="1.8" />
        <text x="152" y="139" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">Aldi</text>
        <rect x="175" y="127" width="36" height="17" rx="6" fill="#FFB020" stroke="#111827" strokeWidth="1.8" />
        <text x="193" y="139" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">Lidl</text>
        <rect x="216" y="127" width="36" height="17" rx="6" fill="#FF8FB5" stroke="#111827" strokeWidth="1.8" />
        <text x="234" y="139" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">REWE</text>
      </g>
    </svg>
  );
}

export function BudgetSceneScan() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="112" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />

      {/* Shopping Basket in front of shopper */}
      <g>
        <path d="M88 122 L126 122 L121 154 L93 154 Z" fill="#FFB020" stroke="#111827" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M95 122 C95 108, 119 108, 119 122" fill="none" stroke="#111827" strokeWidth="2.6" />
      </g>

      {/* Supermarket Shelf Unit */}
      <g>
        <rect x="142" y="24" width="122" height="132" rx="12" fill="#FFFFFF" stroke="#111827" strokeWidth="3.2" />
        <line x1="142" y1="68" x2="264" y2="68" stroke="#111827" strokeWidth="3" />
        <line x1="142" y1="112" x2="264" y2="112" stroke="#111827" strokeWidth="3" />

        {/* Shelf 1 Packs: Milk + Quark */}
        <rect x="152" y="36" width="22" height="30" rx="4" fill="#7DD3FC" stroke="#111827" strokeWidth="2.2" />
        <rect x="180" y="42" width="30" height="24" rx="5" fill="#FF8FB5" stroke="#111827" strokeWidth="2.2" />
        <rect x="218" y="40" width="36" height="20" rx="6" fill="#78a71b" stroke="#111827" strokeWidth="2" />
        <text x="236" y="54" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">€0.95</text>

        {/* Shelf 2 Packs: Oats + Eggs */}
        <rect x="152" y="80" width="26" height="30" rx="4" fill="#FFB020" stroke="#111827" strokeWidth="2.2" />
        <rect x="184" y="86" width="28" height="24" rx="4" fill="#FDE68A" stroke="#111827" strokeWidth="2.2" />
        <rect x="218" y="84" width="36" height="20" rx="6" fill="#78a71b" stroke="#111827" strokeWidth="2" />
        <text x="236" y="98" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">€0.79</text>

        {/* Bottom Total Under-Cap Bar */}
        <rect x="150" y="122" width="106" height="24" rx="7" fill="#111827" />
        <text x="203" y="138" textAnchor="middle" fill="#78a71b" fontWeight="900" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          €43.80 / €45 ✓
        </text>

        {/* Animated AI Price Scanner Beam */}
        <motion.rect
          x="145"
          width="116"
          height="8"
          rx="4"
          fill="#78a71b"
          opacity="0.45"
          animate={{ y: [30, 102, 30] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>

      {/* Pack hopping from shelf into basket */}
      <motion.g
        animate={{ x: [0, -34, -56], y: [0, -22, 26], rotate: [0, -14, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="154" y="78" width="20" height="24" rx="4" fill="#78a71b" stroke="#111827" strokeWidth="2.4" />
      </motion.g>
    </svg>
  );
}

export function BudgetSceneCalendar() {
  const days = ["M", "T", "W", "T", "F"];
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="112" ry="9" fill="#111827" opacity="0.12" />

      {/* Stocked Grocery Bag on Left */}
      <g>
        <rect x="22" y="72" width="58" height="78" rx="10" fill="#FFB020" stroke="#111827" strokeWidth="3" />
        <circle cx="38" cy="68" r="11" fill="#78a71b" stroke="#111827" strokeWidth="2.4" />
        <rect x="48" y="54" width="22" height="24" rx="4" fill="#7DD3FC" stroke="#111827" strokeWidth="2.4" />
        <text x="51" y="116" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">
          14 PACKS
        </text>
      </g>

      {/* Flying Food Arrows into Meal Plan */}
      <motion.g
        animate={{ x: [0, 38, 66], y: [0, -14, 0], scale: [0.9, 1.1, 0.85] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="84" cy="92" r="11" fill="#FF3E7F" stroke="#111827" strokeWidth="2.5" />
        <text x="84" y="96" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="10" fontFamily="Space Grotesk, sans-serif">🍲</text>
      </motion.g>

      {/* 7-Day Meal Calendar Grid on Right */}
      <g>
        <rect x="114" y="24" width="150" height="130" rx="14" fill="#FFFFFF" stroke="#111827" strokeWidth="3.2" />
        <rect x="114" y="24" width="150" height="24" rx="11" fill="#C084FC" stroke="#111827" strokeWidth="3" />
        <text x="189" y="40" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="10.5" fontFamily="Space Grotesk, sans-serif">
          AUTO 7-DAY MEAL PLAN
        </text>

        {days.map((d, col) => {
          const x = 124 + col * 27;
          return (
            <g key={`${d}-${col}`}>
              <text x={x + 10} y="62" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9" fontFamily="Space Grotesk, sans-serif">
                {d}
              </text>
              {[0, 1, 2].map((row) => {
                const y = 68 + row * 24;
                const colors = ["#FDE68A", "#78a71b", "#7DD3FC"];
                return (
                  <motion.rect
                    key={row}
                    x={x}
                    y={y}
                    width="21"
                    height="18"
                    rx="5"
                    fill={colors[row]}
                    stroke="#111827"
                    strokeWidth="1.8"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.92, 1.04, 0.92] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: (col + row) * 0.12 }}
                  />
                );
              })}
            </g>
          );
        })}

        <text x="189" y="148" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">
          100% OF GROCERIES USED UP ✓
        </text>
      </g>
    </svg>
  );
}

export function BudgetSceneDeliverable() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="112" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="proud" hat />

      {/* Counter with 3 Hot Meals */}
      <rect x="112" y="122" width="154" height="36" rx="10" fill="#78a71b" stroke="#111827" strokeWidth="3.2" />
      {[140, 186, 232].map((cx, i) => (
        <g key={cx}>
          <motion.path
            d={`M${cx} 96 Q${cx - 5} 85 ${cx} 76`}
            fill="none"
            stroke="#111827"
            strokeWidth="2.2"
            strokeLinecap="round"
            animate={{ y: [2, -7, -11], opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.28 }}
          />
          <ellipse cx={cx} cy="118" rx="19" ry="6.5" fill="#FFFFFF" stroke="#111827" strokeWidth="2.4" />
          <path
            d={`M${cx - 15} 115 C${cx - 13} 98, ${cx + 13} 98, ${cx + 15} 115 Z`}
            fill={["#FFB020", "#FF3E7F", "#7DD3FC"][i]}
            stroke="#111827"
            strokeWidth="2.4"
          />
        </g>
      ))}

      {/* Macro Ring + PDF Export Badge */}
      <motion.g
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="118" y="28" width="76" height="34" rx="10" fill="#FFFFFF" stroke="#111827" strokeWidth="2.6" />
        <circle cx="136" cy="45" r="10" fill="none" stroke="#78a71b" strokeWidth="4.5" />
        <path d="M136 35 A10 10 0 0 1 146 45" fill="none" stroke="#FF3E7F" strokeWidth="4.5" />
        <text x="152" y="43" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">MACROS</text>
        <text x="152" y="53" fill="#78a71b" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">VERIFIED</text>

        <rect x="202" y="30" width="58" height="30" rx="10" fill="#FFB020" stroke="#111827" strokeWidth="2.6" />
        <text x="231" y="49" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          📄 PDF
        </text>
      </motion.g>
    </svg>
  );
}