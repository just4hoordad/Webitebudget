import { createContext, useContext, useEffect, useState } from "react";
import translations from "./translations";
import { euTranslations } from "./translations_eu";
import { planBuilderTranslations } from "./translations_planbuilder";
import navTranslations from "./translations_nav";
import macroLabelTranslations from "./translations_macros";
import sectionLabelTranslations from "./translations_sections";
import { pantryTranslations } from "./translations_pantry";
import { loaderTranslations } from "./translations_loader";
import calorieTranslations from "./translations_calorie";
import sharedTranslations from "./translations_shared";

// Deep-merge per language so Plan Builder keys don't overwrite full language objects.
const _merged = { ...translations };
Object.keys(planBuilderTranslations).forEach((lang) => {
  _merged[lang] = { ...(_merged[lang] || {}), ...planBuilderTranslations[lang] };
});
const allTranslations = { ..._merged };
Object.keys(euTranslations).forEach((lang) => {
  allTranslations[lang] = { ...euTranslations[lang], ...(allTranslations[lang] || {}) };
});
// Merge nav labels last so they apply to every language (main + EU).
Object.keys(navTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...navTranslations[lang] };
});
// Merge macro section labels (Protein/Carbs/Fats) for every language.
Object.keys(macroLabelTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...macroLabelTranslations[lang] };
});
// Merge BudgetForm section headers + macro title/desc for every language.
Object.keys(sectionLabelTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...sectionLabelTranslations[lang] };
});
// Merge Pantry Dashboard labels + category names for every language.
Object.keys(pantryTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...pantryTranslations[lang] };
});
// Merge GeneratingLoader strings for every language.
Object.keys(loaderTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...loaderTranslations[lang] };
});
// Merge Calorie calculator labels for every language.
Object.keys(calorieTranslations).forEach((lang) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...calorieTranslations[lang] };
});

Object.entries(sharedTranslations).forEach(([lang, labels]) => {
  allTranslations[lang] = { ...(allTranslations[lang] || {}), ...labels };
});

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", cc: "gb" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", cc: "de" },
  { code: "fa", label: "فارسی", flag: "🇮🇷", cc: "ir" },
  { code: "ru", label: "Русский", flag: "🇷🇺", cc: "ru" },
  { code: "zh", label: "中文", flag: "🇨🇳", cc: "cn" },
  { code: "fr", label: "Français", flag: "🇫🇷", cc: "fr" },
  { code: "es", label: "Español", flag: "🇪🇸", cc: "es" },
  { code: "it", label: "Italiano", flag: "🇮🇹", cc: "it" },
  { code: "pt", label: "Português", flag: "🇵🇹", cc: "pt" },
  { code: "pl", label: "Polski", flag: "🇵🇱", cc: "pl" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", cc: "nl" },
  { code: "sv", label: "Svenska", flag: "🇸🇪", cc: "se" },
  { code: "no", label: "Norsk", flag: "🇳🇴", cc: "no" },
  { code: "da", label: "Dansk", flag: "🇩🇰", cc: "dk" },
  { code: "fi", label: "Suomi", flag: "🇫🇮", cc: "fi" },
  { code: "cs", label: "Čeština", flag: "🇨🇿", cc: "cz" },
  { code: "hu", label: "Magyar", flag: "🇭🇺", cc: "hu" },
  { code: "ro", label: "Română", flag: "🇷🇴", cc: "ro" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷", cc: "gr" },
  { code: "uk", label: "Українська", flag: "🇺🇦", cc: "ua" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", cc: "tr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", cc: "sa" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", cc: "vn" },
];

const LanguageContext = createContext({
  language: "en",
  currentLanguage: { code: "en", label: "English", flag: "🇬🇧", cc: "gb" },
  changeLanguage: () => {},
  LANGUAGES: [{ code: "en", label: "English", flag: "🇬🇧", cc: "gb" }],
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("app_language") || "en"
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = ["ar", "fa"].includes(language) ? "rtl" : "ltr";
  }, [language]);

  const changeLanguage = (code) => {
    if (!LANGUAGES.some((lang) => lang.code === code)) return;
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