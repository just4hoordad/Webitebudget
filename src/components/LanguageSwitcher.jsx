import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, LANGUAGES } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-sm font-medium text-dark-muted hover:text-dark-foreground hover:bg-white/10 transition-all duration-200"
      >
        <img
          src={`https://flagcdn.com/w40/${currentLanguage.cc}.png`}
          alt={currentLanguage.label}
          className="h-4 w-6 rounded-sm object-cover"
          loading="lazy"
        />
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 md:bottom-full md:mb-2 md:mt-0 w-44 max-h-80 bg-dark border border-white/10 rounded-xl shadow-2xl overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-muted hover:text-dark-foreground hover:bg-white/10 transition-colors duration-150"
            >
              <img
                src={`https://flagcdn.com/w40/${lang.cc}.png`}
                alt={lang.label}
                className="h-4 w-6 rounded-sm object-cover"
                loading="lazy"
              />
              <span className="flex-1 text-left">{lang.label}</span>
              {currentLanguage.code === lang.code && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}