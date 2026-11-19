import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getVisualCopy } from "@/lib/visualStoryCopy";

const STEPPER_CSS = `
.st2-section {
  --st2-surface: hsl(var(--card));
  --st2-circle-bg: #E6EED4;
  --st2-lime: #78a71b;
  --st2-ink: #111827;
  --st2-muted: #4b5563;
  --st2-circle: 42px;
  --st2-rh: 1.55em;
  box-sizing: border-box;
  width: 100%;
  font-family: var(--font-body);
  color: hsl(var(--foreground));
}
.dark .st2-section {
  --st2-circle-bg: #1e293b;
  --st2-muted: #94a3b8;
}
.st2-section *, .st2-section *::before, .st2-section *::after { box-sizing: border-box; }

.st2-panel {
  width: 100%;
  background: var(--st2-surface);
  border-radius: 24px;
  padding: clamp(20px, 4.5cqi, 30px);
  border: 3px solid #111827;
  box-shadow: 5px 5px 0 #111827;
  container: st2-root / inline-size;
}
.dark .st2-panel {
  border-color: #78a71b;
  box-shadow: 5px 5px 0 #000000;
}

.st2-rotate {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 clamp(22px, 4.5cqi, 30px);
  font-family: var(--font-heading);
  font-size: clamp(1.35rem, 1.1rem + 1.4cqi, 1.85rem);
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.15;
}
.st2-rotate-pill {
  display: inline-block;
  overflow: hidden;
  height: var(--st2-rh);
  padding: 0 13px;
  background: #FFB020;
  border: 2.5px solid #111827;
  box-shadow: 2.5px 2.5px 0 #111827;
  border-radius: 12px;
  color: #111827;
  font-weight: 900;
  width: max-content;
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.st2-rotate-track {
  display: inline-block;
  vertical-align: top;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.st2-rotate-word {
  display: block;
  width: max-content;
  height: var(--st2-rh);
  line-height: var(--st2-rh);
  white-space: nowrap;
}

.st2-row {
  display: flex;
  align-items: center;
  margin-bottom: clamp(18px, 3.5cqi, 24px);
}
.st2-step {
  flex: 0 0 auto;
  appearance: none;
  border: 0;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  border-radius: 50%;
  outline: none;
}
.st2-step:focus-visible { outline: 2px solid #78a71b; outline-offset: 3px; }

.st2-badge {
  position: relative;
  width: var(--st2-circle);
  height: var(--st2-circle);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--st2-circle-bg);
  color: hsl(var(--foreground));
  border: 2.5px solid #111827;
  box-shadow: 2px 2px 0 #111827;
  font-family: var(--font-heading);
  font-weight: 900;
  font-size: 0.95rem;
  transition: background 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.dark .st2-badge {
  border-color: #78a71b;
}
.st2-step[data-st2-state="active"] .st2-badge {
  background: #78a71b;
  color: #111827;
  border-color: #111827;
  transform: scale(1.08);
}
.st2-step[data-st2-state="complete"] .st2-badge {
  background: #78a71b;
  color: #111827;
  border-color: #111827;
}
.st2-step:hover .st2-badge { transform: scale(1.13); }

.st2-conn {
  flex: 1 1 auto;
  min-width: 12px;
  height: var(--st2-circle);
  display: flex;
  align-items: center;
  margin: 0 -4px;
}
.st2-conn-node {
  position: relative;
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #FFB020;
  border: 1.5px solid #111827;
  z-index: 2;
}
.st2-conn-line {
  position: relative;
  flex: 1 1 auto;
  height: 3px;
  background-image: radial-gradient(circle, currentColor 1.2px, transparent 1.6px);
  background-size: 8px 3px;
  background-repeat: repeat-x;
  background-position: center;
  opacity: 0.65;
}
.st2-conn-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 3.5px;
  border-radius: 3px;
  background: #78a71b;
  transition: width 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.st2-conn.is-complete .st2-conn-fill { width: 100%; }
.st2-conn.is-next .st2-conn-line {
  animation: st2-dotmarch 0.9s linear infinite;
}

.st2-content {
  position: relative;
  overflow: hidden;
  min-height: 128px;
  transition: height 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.st2-panel-step, .st2-done {
  position: absolute;
  top: 0; left: 0; right: 0;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease;
}
.st2-panel-step { transform: translateX(100%); opacity: 0; pointer-events: none; }
.st2-panel-step.is-active { transform: translateX(0); opacity: 1; pointer-events: auto; }
.st2-panel-step.is-before { transform: translateX(-100%); opacity: 0; pointer-events: none; }
.st2-panel-step.is-after  { transform: translateX(100%); opacity: 0; pointer-events: none; }

.st2-done { transform: translateX(100%); opacity: 0; pointer-events: none; display: flex; flex-direction: column; }
.st2-done.is-show { transform: translateX(0); opacity: 1; pointer-events: auto; }

.st2-footer { display: flex; align-items: center; margin-top: clamp(18px, 3.5cqi, 26px); gap: 10px; }
.st2-footer.is-spread { justify-content: space-between; }
.st2-footer.is-end { justify-content: flex-end; }

@container st2-root (width < 400px) {
  .st2-row { --st2-circle: 35px; }
  .st2-conn { margin: 0 -3px; min-width: 8px; }
  .st2-footer { flex-direction: column-reverse; align-items: stretch; }
  .st2-footer button { width: 100%; justify-content: center; }
}
@keyframes st2-dotmarch {
  from { background-position-x: 0; }
  to   { background-position-x: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .st2-conn.is-next .st2-conn-line { animation: none; }
}
`;

