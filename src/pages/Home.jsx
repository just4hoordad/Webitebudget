import { useState } from "react";
import { motion } from "framer-motion";
import PlanModeChooser from "@/components/PlanModeChooser";
import HeroSection from "@/components/HeroSection";
import ScrollIntro from "@/components/ScrollIntro";
import { useLanguage } from "@/lib/LanguageContext";

const INTRO_STORAGE_KEY = "bb_scroll_intro_seen_v1";

const BENTO_ARCADE_CSS = `
@keyframes pop{0%{opacity:0;transform:translateY(26px) scale(.92)}70%{opacity:1;transform:translateY(-4px) scale(1.02)}100%{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes unspin{to{transform:rotate(-360deg)}}
@keyframes wob{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.bba-pg{background:#F3F8E6;padding:16px 14px 24px;font-family:"Helvetica Neue",Arial,sans-serif;color:#111827;display:flex;flex-direction:column;gap:14px;overflow:hidden;box-sizing:border-box;border-radius:24px}
.bba-pg *,.bba-pg *::before,.bba-pg *::after{box-sizing:border-box}
.bba-t{border:3px solid #111827;border-radius:22px;box-shadow:5px 5px 0 #111827;padding:16px;animation:pop .7s cubic-bezier(.3,1.5,.5,1) both;transition:box-shadow .15s,transform .15s}
.bba-pg > .bba-t:nth-child(2){animation-delay:.08s}
.bba-pg > .bba-t:nth-child(3){animation-delay:.16s}
.bba-pg > .bba-t:nth-child(4){animation-delay:.24s}
.bba-pg > .bba-t:nth-child(5){animation-delay:.32s}
.bba-pg > .bba-t:nth-child(6){animation-delay:.4s}
a.bba-t,.bba-btn{cursor:pointer;text-decoration:none;color:inherit}
a.bba-t:hover,a.bba-t:focus-visible{box-shadow:2px 2px 0 #111827;transform:translate(3px,3px)}
a.bba-t:active{box-shadow:0 0 0 #111827;transform:translate(5px,5px)}
.bba-hero{background:#fff;display:flex;flex-direction:column;gap:14px;padding:18px 16px}
.bba-row{display:flex;gap:10px;align-items:center}
.bba-pg h1{margin:0;font-family:"Helvetica Neue",Arial,sans-serif;font-size:35px;line-height:1.02;font-weight:900;letter-spacing:-.03em;color:#111827}
.bba-pg h1 span{display:inline-block;background:#FF3E7F;color:#fff;border:3px solid #111827;border-radius:12px;padding:2px 10px;transform:rotate(-2deg);margin-top:6px;box-shadow:3px 3px 0 #111827}
.bba-lead{margin:0;font-size:14px;line-height:1.5;color:#1f2937}
.bba-acts{display:flex;flex-direction:column;gap:10px}
.bba-btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:3px solid #111827;border-radius:999px;font-weight:800;font-size:15px;box-shadow:3px 3px 0 #111827;transition:box-shadow .15s,transform .15s,background-color .15s;color:#111827}
.bba-btn:hover,.bba-btn:focus-visible{box-shadow:1px 1px 0 #111827;transform:translate(2px,2px)}
.bba-btn:active{box-shadow:0 0 0 #111827;transform:translate(3px,3px)}
.bba-b1{background:#78a71b}.bba-b2{background:#fff}
.bba-btn svg{width:18px;height:18px}
.bba-vis{position:relative;display:flex;align-items:center;justify-content:center;height:250px}
.bba-vis img.bba-cart{position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;object-fit:cover;border-radius:50%;border:3px solid #111827;z-index:2;animation:wob 3s ease-in-out infinite;background:#F3F8E6}
.bba-wheel{position:relative;width:250px;height:250px;border:3px solid #111827;border-radius:50%;background:conic-gradient(#FF3E7F 0 60deg,#78a71b 60deg 120deg,#fff 120deg 180deg,#FFB020 180deg 240deg,#7DD3FC 240deg 300deg,#F3F8E6 300deg 360deg);animation:spin 18s linear infinite;box-shadow:5px 5px 0 #111827}
.bba-wheel span{position:absolute;left:50%;top:50%;width:70px;margin-left:-35px;margin-top:-13px;text-align:center;font-weight:900;font-size:14px;background:#fff;border:2px solid #111827;border-radius:999px;padding:3px 0;animation:unspin 18s linear infinite;color:#111827}
.bba-s1{transform:rotate(30deg) translateY(-98px)}.bba-s2{transform:rotate(90deg) translateY(-98px)}.bba-s3{transform:rotate(150deg) translateY(-98px)}.bba-s4{transform:rotate(210deg) translateY(-98px)}.bba-s5{transform:rotate(270deg) translateY(-98px)}.bba-s6{transform:rotate(330deg) translateY(-98px)}
.bba-s1,.bba-s2,.bba-s3,.bba-s4,.bba-s5,.bba-s6{animation:none!important}
.bba-f{display:flex;gap:12px;align-items:flex-start}
.bba-ic{flex:none;width:46px;height:46px;border:3px solid #111827;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fff}
.bba-ic svg{width:24px;height:24px}
.bba-pg h3{margin:0 0 4px;font-family:"Helvetica Neue",Arial,sans-serif;font-size:19px;font-weight:900;letter-spacing:-.01em;line-height:1.15}
.bba-f p{margin:0;font-size:13.5px;line-height:1.45}
.bba-fa{background:#78a71b}.bba-fb{background:#FF8FB5;margin-left:14px;transform:rotate(-1deg)}.bba-fc{background:#fff;margin-right:14px;transform:rotate(1deg)}
.bba-h2{margin:0;font-family:"Helvetica Neue",Arial,sans-serif;display:inline-block;align-self:flex-start;background:#111827;color:#F3F8E6;font-size:20px;font-weight:900;padding:6px 14px;border-radius:12px;transform:rotate(-2deg);line-height:1.15;animation:pop .7s .45s cubic-bezier(.3,1.5,.5,1) both}
.bba-cart-t{display:flex;flex-direction:column;gap:10px;min-height:100%}
.bba-cr1{background:#FF3E7F;color:#fff}.bba-cr2{background:#78a71b}
.bba-cart-t img{width:84px;height:84px;object-fit:cover;border:3px solid #111827;border-radius:18px;background:#F3F8E6;transform:rotate(-4deg)}
.bba-cart-t h3{font-size:24px}
.bba-cart-t p{margin:0;font-size:13.5px;line-height:1.45}
.bba-pro{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700}
.bba-pro svg{width:14px;height:14px;flex:none}
.bba-go{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;background:#111827;color:#fff;border-radius:999px;padding:10px 16px;font-weight:800;font-size:14px;border:3px solid #111827}
.bba-go svg{width:16px;height:16px}
.bba-dock{display:flex;flex-direction:column;gap:10px;background:#fff;animation:pop .7s .6s cubic-bezier(.3,1.5,.5,1) both}
.bba-pill{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:3px solid #111827;border-radius:999px;background:#F3F8E6;font-weight:800;font-size:14px;box-shadow:3px 3px 0 #111827;cursor:pointer;text-decoration:none;color:#111827;transition:box-shadow .15s,transform .15s}
.bba-pill:hover,.bba-pill:focus-visible{box-shadow:1px 1px 0 #111827;transform:translate(2px,2px)}
.bba-pill:active{box-shadow:0 0 0 #111827;transform:translate(3px,3px)}
.bba-pill svg{width:16px;height:16px}
.dark .bba-pg{background:hsl(var(--background));color:hsl(var(--foreground))}
.dark .bba-t{border-color:#000;box-shadow:5px 5px 0 #000}
.dark .bba-hero,.dark .bba-fc,.dark .bba-dock{background:hsl(var(--card));color:hsl(var(--card-foreground));border-color:#78a71b;box-shadow:5px 5px 0 #78a71b}
.dark .bba-pg h1{color:hsl(var(--foreground))}
.dark .bba-lead{color:hsl(var(--muted-foreground))}
.dark .bba-b2{background:hsl(var(--secondary));color:hsl(var(--foreground));border-color:#78a71b;box-shadow:3px 3px 0 #78a71b}
.dark .bba-b2 svg{stroke: currentColor}
.dark .bba-fa,.dark .bba-fb,.dark .bba-cr2{color:#111827}
.dark .bba-h2{background:#78a71b;color:#111827;box-shadow:3px 3px 0 #FF3E7F}
.dark .bba-pill{background:hsl(var(--secondary));color:hsl(var(--foreground));border-color:#78a71b;box-shadow:3px 3px 0 #78a71b}
.dark .bba-pill svg{stroke:currentColor}
`;

