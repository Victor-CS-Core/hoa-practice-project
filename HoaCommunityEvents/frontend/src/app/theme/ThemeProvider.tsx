import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme-context";

const STORAGE_KEY = "hoa-theme-preference";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function resolveTheme(
  preference: ThemePreference,
  systemIsDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemIsDark ? "dark" : "light";
  }

  return preference;
}

function applyThemeToDocument(theme: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(getStoredPreference);
  const [systemIsDark, setSystemIsDark] = useState(
    () => getSystemTheme() === "dark",
  );

  const resolvedTheme = useMemo(
    () => resolveTheme(themePreference, systemIsDark),
    [themePreference, systemIsDark],
  );

  useLayoutEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setThemePreferenceState(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, []);

  const toggleTheme = useCallback(() => {
    const current =
      themePreference === "system" ? resolvedTheme : themePreference;
    setThemePreference(current === "dark" ? "light" : "dark");
  }, [themePreference, resolvedTheme, setThemePreference]);

  const value = useMemo(
    () => ({
      themePreference,
      resolvedTheme,
      setThemePreference,
      toggleTheme,
    }),
    [themePreference, resolvedTheme, setThemePreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
