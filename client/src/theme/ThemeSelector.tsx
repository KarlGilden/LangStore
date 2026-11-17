import { themes, type ThemePreference } from "./themes";
import { useTheme } from "./useTheme";

export function ThemeSelector() {
  const { preference, setPreference } = useTheme();

  return (
    <label className="flex items-center gap-3 text-sm text-muted-foreground">
      <span>Appearance</span>
      <select
        className="rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        value={preference}
        onChange={(event) =>
          setPreference(event.currentTarget.value as ThemePreference)
        }
      >
        <option value="system">System</option>
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  );
}
