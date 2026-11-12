export default function StoreBadge({ store }) {
  if (!store) return null;

  // Brand colours for the most common German supermarkets / drugstores, so
  // each store reads like a mini logo at a glance.
  const BRAND = {
    aldi: { bg: "#16407A", text: "#ffffff", label: "ALDI" },
    lidl: { bg: "#0050AA", text: "#ffd200", label: "LIDL" },
    rewe: { bg: "#CC071E", text: "#ffffff", label: "REWE" },
    edeka: { bg: "#F39200", text: "#1a1a1a", label: "EDEKA" },
    penny: { bg: "#CC0C2E", text: "#ffffff", label: "PENNY" },
    netto: { bg: "#E2001A", text: "#ffffff", label: "NETTO" },
    norma: { bg: "#E2001A", text: "#ffffff", label: "Norma" },
    dm: { bg: "#E10604", text: "#ffffff", label: "dm" },
    rossmann: { bg: "#C8102E", text: "#ffffff", label: "ROSSMANN" },
    kaufland: { bg: "#E2001A", text: "#ffffff", label: "KAUFLAND" },
    tegut: { bg: "#009639", text: "#ffffff", label: "tegut" },
    famila: { bg: "#F39200", text: "#ffffff", label: "famila" },
    budni: { bg: "#009639", text: "#ffffff", label: "BUDNI" },
    mueller: { bg: "#E2001A", text: "#ffffff", label: "Müller" },
    denn: { bg: "#009639", text: "#ffffff", label: "denn's" },
  };

  const s = String(store).toLowerCase();
  const found = Object.entries(BRAND).find(([k]) => s.includes(k));
  const style = found ? found[1] : { bg: "#6b7280", text: "#ffffff", label: store };

  return (
    <span
      className="inline-flex items-center rounded-lg border-[1.5px] border-[#111827] px-2 py-0.5 text-[10px] font-heading font-black uppercase tracking-wider leading-none shrink-0 shadow-[1.5px_1.5px_0_#111827]"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}