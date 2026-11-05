import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  /** The user's preference: light, dark or follow the system. */
  theme: Theme;
  /** What is actually applied right now. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "portfolio-theme";
const MEDIA = "(prefers-color-scheme: dark)";

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* storage unavailable (private mode, disabled) */
  }
  return fallback;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(MEDIA);
    const onChange = () => setSystem(media.matches ? "dark" : "light");
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? system : theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo<ThemeProviderState>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next: Theme) => {
        try {
          localStorage.setItem(storageKey, next);
        } catch {
          /* ignore */
        }
        setThemeState(next);
      },
    }),
    [theme, resolvedTheme, storageKey],
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
