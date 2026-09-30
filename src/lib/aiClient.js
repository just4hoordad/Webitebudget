import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

const BUSY = {
  en: "AI is busy — please try again in a moment.",
  de: "Die KI ist gerade ausgelastet – bitte versuche es gleich noch einmal.",
  fr: "L'IA est occupée — réessayez dans un instant.",
  es: "La IA está ocupada — inténtalo de nuevo en un momento.",
  it: "L'IA è occupata — riprova tra un momento.",
  nl: "De AI is bezet — probeer het zo opnieuw.",
  pl: "AI jest zajęte — spróbuj ponownie za chwilę.",
  pt: "A IA está ocupada — tente novamente em instantes.",
  tr: "Yapay zeka meşgul — lütfen birazdan tekrar deneyin.",
  ar: "الذكاء الاصطناعي مشغول — يرجى المحاولة مرة أخرى بعد قليل.",
  ru: "ИИ занят — попробуйте ещё раз через минуту.",
  uk: "ШІ зайнятий — спробуйте ще раз за мить.",
  sv: "AI:n är upptagen — försök igen om en stund.",
  da: "AI'en er optaget — prøv igen om lidt.",
  fi: "Tekoäly on varattu — yritä hetken päästä uudelleen.",
  no: "AI-en er opptatt — prøv igjen om litt.",
  nb: "AI-en er opptatt — prøv igjen om litt.",
  cs: "AI je zaneprázdněná — zkuste to za chvíli znovu.",
  hu: "Az MI foglalt — próbáld újra egy pillanat múlva.",
  ro: "AI-ul este ocupat — încearcă din nou peste un moment.",
  el: "Η τεχνητή νοημοσύνη είναι απασχολημένη — δοκιμάστε ξανά σε λίγο.",
  bg: "ИИ е зает — опитайте отново след малко.",
  hr: "AI je zauzet — pokušajte ponovno za trenutak.",
  he: "ה-AI עסוק — נסו שוב בעוד רגע.",
  ja: "AIが混み合っています。しばらくしてからもう一度お試しください。",
  zh: "AI 正忙，请稍后再试。",
};

function busyMessage() {
  const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
  return BUSY[lang] || BUSY.en;
}

let warnedFallback = false;

/**
 * Invokes AI through OpenRouter via the invokeAI backend function.
 * If OpenRouter is unavailable (rate-limited / out of credits), falls back to
 * Base44 InvokeLLM and warns once per session. If that also fails, shows the
 * user a friendly "AI is busy" message and throws.
 */
export async function invokeAI({ prompt, response_json_schema, model, add_context_from_internet }) {
  const res = await base44.functions.invoke("invokeAI", {
    prompt,
    response_json_schema,
    model,
    add_context_from_internet: Boolean(add_context_from_internet),
  }).catch((err) => ({ data: { openrouter_unavailable: true, error: err?.message } }));

  const data = res?.data;
  if (data && !data.openrouter_unavailable && !data.error) {
    if (response_json_schema) return data;
    return typeof data.text === "string" ? data.text : data;
  }

  console.warn("OpenRouter unavailable, falling back to Base44 credits:", data?.error);
  if (!warnedFallback) {
    warnedFallback = true;
    toast({
      title: "OpenRouter unavailable",
      description: "AI requests are temporarily using Base44 credits. Check your OpenRouter balance.",
    });
  }

  try {
    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema,
      model: model || "automatic",
      add_context_from_internet: Boolean(add_context_from_internet),
    });
  } catch (err) {
    const msg = busyMessage();
    toast({ title: msg, variant: "destructive" });
    throw new Error(msg);
  }
}