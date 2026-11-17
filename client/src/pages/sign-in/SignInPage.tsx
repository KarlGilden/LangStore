import { SignIn } from "@clerk/react";
import { Navigate, useSearchParams } from "react-router";
import { paths } from "../../router/paths";
import {
	RETURN_DESTINATION_PARAM,
	createSignInDestination,
	validateReturnDestination,
} from "../../auth/return-destination";
import { useSession } from "../../auth/useSession";
import { ThemeSelector } from "../../theme/ThemeSelector";

export function SignInPage() {
	const session = useSession();
	const [searchParams] = useSearchParams();
	const requestedDestination = searchParams.get(RETURN_DESTINATION_PARAM);
	const returnDestination = validateReturnDestination(requestedDestination);

	if (!session.isLoaded) {
		return (
			<main className="grid min-h-dvh place-items-center bg-background px-5 text-foreground">
				<p className="text-sm text-muted-foreground" role="status">
					Preparing sign in&hellip;
				</p>
			</main>
		);
	}

	if (session.isSignedIn) {
		return <Navigate replace to={returnDestination} />;
	}

	if (
		requestedDestination !== null &&
		requestedDestination !== returnDestination
	) {
		return <Navigate replace to={createSignInDestination(returnDestination)} />;
	}

	return (
		<main className="min-h-dvh bg-background px-5 py-6 text-foreground sm:px-8">
			<div className="mx-auto flex max-w-6xl items-center justify-between">
				<span className="font-display text-xl font-semibold tracking-tight">
					LangStore
				</span>
				<ThemeSelector />
			</div>

			<div className="mx-auto grid max-w-6xl items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.7fr)] lg:py-24">
				<section aria-labelledby="sign-in-heading">
					<p className="text-sm leading-6 text-muted-foreground">
						Private vocabulary from the books you read
					</p>
					<h1
						className="mt-4 max-w-[11ch] font-display text-5xl leading-[0.98] font-semibold tracking-[-0.035em] sm:text-6xl"
						id="sign-in-heading"
					>
						Return to your words.
					</h1>
					<p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
						Sign in with the existing LangStore account to view your private
						collections.
					</p>
				</section>

				<div className="flex justify-center lg:justify-end">
					<SignIn
						fallbackRedirectUrl={returnDestination}
						forceRedirectUrl={returnDestination}
						path={paths.signIn}
						routing="path"
						signUpForceRedirectUrl={returnDestination}
					/>
				</div>
			</div>
		</main>
	);
}
