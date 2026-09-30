import { Moon, Sun, Cloud } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const META = {
  light: { icon: Sun, label: "Light", title: "Light mode" },
  soft: { icon: Cloud, label: "Soft", title: "Soft gray mode" },
  dark: { icon: Moon, label: "Dark", title: "Dark mode" },
};

const THEMES_NEXT = { light: "soft", soft: "dark", dark: "light" };

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const { icon: Icon, title } = META[theme] || META.light;
  const next = META[THEMES_NEXT[theme]]?.title || "Light mode";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next}`}
      title={title}
      className={`inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors select-none ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}