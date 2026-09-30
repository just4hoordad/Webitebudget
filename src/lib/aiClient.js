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
  fa: "هوش مصنوعی مشغول است — لطفاً چند لحظه دیگر دوباره تلاش کنید.",
  vi: "AI đang bận — vui lòng thử lại sau giây lát.",
};

const FALLBACK = {
  en: "AI is running in backup mode — results may take a little longer.",
  de: "Die KI läuft im Ausweichmodus – Ergebnisse können etwas länger dauern.",
  fa: "هوش مصنوعی در حالت پشتیبان اجرا می‌شود — نتایج ممکن است کمی بیشتر طول بکشد.",
  ru: "ИИ работает в резервном режиме — результаты могут занять чуть больше времени.",
  zh: "AI 正在备用模式下运行 — 结果可能稍慢。",
  fr: "L'IA fonctionne en mode de secours — les résultats peuvent prendre un peu plus de temps.",
  es: "La IA funciona en modo de respaldo — los resultados pueden tardar un poco más.",
  it: "L'IA è in modalità di riserva — i risultati potrebbero richiedere un po' più di tempo.",
  pt: "A IA está em modo de reserva — os resultados podem demorar um pouco mais.",
  pl: "AI działa w trybie zapasowym — wyniki mogą pojawić się nieco później.",
  nl: "De AI draait in back-upmodus — resultaten kunnen iets langer duren.",
  sv: "AI:n körs i reservläge — resultaten kan ta lite längre tid.",
  no: "AI-en kjører i reservemodus — resultatene kan ta litt lengre tid.",
  da: "AI'en kører i reservetilstand — resultaterne kan tage lidt længere tid.",
  fi: "Tekoäly toimii varatilassa — tulokset voivat viedä hieman kauemmin.",
  cs: "AI běží v záložním režimu — výsledky mohou trvat o něco déle.",
  hu: "Az MI tartalék módban fut — az eredmények kicsit tovább tarthatnak.",
  ro: "AI-ul rulează în modul de rezervă — rezultatele pot dura puțin mai mult.",
  el: "Η τεχνητή νοημοσύνη λειτουργεί σε εφεδρική λειτουργία — τα αποτελέσματα ίσως αργήσουν λίγο.",
  uk: "ШІ працює в резервному режимі — результати можуть зайняти трохи більше часу.",
  tr: "Yapay zeka yedek modda çalışıyor — sonuçlar biraz daha uzun sürebilir.",
  ar: "يعمل الذكاء الاصطناعي في الوضع الاحتياطي — قد تستغرق النتائج وقتًا أطول قليلاً.",
  vi: "AI đang chạy ở chế độ dự phòng — kết quả có thể mất thêm chút thời gian.",
};

const lang = () => (document.documentElement.lang || "en").slice(0, 2).toLowerCase();
function busyMessage() {
  return BUSY[lang()] || BUSY.en;
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
  }).catch((err) => ({ data: { error: err?.message || "Network error" } }));

  const data = res?.data;
  if (data && !data.error && !data.openrouter_unavailable) {
    if (response_json_schema) return data;
    return typeof data.text === "string" ? data.text : data;
  }

  const msg = busyMessage();
  toast({ title: msg, variant: "destructive" });
  throw new Error(data?.error || msg);
}