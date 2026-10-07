import { useEffect, useRef, useState } from "react";
import useAccordionScroll from "@/components/forms/useAccordionScroll";

export default function useGuidedAccordion({ steps, completed, formRef, prefix, onOpen }) {
  const [selection, setSelection] = useState({ key: steps[0], revision: 0 });
  const active = useRef(steps[0]);
  const edited = useRef(null);
  const selectSection = (value) => {
    const key = value || "";
    // A deliberate selection always wins over any pending automatic advance.
    edited.current = null;
    active.current = key;
    setSelection((previous) => ({ key, revision: previous.revision + 1 }));
    if (key) onOpen?.(key);
  };
  const withStepInput = (key, update) => (...args) => {
    edited.current = active.current === key ? { key, wasDone: completed[key] } : null;
    return update(...args);
  };
  // Only an actual edit can advance an incomplete section. Opening a section,
  // restoring saved values, and rendering an already-complete next step cannot.
  useEffect(() => {
    const edit = edited.current;
    edited.current = null;
    if (!edit || edit.key !== active.current || edit.wasDone || !completed[edit.key]) return;
    if (!formRef.current?.getClientRects().length) return;
    const following = steps.slice(steps.indexOf(edit.key) + 1);
    const next = following.find((key) => !completed[key]) || following[0];
    if (next) selectSection(next);
  });
  useAccordionScroll(formRef, selection, prefix);
  return { openSection: selection.key, selectSection, withStepInput };
}