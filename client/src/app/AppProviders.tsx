import { ClerkProvider } from "@clerk/react";
import type { ReactNode } from "react";
import { env } from "../config/env";
import { ThemeProvider } from "../theme/ThemeProvider";
import { router } from "./router";

const pushRoute = (destination: string) => router.navigate(destination);

const replaceRoute = (destination: string) =>
  router.navigate(destination, { replace: true });

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      routerPush={pushRoute}
      routerReplace={replaceRoute}
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/collections"
      signUpFallbackRedirectUrl="/collections"
    >
      <ThemeProvider>{children}</ThemeProvider>
    </ClerkProvider>
  );
}
