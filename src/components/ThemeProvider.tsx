import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light" | "system";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "dark",
  setTheme: () => undefined,
});

const STORAGE_KEY = "btech-notes-theme";

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
    setThemeState(stored);
    apply(stored);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    apply(next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
