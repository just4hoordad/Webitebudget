import { useLanguage } from "@/lib/LanguageContext";
import { Sparkles, SlidersHorizontal } from "lucide-react";

const L = {
  en: { easy: "Easy", detailed: "Detailed" },
  de: { easy: "Einfach", detailed: "Detailliert" },
  fr: { easy: "Simple", detailed: "Détaillé" },
  es: { easy: "Fácil", detailed: "Detallado" },
  ar: { easy: "سهل", detailed: "مفصل" },
  ru: { easy: "Просто", detailed: "Подробно" },
  uk: { easy: "Просто", detailed: "Детально" },
  fa: { easy: "آسان", detailed: "تفصیلی" },
  zh: { easy: "简单", detailed: "详细" },
  vi: { easy: "Dễ", detailed: "Chi tiết" },
  tr: { easy: "Kolay", detailed: "Detaylı" },
};

export default function EasyModeToggle({ mode, onChange }) {
  const { currentLanguage } = useLanguage();
  const l = L[currentLanguage?.code] || L.en;
  const item = (val, Icon, label) => (
    <button
      type="button"
      onClick={() => onChange(val)}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
        mode === val ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-secondary border border-border">
      {item("easy", Sparkles, l.easy)}
      {item("detailed", SlidersHorizontal, l.detailed)}
    </div>
  );
}