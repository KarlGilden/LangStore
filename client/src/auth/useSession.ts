import { useAuth } from "@clerk/react";
import { useCallback } from "react";
import { paths } from "../app/paths";

export interface SessionAdapter {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useSession(): SessionAdapter {
  const auth = useAuth();
  const signOut = useCallback(
    () => auth.signOut({ redirectUrl: paths.signIn }),
    [auth.signOut],
  );

  return {
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn === true,
    userId: auth.userId ?? null,
    getToken: auth.getToken,
    signOut,
  };
}
