import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useLanguage } from "@/lib/LanguageContext";

const cookieT = {
  en: { text: "We use local storage to save your language preference and meal plans. No tracking cookies or third-party analytics.", accept: "Accept", learnMore: "Privacy Policy" },
  de: { text: "Wir verwenden lokalen Speicher, um Ihre Spracheinstellung und Mahlzeitenpläne zu speichern. Keine Tracking-Cookies oder Drittanbieter-Analysen.", accept: "Akzeptieren", learnMore: "Datenschutzerklärung" },
  fr: { text: "Nous utilisons le stockage local pour enregistrer vos préférences de langue et vos plans de repas. Pas de cookies de suivi ni d'analyses tierces.", accept: "Accepter", learnMore: "Politique de confidentialité" },
  es: { text: "Usamos almacenamiento local para guardar tus preferencias de idioma y planes de comida. Sin cookies de seguimiento ni análisis de terceros.", accept: "Aceptar", learnMore: "Política de privacidad" },
  ar: { text: "نستخدم التخزين المحلي لحفظ تفضيلات اللغة وخطط الوجبات. لا توجد ملفات تعريف ارتباط للتتبع أو تحليلات خارجية.", accept: "قبول", learnMore: "سياسة الخصوصية" },
  ru: { text: "Мы используем локальное хранилище для сохранения языковых настроек и планов питания. Файлы cookie для отслеживания не используются.", accept: "Принять", learnMore: "Политика конфиденциальности" },
  uk: { text: "Ми використовуємо локальне сховище для збереження мовних налаштувань і планів харчування. Файли cookie для відстеження не використовуються.", accept: "Прийняти", learnMore: "Політика конфіденційності" },
  fa: { text: "از حافظه محلی برای ذخیره تنظیمات زبان و برنامه‌های غذایی استفاده می‌کنیم. بدون کوکی‌های ردیابی یا تحلیل‌های شخص ثالث.", accept: "پذیرفتن", learnMore: "سیاست حفظ حریم خصوصی" },
  zh: { text: "我们使用本地存储保存您的语言偏好和膳食计划。不使用跟踪 Cookie 或第三方分析。", accept: "接受", learnMore: "隐私政策" },
  vi: { text: "Chúng tôi dùng bộ nhớ cục bộ để lưu tùy chọn ngôn ngữ và kế hoạch bữa ăn. Không có cookie theo dõi hoặc phân tích bên thứ ba.", accept: "Chấp nhận", learnMore: "Chính sách bảo mật" },
  tr: { text: "Dil tercihinizi ve öğün planlarınızı kaydetmek için yerel depolama kullanıyoruz. İzleme çerezi veya üçüncü taraf analizi kullanılmaz.", accept: "Kabul Et", learnMore: "Gizlilik Politikası" },
};

const STORAGE_KEY = "budgetbite_cookie_consent";

export default function CookieBanner() {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  const t = cookieT[currentLanguage.code] || cookieT["en"];

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-2 sm:bottom-4">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-lg px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
          {t.text}{" "}
          <button onClick={() => { accept(); navigate("/datenschutz"); }} className="text-primary underline underline-offset-2 hover:opacity-80">
            {t.learnMore}
          </button>
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-primary text-primary-foreground font-heading font-semibold text-sm px-5 py-2 rounded-xl hover:bg-primary/90 transition-colors"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}