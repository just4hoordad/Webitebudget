import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Utensils, CalendarDays, ShoppingBasket, ChevronDown, X, Sparkles, CheckCircle2, Flame, ArrowRight } from "lucide-react";

const COPY = {
  en: {
    skip: "Skip intro",
    scrollHint: "Scroll to see how it works",
    step1Badge: "STEP 01 · SET UP",
    step1Title: "Pick your diet, days & stores",
    step1Desc: "Choose a diet (Balanced, High-Protein, Vegan…), set how many days and people, and tap your German supermarkets. Easy mode keeps it to one tap.",
    step2Badge: "STEP 02 · BUILD YOUR WEEK",
    step2Title: "Fill your meal grid, day by day",
    step2Desc: "Add dishes to breakfast, lunch and dinner for each day. Use Suggest for ideas, or Autofill the whole week from your diet's library in one tap.",
    step3Badge: "STEP 03 · SMART GROCERY LIST",
    step3Title: "Get one list, cheapest store per item",
    step3Desc: "We match every ingredient to real German shelf prices and weekly flyers, consolidate repeats, and total your basket — with a cook-along prep guide.",
    readyBadge: "LET'S BUILD!",
    startBtn: "Start building",
    exploreBtn: "Got it",
  },
  de: {
    skip: "Intro überspringen",
    scrollHint: "Scrollen & entdecken, wie es funktioniert",
    step1Badge: "SCHRITT 01 · EINSTELLEN",
    step1Title: "Diät, Tage & Märkte wählen",
    step1Desc: "Wähle eine Ernährungsweise, lege Tage und Personen fest und tippe deine Supermärkte. Im Easy-Modus reicht ein einziger Tap.",
    step2Badge: "SCHRITT 02 · WOCHE BAUEN",
    step2Title: "Fülle deinen Wochenplan",
    step2Desc: "Trage Gerichte für Frühstück, Mittag- und Abendessen ein — pro Vorschlag oder mit einem Tap die ganze Woche aus deiner Bibliothek befüllen.",
    step3Badge: "SCHRITT 03 · SMARTE EINKAUFSLISTE",
    step3Title: "Eine Liste, pro Produkt der billigste Markt",
    step3Desc: "Wir vergleichen echte deutsche Preise und Angebote, fassen alles zusammen und liefern einen Koch-Leitfaden für jeden Tag.",
    readyBadge: "LOS GEHT'S!",
    startBtn: "Jetzt starten",
    exploreBtn: "Verstanden",
  },
};

const STORES = [
  { name: "Aldi", bg: "#7DD3FC" },
  { name: "Lidl", bg: "#FFB020" },
  { name: "REWE", bg: "#FF8FB5" },
  { name: "Edeka", bg: "#78a71b" },
];

const DIET_PILLS = ["Balanced", "High-Protein", "Vegan", "Vegetarisch", "Halal"];

const GRID_DAYS = [
  { day: "Mon", b: "Skyr Bowl", l: "Couscous", d: "Salmon" },
  { day: "Tue", b: "Porridge", l: "Linsen-Salat", d: "Pasta" },
  { day: "Wed", b: "Rührei", l: "Wrap", d: "Chili" },
];

