import type { ReactNode } from "react";
import { ThemeProvider } from "../theme/ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
