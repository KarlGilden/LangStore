import { Navigate, Outlet, useLocation } from "react-router";
import {
  createSignInDestination,
  validateReturnDestination,
} from "./return-destination";
import { useSession } from "./useSession";

export function AuthShell() {
  const session = useSession();
  const location = useLocation();

  if (!session.isLoaded) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-5 text-foreground">
        <p className="text-sm text-muted-foreground" role="status">
          Checking your session&hellip;
        </p>
      </main>
    );
  }

  if (!session.isSignedIn) {
    const requestedDestination = validateReturnDestination(
      `${location.pathname}${location.search}${location.hash}`,
    );

    return (
      <Navigate
        replace
        to={createSignInDestination(requestedDestination)}
      />
    );
  }

  return <Outlet />;
}
