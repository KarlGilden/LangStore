import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { paths } from "../app/paths";
import { useSession } from "../auth/useSession";
import { ThemeSelector } from "../theme/ThemeSelector";

export function AppShell() {
  const { signOut } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      await signOut();
    } catch {
      setSignOutError("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[12rem_1fr]">
      <aside className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground md:min-h-dvh md:flex-col md:items-stretch md:justify-start md:px-6 md:py-7">
        <NavLink
          className="font-display text-xl font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
          to={paths.collections}
        >
          LangStore
        </NavLink>
        <nav aria-label="Primary" className="md:mt-12">
          <NavLink
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground md:block ${
                isActive
                  ? "bg-primary-foreground text-primary"
                  : "text-primary-foreground hover:bg-primary-foreground/10"
              }`
            }
            to={paths.collections}
          >
            Collections
          </NavLink>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 flex-wrap items-center justify-end gap-3 border-b border-border px-5 py-3 sm:px-8">
          <ThemeSelector />
          <button
            className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground outline-none hover:bg-muted disabled:cursor-wait disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </header>

        {signOutError ? (
          <p
            className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive sm:px-8"
            role="alert"
          >
            {signOutError}
          </p>
        ) : null}

        <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
