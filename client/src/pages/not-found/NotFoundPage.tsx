import { DEFAULT_LANGUAGE_ISO } from "@langstore/contracts";
import { paths } from "../../router/paths";
import { useSession } from "../../auth/useSession";
import { useUserSettings } from "../../api/queries/useUserSettings";
import { Button } from "../../components/ui/Button";
import { ButtonType } from "../../components/ui/Button.types";

export function NotFoundPage() {
	const { isLoaded, isSignedIn } = useSession();
	const { data: settings, isLoading: isSettingsLoading } = useUserSettings();

	if (isSettingsLoading) return "Loading";

	const homePath =
		isLoaded && isSignedIn
			? paths.collections(settings?.targetLanguage || DEFAULT_LANGUAGE_ISO)
			: paths.home;

	return (
		<main className="grid min-h-dvh place-items-center bg-background px-5 py-16 text-foreground">
			<section
				className="max-w-xl text-center"
				aria-labelledby="not-found-heading"
			>
				<p className="font-display text-lg text-primary">404</p>
				<h1
					className="mt-3 font-display text-5xl font-semibold tracking-tight"
					id="not-found-heading"
				>
					Page not found
				</h1>
				<p className="mt-5 leading-7 text-muted-foreground">
					The page may have moved, or the address may be incomplete.
				</p>
				<Button
					buttonType={ButtonType.Solid}
					className="mt-8"
					to={homePath}
				>
					Go to collections
				</Button>
			</section>
		</main>
	);
}
