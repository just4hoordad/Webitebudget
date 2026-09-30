import { Moon, Cloud } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";

const META = {
  soft: { icon: Cloud, label: "Soft", title: "Soft gray mode" },
  dark: { icon: Moon, label: "Dark", title: "Dark mode" },
};

const THEMES_NEXT = { soft: "dark", dark: "soft" };

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  const { icon: Icon } = META[theme] || META.soft;
  const title = t(theme === "dark" ? "themeDark" : "themeSoft");
  const next = t(THEMES_NEXT[theme] === "dark" ? "themeDark" : "themeSoft");
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={next}
      title={title}
      className={`inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors select-none ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}