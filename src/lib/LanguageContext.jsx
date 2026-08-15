import { createContext, useContext, useState } from "react";
import translations from "./translations";
import { euTranslations } from "./translations_eu";
import { planBuilderTranslations } from "./translations_planbuilder";
import navTranslations from "./translations_nav";
import macroLabelTranslations from "./translations_macros";

// Deep-merge per language so Plan Builder keys don't overwrite full language objects.
const _merged = { ...translations };
Object.keys(planBuilderTranslations).forEach((lang) => {
  _merged[lang] = { ...(_merged[lang] || {}), ...planBuilderTranslations[lang] };
});
const allTranslations = { ..._merged, ...euTranslations };
// Merge nav labels last so they apply to every language (main + EU).
Object.keys(navTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...navTranslations[lang] };
});
// Merge macro section labels (Protein/Carbs/Fats) for every language.
Object.keys(macroLabelTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...macroLabelTranslations[lang] };
});

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("app_language") || "en"
  );

  const changeLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem("app_language", code);
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const t = (key, vars) => {
    let str = allTranslations[language]?.[key] ?? allTranslations.en[key] ?? key;
    if (vars && typeof str === "string") {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, currentLanguage, changeLanguage, LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}