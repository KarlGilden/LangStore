import { DEFAULT_LANGUAGE_ISO, isSupportedLanguageIso } from "@langstore/contracts";
import { Navigate, Outlet, useParams } from "react-router";
import { useUserSettings } from "../api/queries/useUserSettings";
import { paths } from "../router/paths";
import { useSession } from "./useSession";

export function HomeGate() {
	const session = useSession();
	const { iso } = useParams();
	const settings = useUserSettings(iso === undefined);

	if (!session.isLoaded || settings.isLoading) {
		return (
			<main className="grid min-h-dvh place-items-center bg-background px-5 text-foreground">
				<p className="text-sm text-muted-foreground" role="status">
					Loading your workspace&hellip;
				</p>
			</main>
		);
	}

	const preferredLanguage = settings.data?.targetLanguage ?? DEFAULT_LANGUAGE_ISO;
	const language = iso ?? (isSupportedLanguageIso(preferredLanguage)
		? preferredLanguage
		: DEFAULT_LANGUAGE_ISO);

	return session.isSignedIn ? (
		<Navigate replace to={paths.collections(language)} />
	) : (
		<Outlet />
	);
}