export default function Home() {
  const { t } = useLanguage();
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !localStorage.getItem(INTRO_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const handleCompleteIntro = () => {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowIntro(false);
  };

  return (
    <>
      <style>{BENTO_ARCADE_CSS}</style>
      <ScrollIntro open={showIntro} onComplete={handleCompleteIntro} />
      <div className="bba-pg -mx-4 -mt-6 md:mx-0 md:mt-0">
        <HeroSection onOpenIntro={() => setShowIntro(true)} />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="bba-t bba-f bba-fa"
        >
          <div className="bba-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h12" />
              <circle cx="16.5" cy="13.5" r="1.3" fill="#111827" />
            </svg>
          </div>
          <div>
            <h3>{t("feature1Title") || "Real German prices"}</h3>
            <p>{t("feature1Desc") || "Compare prices across Aldi, Lidl, REWE, Edeka, Penny & Netto"}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28, rotate: -3, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 }}
          className="bba-t bba-f bba-fb"
        >
          <div className="bba-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 4C9 4 4 9 4 15a5 5 0 005 5c6 0 11-5 11-16zM4 20c3-6 6-9 11-12" />
            </svg>
          </div>
          <div>
            <h3>{t("feature2Title") || "Personalized diets"}</h3>
            <p>{t("feature2Desc") || "Meal plans tailored to your diet, budget, and preferences"}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28, rotate: 3, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, rotate: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
          className="bba-t bba-f bba-fc"
        >
          <div className="bba-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 10h18l-2 10H5zM8 10l3-6M16 10l-3-6" />
            </svg>
          </div>
          <div>
            <h3>{t("feature3Title") || "Smart shopping list"}</h3>
            <p>{t("feature3Desc") || "Weekly shopping lists with the best store for each item"}</p>
          </div>
        </motion.div>

        <PlanModeChooser />
      </div>
    </>
  );
}