export const THEME_STORAGE_KEY = "langstore-theme";

export const themes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

export type ThemeName = (typeof themes)[number]["id"];
export type ThemePreference = ThemeName | "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
