import { motion } from "framer-motion";
import { ShopperCharacter } from "./HeroJourneyScenes";

export function PlanScenePickMeals() {
  const dishes = [
    { label: "🥞 Oats", y: 60, bg: "#FDE68A" },
    { label: "🍝 Pasta", y: 88, bg: "#FF8FB5" },
    { label: "🍛 Curry", y: 116, bg: "#78a71b" },
  ];

  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="110" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />
      <motion.path
        d="M92 118 Q114 106 126 92"
        fill="none"
        stroke="#111827"
        strokeWidth="6"
        strokeLinecap="round"
        animate={{ rotate: [-4, 6, -4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Weekly Meal Board where user picks dishes FIRST */}
      <g>
        <rect x="124" y="24" width="140" height="130" rx="14" fill="#FFFFFF" stroke="#111827" strokeWidth="3.2" />
        <rect x="124" y="24" width="140" height="24" rx="11" fill="#FFB020" stroke="#111827" strokeWidth="3" />
        <text x="194" y="40" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="10.5" fontFamily="Space Grotesk, sans-serif">
          YOUR CHOSEN MEALS
        </text>

        {dishes.map((d, i) => (
          <motion.g
            key={d.label}
            initial={{ x: -16, opacity: 0.7 }}
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
          >
            <rect x="134" y={d.y} width="120" height="22" rx="7" fill={d.bg} stroke="#111827" strokeWidth="2.2" />
            <text x="144" y={d.y + 15} fill="#111827" fontWeight="900" fontSize="10.5" fontFamily="Space Grotesk, sans-serif">
              {d.label}
            </text>
            <text x="244" y={d.y + 15} textAnchor="end" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">
              Day {i + 1}
            </text>
          </motion.g>
        ))}
      </g>
    </svg>
  );
}

export function PlanSceneMerge() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="114" ry="9" fill="#111827" opacity="0.12" />

      {/* Left: Split small portions from different meals */}
      <motion.g
        animate={{ x: [0, 26, 26], opacity: [1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="18" y="42" width="58" height="24" rx="7" fill="#7DD3FC" stroke="#111827" strokeWidth="2.2" />
        <text x="47" y="58" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9" fontFamily="Space Grotesk, sans-serif">½ Milk</text>

        <rect x="18" y="76" width="58" height="24" rx="7" fill="#7DD3FC" stroke="#111827" strokeWidth="2.2" />
        <text x="47" y="92" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9" fontFamily="Space Grotesk, sans-serif">½ Milk</text>

        <rect x="18" y="110" width="58" height="24" rx="7" fill="#FFB020" stroke="#111827" strokeWidth="2.2" />
        <text x="47" y="126" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9" fontFamily="Space Grotesk, sans-serif">Oats ×3</text>
      </motion.g>

      {/* Center: Smart AI Combiner Funnel */}
      <g>
        <path
          d="M98 36 L166 56 L166 120 L98 140 Z"
          fill="#C084FC"
          stroke="#111827"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <rect x="108" y="74" width="48" height="28" rx="8" fill="#111827" />
        <text x="132" y="92" textAnchor="middle" fill="#78a71b" fontWeight="900" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          MERGE
        </text>
      </g>

      {/* Right: Whole Supermarket Packs Popping Out (Zero Waste!) */}
      <motion.g
        animate={{ x: [-10, 8, 8], scale: [0.92, 1.03, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="182" y="44" width="80" height="36" rx="9" fill="#FFFFFF" stroke="#111827" strokeWidth="2.8" />
        <rect x="188" y="50" width="16" height="24" rx="3" fill="#7DD3FC" stroke="#111827" strokeWidth="2" />
        <text x="210" y="61" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">1L Milk</text>
        <text x="210" y="72" fill="#78a71b" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">1 FULL PACK</text>

        <rect x="182" y="90" width="80" height="36" rx="9" fill="#FFFFFF" stroke="#111827" strokeWidth="2.8" />
        <rect x="188" y="96" width="16" height="24" rx="3" fill="#FFB020" stroke="#111827" strokeWidth="2" />
        <text x="210" y="107" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">500g Oats</text>
        <text x="210" y="118" fill="#FF3E7F" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">0% WASTE ✓</text>
      </motion.g>
    </svg>
  );
}

export function PlanSceneCheapestBag() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="112" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />

      {/* Conveyor Belt */}
      <rect x="114" y="124" width="150" height="16" rx="8" fill="#111827" />
      <circle cx="126" cy="132" r="4" fill="#F3F8E6" />
      <circle cx="188" cy="132" r="4" fill="#F3F8E6" />
      <circle cx="250" cy="132" r="4" fill="#F3F8E6" />

      {/* Rolling Priced Packs */}
      <motion.g
        animate={{ x: [0, 22, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="122" y="84" width="34" height="38" rx="6" fill="#7DD3FC" stroke="#111827" strokeWidth="2.5" />
        <rect x="118" y="66" width="42" height="16" rx="5" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
        <text x="139" y="77" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">Aldi €0.79</text>

        <rect x="168" y="90" width="34" height="32" rx="6" fill="#FF8FB5" stroke="#111827" strokeWidth="2.5" />
        <rect x="164" y="72" width="42" height="16" rx="5" fill="#FFB020" stroke="#111827" strokeWidth="2" />
        <text x="185" y="83" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">Lidl €0.95</text>
      </motion.g>

      {/* One Consolidated Grocery Bag at End of Belt */}
      <g>
        <rect x="218" y="72" width="46" height="52" rx="8" fill="#78a71b" stroke="#111827" strokeWidth="2.8" />
        <path d="M228 72 C228 58, 254 58, 254 72" fill="none" stroke="#111827" strokeWidth="2.6" />
        <text x="241" y="102" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">1 TRIP</text>
      </g>
    </svg>
  );
}

export function PlanScenePrepCook() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="112" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="proud" hat />

      {/* Open Step-by-Step Prep & Recipe Book */}
      <motion.g
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="116" y="34" width="84" height="68" rx="10" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
        <line x1="158" y1="36" x2="158" y2="100" stroke="#111827" strokeWidth="2.2" />
        <text x="137" y="52" textAnchor="middle" fill="#FF3E7F" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">PREP</text>
        <line x1="124" y1="62" x2="150" y2="62" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="124" y1="72" x2="148" y2="72" stroke="#78a71b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="124" y1="82" x2="146" y2="82" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />

        <text x="179" y="52" textAnchor="middle" fill="#78a71b" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">RECIPE</text>
        <rect x="166" y="60" width="26" height="26" rx="6" fill="#FDE68A" stroke="#111827" strokeWidth="2" />
        <path d="M173 73 l4 4 l8 -8" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      {/* Steaming Pot + Ready Bowls on Kitchen Counter */}
      <rect x="114" y="122" width="150" height="34" rx="10" fill="#FFB020" stroke="#111827" strokeWidth="3" />
      <rect x="208" y="92" width="44" height="30" rx="7" fill="#FF3E7F" stroke="#111827" strokeWidth="2.8" />
      <rect x="204" y="86" width="52" height="7" rx="3.5" fill="#111827" />
      <motion.path
        d="M222 80 Q218 70 223 60 M238 80 Q234 70 239 60"
        fill="none"
        stroke="#111827"
        strokeWidth="2.4"
        strokeLinecap="round"
        animate={{ y: [2, -7, -11], opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </svg>
  );
}