import { ClerkProvider } from "@clerk/react";
import type { ReactNode } from "react";
import { env } from "../config/env";
import { ThemeProvider } from "../theme/ThemeProvider";
import { router } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const pushRoute = (destination: string) => router.navigate(destination);

const replaceRoute = (destination: string) =>
	router.navigate(destination, { replace: true });

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

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
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>{children}</ThemeProvider>
			</QueryClientProvider>
		</ClerkProvider>
	);
}