export default function AboutProcessStepper() {
  const { currentLanguage } = useLanguage();
  const c = getVisualCopy(currentLanguage?.code);
  const [current, setCurrent] = useState(1);
  const [completed, setCompleted] = useState(false);

  const rootRef = useRef(null);
  const pillRef = useRef(null);
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const stepRefs = useRef([]);
  const doneRef = useRef(null);

  const total = c.stepperSteps.length;
  const wordIdx = completed ? total - 1 : Math.min(current, total) - 1;

  const measure = () => {
    if (pillRef.current && trackRef.current) {
      const wordEl = trackRef.current.children[wordIdx];
      if (wordEl) {
        pillRef.current.style.width = `${Math.ceil(wordEl.getBoundingClientRect().width) + 30}px`;
      }
    }
    if (contentRef.current) {
      const visible = completed ? doneRef.current : stepRefs.current[current - 1];
      if (visible) {
        contentRef.current.style.height = `${visible.offsetHeight + 4}px`;
      }
    }
  };

  useEffect(() => {
    measure();
    const ro = typeof ResizeObserver !== "undefined" && rootRef.current
      ? new ResizeObserver(() => measure())
      : null;
    if (ro && rootRef.current) ro.observe(rootRef.current);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure());
    }
    return () => ro?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, completed, currentLanguage?.code]);

  const goTo = (n) => {
    setCompleted(false);
    setCurrent(Math.max(1, Math.min(n, total)));
  };

  const handleNext = () => {
    if (completed) {
      goTo(1);
      return;
    }
    if (current < total) goTo(current + 1);
    else setCompleted(true);
  };

  const handleBack = () => {
    if (completed) {
      goTo(total);
      return;
    }
    if (current > 1) goTo(current - 1);
  };

  const showBack = !completed && current > 1;

  return (
    <section className="st2-section" aria-label="Interactive process walkthrough">
      <style>{STEPPER_CSS}</style>
      <div className="st2-panel" ref={rootRef}>
        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="bba-sticker">
            <Sparkles className="h-3 w-3 text-[#FFB020]" /> {c.heroSticker}
          </span>
          <span className="text-[11px] font-heading font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3F8E6] text-[#111827] border-2 border-[#111827]">
            {completed ? "✓ 4 / 4" : `${current} / ${total}`}
          </span>
        </div>

        {/* Rotating headline */}
        <p className="st2-rotate">
          <span>{c.stepperPrefix}</span>
          <span className="st2-rotate-pill" ref={pillRef} aria-hidden="true">
            <span
              className="st2-rotate-track"
              ref={trackRef}
              style={{ transform: `translateY(calc(var(--st2-rh) * ${-wordIdx}))` }}
            >
              {c.stepperWords.map((w) => (
                <span key={w} className="st2-rotate-word">
                  {w}
                </span>
              ))}
            </span>
          </span>
        </p>

        {/* 4 numbered steps + dotted connectors */}
        <div className="st2-row">
          {c.stepperSteps.map((step, i) => {
            const n = i + 1;
            const state = completed
              ? "complete"
              : n === current
              ? "active"
              : n < current
              ? "complete"
              : "inactive";
            const connDone = completed || current > n;
            const connNext = !completed && !connDone && i === current - 1;

            return (
              <div key={step.label} className="contents">
                <button
                  type="button"
                  className="st2-step"
                  data-st2-state={state}
                  aria-label={`Step ${n}: ${step.label}`}
                  aria-current={!completed && n === current ? "step" : "false"}
                  onClick={() => goTo(n)}
                >
                  <span className="st2-badge">
                    {state === "complete" ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      <span>{n}</span>
                    )}
                  </span>
                </button>
                {i < total - 1 && (
                  <span
                    className={`st2-conn ${connDone ? "is-complete" : ""} ${
                      connNext ? "is-next" : ""
                    }`}
                  >
                    <span className="st2-conn-node" />
                    <span className="st2-conn-line">
                      <span className="st2-conn-fill" />
                    </span>
                    <span className="st2-conn-node" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Sliding step panels */}
        <div className="st2-content" ref={contentRef}>
          {c.stepperSteps.map((step, i) => {
            const n = i + 1;
            const active = !completed && n === current;
            const before = (completed || n < current) && !active;
            const after = !completed && n > current;
            return (
              <div
                key={step.title}
                ref={(el) => { stepRefs.current[i] = el; }}
                className={`st2-panel-step ${active ? "is-active" : ""} ${
                  before ? "is-before" : ""
                } ${after ? "is-after" : ""}`}
                role="group"
                aria-label={step.label}
                aria-hidden={!active}
              >
                <h3 className="font-heading font-black text-lg sm:text-xl text-foreground mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-3">
                  {step.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-xl bg-[#F3F8E6] text-[#111827] border-2 border-[#111827] px-2.5 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0_#111827]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Completion deliverable panel */}
          <div
            ref={doneRef}
            className={`st2-done ${completed ? "is-show" : ""}`}
            role="group"
            aria-label="Completed"
            aria-hidden={!completed}
          >
            <div className="rounded-2xl bg-[#78a71b] text-[#111827] border-2 border-[#111827] p-4 shadow-[3px_3px_0_#111827]">
              <h3 className="font-heading font-black text-lg sm:text-xl text-[#111827] mb-1">
                🎉 {c.stepperDoneTitle}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#111827]/90 leading-relaxed mb-3">
                {c.stepperDoneDesc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {c.stepperDoneChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full bg-white text-[#111827] border-2 border-[#111827] px-2.5 py-0.5 text-[11px] font-heading font-black shadow-[1.5px_1.5px_0_#111827]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className={`st2-footer ${showBack ? "is-spread" : "is-end"}`}>
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-full border-2 border-[#111827] bg-white text-[#111827] font-heading font-extrabold text-xs sm:text-sm shadow-[2px_2px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform cursor-pointer"
            >
              ← {c.stepperBack}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-full border-2 border-[#111827] bg-[#78a71b] text-[#111827] font-heading font-black text-xs sm:text-sm shadow-[3px_3px_0_#111827] hover:translate-x-[1px] hover:translate-y-[1px] transition-transform cursor-pointer"
          >
            {completed
              ? `↻ ${c.stepperRestart}`
              : current === total
              ? `✨ ${c.stepperComplete}`
              : `${c.stepperNext} →`}
          </button>
        </div>
      </div>
    </section>
  );
}