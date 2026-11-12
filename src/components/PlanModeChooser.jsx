import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { modeText } from "@/lib/translations_modes";
import LastResultButton from "@/components/LastResultButton";

const COIN_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/2fe49be67_generated_51cb0d4d.jpg";
const DUMBBELL_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/5ee0909f8_generated_7f9f3876.jpg";

export default function PlanModeChooser() {
  const { currentLanguage } = useLanguage();
  const m = modeText(currentLanguage?.code);

  return (
    <>
      <h2 className="bba-h2">{m.chooseHeading}</h2>

      <Link to="/budget" className="bba-t bba-cart-t bba-cr1">
        <img src={COIN_IMG} alt="Glossy 3D coin" />
        <h3>{m.budgetTitle}</h3>
        <p>{m.budgetDesc}</p>
        <span className="bba-pro">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 14a5 5 0 1112 0v6H6zM8 20h8M9 6a3 3 0 016 0" />
          </svg>
          {m.proNote}
        </span>
        <span className="bba-go">
          {m.budgetCta}{" "}
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      <Link to="/plan-builder" className="bba-t bba-cart-t bba-cr2">
        <img src={DUMBBELL_IMG} alt="Glossy 3D dumbbell and fork" />
        <h3>{m.freeTitle}</h3>
        <p>{m.freeDesc}</p>
        <span className="bba-pro">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 14a5 5 0 1112 0v6H6zM8 20h8M9 6a3 3 0 016 0" />
          </svg>
          {m.proNote}
        </span>
        <span className="bba-go">
          {m.freeCta}{" "}
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      <div className="bba-t bba-dock">
        <LastResultButton kind="budget" alwaysShow />
        <LastResultButton kind="plan" alwaysShow />
      </div>
    </>
  );
}