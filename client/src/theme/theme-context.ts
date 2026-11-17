import { createContext } from "react";
import type { ThemeName, ThemePreference } from "./themes";

export type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ThemeName;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
