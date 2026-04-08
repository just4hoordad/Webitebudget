import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
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
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors duration-150"
            >
              <span className="text-base">{lang.flag}</span>
              <span className="flex-1 text-left text-foreground">{lang.label}</span>
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