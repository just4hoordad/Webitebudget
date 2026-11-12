import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { ArrowRight, Users } from "lucide-react";

const HERO_CSS = `
@keyframes bbh-breathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.06); opacity: 1; }
}
@keyframes bbh-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: none; }
}

.bbh-hero {
  --bbh-lime: #ECF7B3;
  --bbh-deep: #0B2D25;
  --bbh-ink:  #26473C;
  --bbh-ring: #E8F4B8;
  --bbh-pale: #F1F7DA;

  position: relative;
  width: 100%;
  isolation: isolate;
  box-sizing: border-box;
  display: flex;
  min-height: clamp(460px, 72vh, 600px);
  background: var(--bbh-deep);
  container-type: inline-size;
  container-name: bbh;
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}
.bbh-hero *, .bh-hero *::before, .bh-hero *::after { box-sizing: border-box; }

.bbh-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(22% 16% at 50% 64%,
      rgba(253, 253, 199, 0.85) 0%,
      rgba(233, 246, 176, 0.30) 55%,
      rgba(233, 246, 176, 0) 100%),
    linear-gradient(180deg,
      #ECF7B2 0%, #EEF7BE 20%, #F0F7CD 40%,
      #EFF6D4 50%, #E6EDCC 60%, #C8D3B5 70%,
      #92A18A 80%, #435E4F 88%, #15342C 95%, #0C2D26 100%);
}

.bbh-rings {
  position: absolute;
  left: 50%;
  top: 64%;
  width: 148%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%) perspective(680px) rotateX(61deg);
  transform-origin: 50% 50%;
  -webkit-mask-image: radial-gradient(closest-side, #000 56%, rgba(0,0,0,0) 100%);
          mask-image: radial-gradient(closest-side, #000 56%, rgba(0,0,0,0) 100%);
}
.bbh-rings::before {
  content: "";
  position: absolute;
  inset: -25%;
  background: repeating-radial-gradient(circle at 50% 50%,
    rgba(232, 244, 184, 0)    0 12.5px,
    rgba(232, 244, 184, 0.5)  13px 14px,
    rgba(232, 244, 184, 0)   14.5px 15px);
}
@media (prefers-reduced-motion: no-preference) {
  .bbh-rings::before { animation: bbh-breathe 7s ease-in-out infinite; }
}

.bbh-frame {
  position: relative;
  z-index: 2;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: clamp(24px, 4cqi, 44px);
  padding: clamp(32px, 6cqi, 64px) clamp(20px, 5cqi, 80px) clamp(20px, 3cqi, 28px);
}

.bbh-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: clamp(16px, 2.5cqi, 26px);
  width: 100%;
}

.bbh-title {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  color: var(--bbh-ink);
  font-size: clamp(1.9rem, 0.9rem + 5.6cqi, 3.8rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  max-width: 16em;
}
.bbh-br { display: none; }
@container bbh (width >= 680px) { .bbh-br { display: inline; } }

.bbh-lead {
  margin: 0;
  max-width: 60ch;
  color: var(--bbh-ink);
  font-size: clamp(0.875rem, 0.8rem + 0.4cqi, 1.05rem);
  line-height: 1.6;
  opacity: 0.88;
}

.bbh-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(12px, 1.6cqi, 18px);
  margin-top: clamp(4px, 1cqi, 10px);
}

.bbh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 28px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}
.bbh-btn:hover { transform: translateY(-1px); }
.bbh-btn--solid {
  background: var(--bbh-ink);
  color: var(--bbh-pale);
  border: 1px solid var(--bbh-ink);
}
.bbh-btn--solid:hover, .bbh-btn--solid:focus-visible {
  background: transparent;
  color: var(--bbh-ink);
}
.bbh-btn--ghost {
  background: transparent;
  color: var(--bbh-ink);
  border: 1px solid var(--bbh-ink);
}
.bbh-btn--ghost:hover, .bbh-btn--ghost:focus-visible {
  background: var(--bbh-ink);
  color: var(--bbh-pale);
}
.bbh-btn:focus-visible { outline: 2px solid var(--bbh-ink); outline-offset: 2px; }

.bbh-logos {
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 3cqi, 36px);
  color: #ffffff;
  padding-top: clamp(16px, 3cqi, 28px);
  border-top: 1px solid rgba(255,255,255,0.12);
}
.bbh-store {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: clamp(0.95rem, 0.85rem + 0.4cqi, 1.15rem);
  letter-spacing: 0.02em;
  opacity: 0.92;
}

@media (prefers-reduced-motion: no-preference) {
  .bbh-title   { animation: bbh-rise 0.7s 0.00s cubic-bezier(0.2,0.7,0.2,1) both; }
  .bbh-lead    { animation: bbh-rise 0.7s 0.10s cubic-bezier(0.2,0.7,0.2,1) both; }
  .bbh-actions { animation: bbh-rise 0.7s 0.18s cubic-bezier(0.2,0.7,0.2,1) both; }
  .bbh-logos   { animation: bbh-rise 0.7s 0.28s cubic-bezier(0.2,0.7,0.2,1) both; }
}
`;

export default function HeroSection() {
  const { t } = useLanguage();
  return (
    <>
      <style>{HERO_CSS}</style>
      <section className="bbh-hero rounded-3xl border border-border" aria-label="BudgetBite hero">
        <div className="bbh-bg" aria-hidden="true">
          <div className="bbh-rings"></div>
        </div>
        <div className="bbh-frame">
          <div className="bbh-inner">
            <h1 className="bbh-title">
              {t("heroHeadline") || "Eat well on"}
              <br className="bbh-br" />
              {t("heroHeadline2") || "any budget"}
            </h1>
            <p className="bbh-lead">
              {t("heroLead") ||
                "Smart meal plans and grocery lists based on real German supermarket prices. Save money, eat healthy, stress less."}
            </p>
            <div className="bbh-actions">
              <Link to="/budget" className="bbh-btn bbh-btn--solid">
                {t("startPlanning") || "Start planning"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <Link to="/community" className="bbh-btn bbh-btn--ghost">
                <Users className="h-4 w-4 mr-2" />
                {t("browseCommunity") || "Browse community"}
              </Link>
            </div>
          </div>
          <div className="bbh-logos" aria-label="Supported stores">
            <span className="bbh-store">Aldi</span>
            <span className="bbh-store">Lidl</span>
            <span className="bbh-store">REWE</span>
            <span className="bbh-store">Edeka</span>
            <span className="bbh-store">Penny</span>
            <span className="bbh-store">Netto</span>
          </div>
        </div>
      </section>
    </>
  );
}