import { useEffect, useRef, useState } from "react";
import useAccordionScroll from "@/components/forms/useAccordionScroll";

const STEPS = ["diet", "people", "days", "stores", "macros"];

export default function usePlanSetupGuidance({ formRef, completed, enabled }) {
  const [request, setRequest] = useState({ key: "", revision: 0 });
  const [finished, setFinished] = useState(null);
  const current = useRef({ completed, enabled });
  current.current = { completed, enabled };
  const scrollToPart = (key) => {
    setFinished(null);
    setRequest((previous) => ({ key, revision: previous.revision + 1 }));
  };
  // Completion is explicit: a choice, a finished edit, or Done on the map.
  // Saved preferences never trigger scrolling on their own.
  useEffect(() => {
    if (!finished) return;
    setFinished(null);
    const values = current.current;
    if (!values.completed[finished]) return;
    const next = STEPS.slice(STEPS.indexOf(finished) + 1).find((key) => values.enabled[key] !== false)
      || STEPS.find((key) => !values.completed[key]) || "build";
    setRequest((previous) => ({ key: next, revision: previous.revision + 1 }));
  }, [finished]);
  useAccordionScroll(formRef, request, "pb-");
  return { activeStep: request.key || STEPS.find((key) => !completed[key]), scrollToPart, completePart: setFinished };
}