export default function PlanBuilderIntro({ open, onComplete }) {
  const { currentLanguage } = useLanguage();
  const scrollerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);
  const c = COPY[currentLanguage?.code] || COPY.en;

  const { scrollYProgress } = useScroll({ container: scrollerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      if (v < 0.22) setActiveStage(0);
      else if (v < 0.52) setActiveStage(1);
      else if (v < 0.82) setActiveStage(2);
      else setActiveStage(3);
    });
    return () => unsub();
  }, [scrollYProgress]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const progressWidth = useTransform(smoothProgress, [0, 1], ["8%", "100%"]);
  const cardRotate = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [-2, 2, -1.5, 0]);
  const floatY = useTransform(smoothProgress, [0, 0.5, 1], [0, -10, 0]);

  const scrollToStage = (idx) => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const targets = [0, 0.35, 0.68, 1];
    el.scrollTo({ top: maxScroll * targets[idx], behavior: "smooth" });
  };

  if (!open) return null;

  const ScrollCue = ({ onClick, label }) => (
    <button type="button" onClick={onClick} className="w-full pt-2 flex flex-col items-center gap-1 text-xs font-heading font-extrabold opacity-80 hover:opacity-100">
      <span>{label}</span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }} className="h-7 w-7 rounded-full bg-[#FFB020] text-[#111827] border-2 border-[#111827] flex items-center justify-center shadow-[2px_2px_0_#111827]">
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#F3F8E6] dark:bg-background text-[#111827] dark:text-foreground flex flex-col"
      >
        <div className="relative z-20 px-4 pt-3 pb-2.5 border-b-[3px] border-[#111827] dark:border-[#78a71b] bg-white/95 dark:bg-card/95 backdrop-blur-md">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#78a71b] border-2 border-[#111827] shadow-[2px_2px_0_#111827] flex items-center justify-center font-heading font-black text-xs text-[#111827]">
                {activeStage + 1}/4
              </div>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((idx) => (
                  <button key={idx} type="button" onClick={() => scrollToStage(idx)} aria-label={`Step ${idx + 1}`} className={`h-2.5 rounded-full border border-[#111827] transition-all ${activeStage === idx ? "w-7 bg-[#FF3E7F]" : idx < activeStage ? "w-2.5 bg-[#78a71b]" : "w-2.5 bg-[#F3F8E6]"}`} />
                ))}
              </div>
            </div>
            <button type="button" onClick={() => onComplete()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading font-extrabold bg-[#F3F8E6] text-[#111827] border-2 border-[#111827] shadow-[2px_2px_0_#111827] active:translate-x-[1px] active:translate-y-[1px]">
              {c.skip}
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-w-lg mx-auto mt-2 h-2 rounded-full bg-[#F3F8E6] border-2 border-[#111827] overflow-hidden">
            <motion.div style={{ width: progressWidth }} className="h-full bg-gradient-to-r from-[#78a71b] via-[#FFB020] to-[#FF3E7F]" />
          </div>
        </div>

        <div ref={scrollerRef} className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth">
          {/* SCENE 1: Setup */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div style={{ rotate: cardRotate, y: floatY }} initial={{ opacity: 0, y: 30, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="bba-t bg-white dark:bg-card space-y-4">
              <span className="bba-sticker"><Utensils className="h-3.5 w-3.5" /> {c.step1Badge}</span>
              <h2 className="font-heading text-3xl font-black tracking-tight leading-[1.05]">{c.step1Title}</h2>
              <p className="text-sm font-medium opacity-85 leading-relaxed">{c.step1Desc}</p>

              <div className="rounded-2xl bg-[#78a71b] text-[#111827] border-[3px] border-[#111827] shadow-[4px_4px_0_#111827] p-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {DIET_PILLS.map((d, i) => (
                    <motion.span key={d} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }} className={`text-[11px] font-heading font-black px-2.5 py-1 rounded-full border-2 border-[#111827] ${i === 1 ? "bg-[#FF3E7F] text-white" : "bg-white"}`}>
                      {d}
                    </motion.span>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl border-2 border-[#111827] px-3 py-2">
                  <span className="text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Days</span>
                  <span className="font-heading text-xl font-black">7</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STORES.map((s, i) => (
                    <motion.div key={s.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.07 }} style={{ backgroundColor: s.bg }} className="border-2 border-[#111827] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[#111827] shadow-[2px_2px_0_#111827]">
                      <span className="font-heading font-black text-xs">{s.name}</span>
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  ))}
                </div>
              </div>

              <ScrollCue onClick={() => scrollToStage(1)} label={c.scrollHint} />
            </motion.div>
          </section>

          {/* SCENE 2: Grid */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.92 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: false, amount: 0.45 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="bba-t bg-[#FF8FB5] text-[#111827] space-y-4">
              <span className="bba-sticker"><CalendarDays className="h-3.5 w-3.5" /> {c.step2Badge}</span>
              <h2 className="font-heading text-3xl font-black tracking-tight leading-[1.05] text-[#111827]">{c.step2Title}</h2>
              <p className="text-sm font-medium text-[#111827]/90 leading-relaxed">{c.step2Desc}</p>

              <div className="space-y-2.5">
                {GRID_DAYS.map((d, idx) => (
                  <motion.div key={d.day} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.5 }} transition={{ delay: idx * 0.1, type: "spring" }} className="border-[2.5px] border-[#111827] rounded-2xl bg-white p-3 shadow-[3px_3px_0_#111827] flex items-center gap-3 text-[#111827]">
                    <span className="font-heading font-black text-xs bg-[#111827] text-[#F3F8E6] px-2 py-1 rounded-md">{d.day}</span>
                    <div className="min-w-0 flex-1 grid grid-cols-3 gap-1.5">
                      {[d.b, d.l, d.d].map((m, i) => (
                        <span key={i} className="text-[10px] font-bold bg-[#F3F8E6] border border-[#111827] rounded-md px-1.5 py-1 text-center truncate">{m}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button type="button" initial={{ scale: 0.9 }} whileInView={{ scale: 1 }} viewport={{ once: false }} className="w-full rounded-full bg-[#78a71b] text-[#111827] border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] font-heading font-black text-sm py-2.5 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" /> Autofil week
              </motion.button>

              <ScrollCue onClick={() => scrollToStage(2)} label={c.scrollHint} />
            </motion.div>
          </section>

          {/* SCENE 3: Grocery result */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.92 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: false, amount: 0.45 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="bba-t bg-[#7DD3FC] text-[#111827] space-y-4">
              <span className="bba-sticker"><ShoppingBasket className="h-3.5 w-3.5" /> {c.step3Badge}</span>
              <h2 className="font-heading text-3xl font-black tracking-tight leading-[1.05] text-[#111827]">{c.step3Title}</h2>
              <p className="text-sm font-medium text-[#111827]/90 leading-relaxed">{c.step3Desc}</p>

              <div className="rounded-2xl bg-white border-[3px] border-[#111827] shadow-[4px_4px_0_#111827] divide-y-2 divide-[#111827] overflow-hidden">
                {[
                  { name: "Milbona Skyr 500g", store: "Lidl", price: "€1.39" },
                  { name: "Ja! Haferflocken 500g", store: "REWE", price: "€0.79" },
                  { name: "Bio Eier 10er", store: "Aldi", price: "€2.69" },
                ].map((item, idx) => (
                  <motion.div key={item.name} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.5 }} transition={{ delay: idx * 0.12, type: "spring" }} className="p-3 flex items-center justify-between gap-2 text-[#111827]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-xs truncate">{item.name}</p>
                        <span className="inline-block text-[10px] font-black uppercase bg-[#FFB020] px-1.5 py-0.2 rounded border border-[#111827]">{item.store}</span>
                      </div>
                    </div>
                    <span className="font-heading font-black text-sm bg-[#78a71b] px-2 py-0.5 rounded-lg border-2 border-[#111827]">{item.price}</span>
                  </motion.div>
                ))}
                <div className="p-3 flex items-center justify-between bg-[#F3F8E6] text-[#111827]">
                  <span className="text-xs font-heading font-black flex items-center gap-1.5"><Flame className="h-4 w-4 text-[#FF3E7F]" /> Total</span>
                  <span className="font-heading font-black text-lg">€18.40</span>
                </div>
              </div>

              <ScrollCue onClick={() => scrollToStage(3)} label="Final step ↓" />
            </motion.div>
          </section>

          {/* SCENE 4: CTA */}
          <section className="min-h-full snap-start flex flex-col justify-center px-4 py-8 max-w-lg mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false, amount: 0.45 }} transition={{ type: "spring", stiffness: 280, damping: 20 }} className="bba-t bg-[#FFB020] text-[#111827] space-y-5 text-center py-7">
              <span className="bba-sticker mx-auto"><Sparkles className="h-3.5 w-3.5" /> {c.readyBadge}</span>
              <h2 className="font-heading text-3xl font-black tracking-tight leading-none text-[#111827]">{c.startBtn}</h2>
              <div className="space-y-3 pt-2">
                <button type="button" onClick={() => onComplete()} className="w-full min-h-[52px] rounded-full bg-[#78a71b] text-[#111827] border-[3px] border-[#111827] shadow-[4px_4px_0_#111827] font-heading font-black text-base flex items-center justify-center gap-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#111827] transition-all">
                  <Utensils className="h-5 w-5" /> {c.startBtn}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => onComplete()} className="w-full min-h-[46px] rounded-full bg-white text-[#111827] border-[3px] border-[#111827] shadow-[3px_3px_0_#111827] font-heading font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#F3F8E6] transition-all">
                  {c.exploreBtn}
                </button>
              </div>
            </motion.div>
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}