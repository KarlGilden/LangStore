import { Navigate, Outlet } from "react-router";
import { defaultAppPath } from "../router/paths";
import { useSession } from "./useSession";

export function HomeGate() {
	const session = useSession();

	if (!session.isLoaded) {
		return (
			<main className="grid min-h-dvh place-items-center bg-background px-5 text-foreground">
				<p className="text-sm text-muted-foreground" role="status">
					Checking your session&hellip;
				</p>
			</main>
		);
	}

	return session.isSignedIn ? (
		<Navigate replace to={defaultAppPath} />
	) : (
		<Outlet />
	);
}
