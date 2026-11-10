import { Moon, Sun } from "lucide-react";
import { useApp } from "../app/AppContext";

export function ThemeToggle({ expanded = false }: { expanded?: boolean }) {
  const { language, theme, setTheme } = useApp();
  const ar = language === "ar";
  const dark = theme === "dark";
  const label = dark ? (ar ? "الوضع الفاتح" : "Switch to light mode") : (ar ? "الوضع الغامق" : "Switch to dark mode");
  return <button type="button" className={`theme-toggle ${expanded ? "expanded" : ""}`} onClick={() => setTheme(dark ? "light" : "dark")} aria-label={label} title={label}>
    {dark ? <Sun size={18} /> : <Moon size={18} />}
    {expanded && <span>{ar ? (dark ? "الوضع الغامق" : "الوضع الفاتح") : (dark ? "Dark mode" : "Light mode")}</span>}
  </button>;
}
