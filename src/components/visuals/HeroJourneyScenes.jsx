import { motion } from "framer-motion";

export function ShopperCharacter({ mood = "happy", hat = false }) {
  return (
    <g>
      {/* Torso */}
      <path
        d="M54 128 C54 106, 94 106, 94 128 L98 158 L50 158 Z"
        fill="#FF3E7F"
        stroke="#111827"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Apron / bib detail */}
      <rect x="63" y="122" width="22" height="28" rx="6" fill="#FFFFFF" stroke="#111827" strokeWidth="2.6" />
      {/* Head */}
      <circle cx="74" cy="84" r="22" fill="#FDE68A" stroke="#111827" strokeWidth="3.2" />
      {/* Cheeks */}
      <circle cx="63" cy="88" r="3.2" fill="#FF8FB5" />
      <circle cx="85" cy="88" r="3.2" fill="#FF8FB5" />
      {/* Eyes */}
      <circle cx="67" cy="82" r="2.6" fill="#111827" />
      <circle cx="81" cy="82" r="2.6" fill="#111827" />
      {/* Smile */}
      {mood === "proud" ? (
        <path d="M66 91 Q74 100 82 91 Z" fill="#111827" />
      ) : (
        <path d="M67 91 Q74 97 81 91" fill="none" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
      )}
      {/* Hair / Cap or Chef Hat */}
      {hat ? (
        <g>
          <path
            d="M54 66 C48 54, 60 44, 68 48 C72 40, 84 42, 86 50 C96 48, 100 60, 92 67 Z"
            fill="#FFFFFF"
            stroke="#111827"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="55" y="63" width="38" height="7" rx="3" fill="#FFB020" stroke="#111827" strokeWidth="2.6" />
        </g>
      ) : (
        <path
          d="M53 76 C55 58, 93 58, 95 76 C86 69, 62 69, 53 76 Z"
          fill="#111827"
        />
      )}
    </g>
  );
}

