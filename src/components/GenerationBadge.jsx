import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { subscribeGenerationStatus } from "@/lib/generationStatus";
import { useLanguage } from "@/lib/LanguageContext";
import { Loader2, CheckCircle2, AlertCircle, ShoppingBasket } from "lucide-react";

const LBL = {
  en: { generating: "Generating your list…", ready: "Your list is ready", error: "Generation failed", view: "View", retry: "Retry", hint: "Keep browsing — we'll finish in the background" },
  de: { generating: "Liste wird erstellt…", ready: "Deine Liste ist fertig", error: "Generierung fehlgeschlagen", view: "Ansehen", retry: "Erneut", hint: "Stöbern weiter — wir machen im Hintergrund fertig" },
  fr: { generating: "Génération de votre liste…", ready: "Votre liste est prête", error: "Échec de la génération", view: "Voir", retry: "Réessayer", hint: "Continuez à naviguer — on finit en arrière-plan" },
  es: { generating: "Generando tu lista…", ready: "Tu lista está lista", error: "Generación fallida", view: "Ver", retry: "Reintentar", hint: "Sigue navegando — terminamos en segundo plano" },
  ar: { generating: "ننشئ قائمتك…", ready: "قائمتك جاهزة", error: "فشل الإنشاء", view: "عرض", retry: "إعادة", hint: "تابع التصفح — ننهي في الخلفية" },
  ru: { generating: "Создаём ваш список…", ready: "Ваш список готов", error: "Ошибка генерации", view: "Открыть", retry: "Повтор", hint: "Продолжайте — мы закончим в фоне" },
  uk: { generating: "Створюємо ваш список…", ready: "Ваш список готовий", error: "Помилка генерації", view: "Відкрити", retry: "Ще раз", hint: "Гуляйте далі — ми закінчимо у фоні" },
  tr: { generating: "Listen oluşturuluyor…", ready: "Listen hazır", error: "Oluşturma başarısız", view: "Gör", retry: "Tekrar", hint: "Gezinmeye devam et — arka planda bitiririz" },
  zh: { generating: "正在生成你的清单…", ready: "你的清单已就绪", error: "生成失败", view: "查看", retry: "重试", hint: "继续浏览 — 我们在后台完成" },
  vi: { generating: "Đang tạo danh sách…", ready: "Danh sách đã sẵn sàng", error: "Tạo thất bại", view: "Xem", retry: "Thử lại", hint: "Tiếp tục duyệt — xong trong nền" },
};

export default function GenerationBadge() {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const [state, setState] = useState({ status: "idle" });

  useEffect(() => subscribeGenerationStatus(setState), []);

  // Hide on the meal-plan page itself — the full UI is already there.
  if (location.pathname === "/meal-plan") return null;
  if (state.status === "idle") return null;

  const l = LBL[currentLanguage.code] || LBL.en;

  const to = `/meal-plan${state.searchKey ? state.searchKey : ""}`;

  let icon;
  let tone;
  let label;
  let action;
  if (state.status === "generating") {
    icon = <Loader2 className="h-4 w-4 animate-spin text-[#111827]" />;
    tone = "bg-[#FFB020] text-[#111827]";
    label = l.generating;
    action = null;
  } else if (state.status === "ready") {
    icon = <CheckCircle2 className="h-4 w-4 text-[#111827]" />;
    tone = "bg-[#78a71b] text-[#111827]";
    label = l.ready;
    action = (
      <Link to={to} className="ml-1 inline-flex items-center gap-1 rounded-full bg-white text-[#111827] border-2 border-[#111827] text-xs font-heading font-black px-3 py-1 shrink-0 shadow-[1.5px_1.5px_0_#111827]">
        <ShoppingBasket className="h-3.5 w-3.5" />
        {l.view}
      </Link>
    );
  } else {
    icon = <AlertCircle className="h-4 w-4 text-white" />;
    tone = "bg-[#FF3E7F] text-white";
    label = l.error;
    action = (
      <Link to={to} className="ml-1 inline-flex items-center rounded-full bg-white text-[#111827] border-2 border-[#111827] text-xs font-heading font-black px-3 py-1 shrink-0 shadow-[1.5px_1.5px_0_#111827]">
        {l.retry}
      </Link>
    );
  }

  return (
    <div className="fixed z-40 left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 md:left-auto md:right-6 md:translate-x-0 px-3 w-full max-w-[360px] md:w-auto pointer-events-none">
      <div className={`pointer-events-auto flex items-center gap-2.5 rounded-full border-[2.5px] border-[#111827] shadow-[4px_4px_0_#111827] px-4 py-2.5 ${tone}`}>
        <span className="shrink-0">{icon}</span>
        <span className="text-xs font-heading font-black leading-tight min-w-0 truncate">{label}</span>
        {action}
      </div>
      {state.status === "generating" && (
        <p className="mt-1.5 text-center md:text-right text-[10px] font-heading font-bold text-foreground bg-card border border-[#111827] rounded-full px-2.5 py-0.5 shadow-[1.5px_1.5px_0_#111827] truncate">{l.hint}</p>
      )}
    </div>
  );
}