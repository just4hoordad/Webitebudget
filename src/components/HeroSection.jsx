import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";

const CART_IMG = "https://media.base44.com/images/public/69d66c6fdbba74a7439efa90/bb9cbb17d_generated_50e6f515.jpg";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <div className="bba-t bba-hero" aria-label="BudgetBite hero">
      <h1>
        {t("heroHeadline") || "Eat well on"}{" "}
        <span>{t("heroHeadline2") || "any budget"}</span>
      </h1>
      <p className="bba-lead">
        {t("heroLead") ||
          "Smart meal plans and grocery lists based on real German supermarket prices. Save money, eat healthy, stress less."}
      </p>
      <div className="bba-acts">
        <Link to="/budget" className="bba-btn bba-b1">
          {t("startPlanning") || "Start planning"}{" "}
          <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <Link to="/community" className="bba-btn bba-b2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14.5c2.2.7 3.5 2.7 3.5 5.5" />
          </svg>
          {t("browseCommunity") || "Browse community"}
        </Link>
      </div>
      <div className="bba-vis" aria-label="Supported stores">
        <div className="bba-wheel">
          <span className="bba-s1">Aldi</span>
          <span className="bba-s2">Lidl</span>
          <span className="bba-s3">REWE</span>
          <span className="bba-s4">Edeka</span>
          <span className="bba-s5">Penny</span>
          <span className="bba-s6">Netto</span>
        </div>
        <img
          className="bba-cart"
          src={CART_IMG}
          alt="Miniature shopping cart racing through fresh vegetables"
        />
      </div>
    </div>
  );
}