export function SceneMoney() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      {/* Ground arcade shadow */}
      <ellipse cx="142" cy="158" rx="104" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />

      {/* Extended arm tossing euro coin/bill */}
      <motion.g
        animate={{ rotate: [-6, 8, -6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "90px", originY: "120px" }}
      >
        <path d="M90 120 Q112 112 124 98" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />
        <circle cx="126" cy="96" r="6" fill="#FDE68A" stroke="#111827" strokeWidth="2.6" />
      </motion.g>

      {/* Flying Euro Note + Coins */}
      <motion.g
        animate={{ x: [0, 34, 58], y: [0, -14, 4], rotate: [-8, 6, 0], scale: [0.95, 1.06, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="122" y="62" width="46" height="26" rx="6" fill="#78a71b" stroke="#111827" strokeWidth="2.8" />
        <text x="145" y="80" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="14" fontFamily="Space Grotesk, sans-serif">
          €45
        </text>
      </motion.g>

      <motion.g
        animate={{ y: [-5, 6, -5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
      >
        <circle cx="156" cy="44" r="12" fill="#FFB020" stroke="#111827" strokeWidth="2.8" />
        <text x="156" y="49" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="13" fontFamily="Space Grotesk, sans-serif">
          €
        </text>
      </motion.g>

      {/* BudgetBite Arcade Slot / Converter Machine */}
      <g>
        <rect x="178" y="54" width="76" height="104" rx="16" fill="#7DD3FC" stroke="#111827" strokeWidth="3.2" />
        <rect x="188" y="66" width="56" height="32" rx="8" fill="#111827" />
        <motion.text
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          x="216"
          y="87"
          textAnchor="middle"
          fill="#78a71b"
          fontWeight="900"
          fontSize="13"
          fontFamily="Space Grotesk, sans-serif"
        >
          AI DEAL
        </motion.text>
        {/* Coin slot */}
        <rect x="200" y="108" width="32" height="8" rx="4" fill="#FFB020" stroke="#111827" strokeWidth="2.4" />
        <rect x="192" y="126" width="48" height="18" rx="6" fill="#FFFFFF" stroke="#111827" strokeWidth="2.4" />
        <text x="216" y="139" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="10" fontFamily="Space Grotesk, sans-serif">
          BUDGET
        </text>
      </g>
    </svg>
  );
}

export function SceneList() {
  const rows = [
    { store: "Aldi", item: "Haferflocken", price: "€0.79", color: "#7DD3FC", y: 60 },
    { store: "Lidl", item: "Milbona Quark", price: "€0.95", color: "#FFB020", y: 88 },
    { store: "REWE", item: "Bio Brokkoli", price: "€1.29", color: "#FF8FB5", y: 116 },
  ];

  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="158" rx="104" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />
      <path d="M92 122 Q114 118 128 108" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />

      {/* Unrolling Smart Grocery Scroll */}
      <motion.g
        initial={{ y: -8, opacity: 0.85 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="124" y="28" width="134" height="128" rx="14" fill="#FFFFFF" stroke="#111827" strokeWidth="3.2" />
        {/* Receipt header */}
        <rect x="124" y="28" width="134" height="24" rx="11" fill="#78a71b" stroke="#111827" strokeWidth="3" />
        <text x="191" y="44" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="11" fontFamily="Space Grotesk, sans-serif">
          SMART GROCERY LIST
        </text>

        {rows.map((r, i) => (
          <motion.g
            key={r.store}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2, duration: 0.35 }}
          >
            <rect x="133" y={r.y} width="18" height="18" rx="5" fill="#78a71b" stroke="#111827" strokeWidth="2" />
            <path
              d={`M137 ${r.y + 9} l3 3 l6 -6`}
              fill="none"
              stroke="#111827"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="155" y={r.y + 1} width="32" height="16" rx="5" fill={r.color} stroke="#111827" strokeWidth="1.8" />
            <text x="171" y={r.y + 12} textAnchor="middle" fill="#111827" fontWeight="900" fontSize="8.5" fontFamily="Space Grotesk, sans-serif">
              {r.store}
            </text>
            <text x="249" y={r.y + 13} textAnchor="end" fill="#111827" fontWeight="900" fontSize="10.5" fontFamily="Space Grotesk, sans-serif">
              {r.price}
            </text>
          </motion.g>
        ))}

        {/* Total footer */}
        <line x1="134" y1="141" x2="248" y2="141" stroke="#111827" strokeWidth="2" strokeDasharray="4 3" />
        <text x="191" y="152" textAnchor="middle" fill="#FF3E7F" fontWeight="900" fontSize="9.5" fontFamily="Space Grotesk, sans-serif">
          ✓ WITHIN BUDGET
        </text>
      </motion.g>
    </svg>
  );
}

export function SceneFridge() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="144" cy="160" rx="108" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="happy" />

      {/* Grocery paper bag in front of shopper */}
      <g>
        <rect x="92" y="114" width="34" height="42" rx="6" fill="#FFB020" stroke="#111827" strokeWidth="2.8" />
        <path d="M98 114 C98 103, 120 103, 120 114" fill="none" stroke="#111827" strokeWidth="2.6" />
      </g>

      {/* Open Retro Arcade Fridge */}
      <g>
        {/* Main fridge cabinet */}
        <rect x="148" y="22" width="84" height="136" rx="14" fill="#FFFFFF" stroke="#111827" strokeWidth="3.2" />
        {/* Cool glowing interior */}
        <rect x="155" y="29" width="70" height="122" rx="9" fill="#E0F2FE" stroke="#111827" strokeWidth="2.2" />
        {/* Shelves */}
        <line x1="155" y1="68" x2="225" y2="68" stroke="#111827" strokeWidth="2.6" />
        <line x1="155" y1="108" x2="225" y2="108" stroke="#111827" strokeWidth="2.6" />

        {/* Open door swung to the right */}
        <path
          d="M232 26 L264 38 L264 148 L232 156 Z"
          fill="#7DD3FC"
          stroke="#111827"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <rect x="238" y="76" width="5" height="24" rx="2.5" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />

        {/* Shelf 1: Milk carton + Yogurt */}
        <rect x="163" y="40" width="18" height="26" rx="3" fill="#7DD3FC" stroke="#111827" strokeWidth="2.2" />
        <rect x="186" y="47" width="22" height="19" rx="4" fill="#FF8FB5" stroke="#111827" strokeWidth="2.2" />

        {/* Shelf 2: Eggs + Oats */}
        <rect x="162" y="82" width="28" height="24" rx="4" fill="#FDE68A" stroke="#111827" strokeWidth="2.2" />
        <rect x="195" y="78" width="22" height="28" rx="4" fill="#FFB020" stroke="#111827" strokeWidth="2.2" />

        {/* Shelf 3: Veggies */}
        <circle cx="174" cy="132" r="11" fill="#78a71b" stroke="#111827" strokeWidth="2.2" />
        <circle cx="198" cy="134" r="9" fill="#FF3E7F" stroke="#111827" strokeWidth="2.2" />
      </g>

      {/* Animated hopping broccoli / apple from bag into fridge */}
      <motion.g
        animate={{
          x: [0, 32, 62],
          y: [0, -34, -14],
          rotate: [0, 18, 0],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="112" cy="104" r="11" fill="#78a71b" stroke="#111827" strokeWidth="2.6" />
        <path d="M112 93 L115 88" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

export function SceneMeals() {
  return (
    <svg viewBox="0 0 280 175" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="142" cy="160" rx="112" ry="9" fill="#111827" opacity="0.12" />

      <ShopperCharacter mood="proud" hat />

      {/* Kitchen counter */}
      <rect x="112" y="122" width="154" height="36" rx="10" fill="#FFB020" stroke="#111827" strokeWidth="3.2" />
      <line x1="112" y1="132" x2="266" y2="132" stroke="#111827" strokeWidth="2.4" />

      {/* 3 Plated Meals: Breakfast, Lunch, Dinner */}
      {[
        { cx: 140, fill: "#FF8FB5", food: "#FDE68A", label: "B" },
        { cx: 188, fill: "#78a71b", food: "#78a71b", label: "L" },
        { cx: 236, fill: "#7DD3FC", food: "#FF3E7F", label: "D" },
      ].map((plate, i) => (
        <g key={plate.label}>
          {/* Steam wisps */}
          <motion.path
            d={`M${plate.cx - 4} 94 Q${plate.cx - 8} 84 ${plate.cx - 3} 74`}
            fill="none"
            stroke="#111827"
            strokeWidth="2.2"
            strokeLinecap="round"
            animate={{ y: [2, -7, -12], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, delay: i * 0.3 }}
          />
          <motion.path
            d={`M${plate.cx + 5} 96 Q${plate.cx + 9} 86 ${plate.cx + 4} 76`}
            fill="none"
            stroke="#111827"
            strokeWidth="2.2"
            strokeLinecap="round"
            animate={{ y: [2, -7, -12], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, delay: i * 0.3 + 0.25 }}
          />

          {/* Bowl / Plate */}
          <motion.g
            initial={{ scale: 0.85 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
          >
            <ellipse cx={plate.cx} cy="118" rx="21" ry="7" fill="#FFFFFF" stroke="#111827" strokeWidth="2.6" />
            <path
              d={`M${plate.cx - 17} 115 C${plate.cx - 15} 96, ${plate.cx + 15} 96, ${plate.cx + 17} 115 Z`}
              fill={plate.food}
              stroke="#111827"
              strokeWidth="2.6"
            />
            <circle cx={plate.cx - 5} cy="107" r="3" fill="#FFFFFF" stroke="#111827" strokeWidth="1.6" />
            <circle cx={plate.cx + 6} cy="109" r="3.2" fill="#FFB020" stroke="#111827" strokeWidth="1.6" />
          </motion.g>
        </g>
      ))}

      {/* Floating Celebration Star */}
      <motion.g
        animate={{ y: [-3, 3, -3], rotate: [-4, 4, -4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="144" y="34" width="96" height="26" rx="13" fill="#78a71b" stroke="#111827" strokeWidth="2.6" />
        <text x="192" y="51" textAnchor="middle" fill="#111827" fontWeight="900" fontSize="10.5" fontFamily="Space Grotesk, sans-serif">
          ★ 7 DAYS READY ★
        </text>
      </motion.g>
    </svg>
  );
}