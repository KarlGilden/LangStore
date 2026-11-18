import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ThemeContext } from "./theme-context";
import {
  isThemePreference,
  THEME_STORAGE_KEY,
  type ThemeName,
  type ThemePreference,
} from "./themes";

const darkModeQuery = "(prefers-color-scheme: dark)";

function readStoredPreference(): ThemePreference {
  try {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedPreference) ? storedPreference : "system";
  } catch {
    return "system";
  }
}

function readSystemTheme(): ThemeName {
  return window.matchMedia(darkModeQuery).matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setStoredPreference] =
    useState<ThemePreference>(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ThemeName>(readSystemTheme);

  const resolvedTheme =
    preference === "system" ? systemTheme : preference;

  useEffect(() => {
    const mediaQuery = window.matchMedia(darkModeQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setStoredPreference(nextPreference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
