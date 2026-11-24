import { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router";
import { DEFAULT_LANGUAGE_ISO } from "@langstore/contracts";
import { paths } from "../router/paths";
import { useSession } from "../auth/useSession";
import { ThemeSelector } from "../theme/ThemeSelector";
import { Button } from "../components/ui/Button";
import { ButtonSize, ButtonType } from "../components/ui/Button.types";

export function AppShell() {
	const { iso = DEFAULT_LANGUAGE_ISO } = useParams();
	const collectionsPath = paths.collections(iso);
	const uploadPath = paths.upload(iso);
	const reviewPath = paths.review(iso);
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
					to={collectionsPath}
				>
					LangStore
				</NavLink>
				<nav aria-label="Primary" className="md:mt-12">
					<ul className="flex gap-1 md:block md:space-y-2">
						<li>
							<NavLink
								className={navLinkClassName}
								to={collectionsPath}
							>
								Collections
							</NavLink>
						</li>
						<li>
							<NavLink className={navLinkClassName} to={uploadPath}>
								Upload
							</NavLink>
						</li>
						<li>
							<NavLink className={navLinkClassName} to={reviewPath}>
								Review
							</NavLink>
						</li>
					</ul>
				</nav>
			</aside>

			<div className="min-w-0">
				<header className="flex min-h-16 flex-wrap items-center justify-end gap-3 border-b border-border px-5 py-3 sm:px-8">
					<ThemeSelector />
					<Button
						buttonType={ButtonType.Outline}
						disabled={isSigningOut}
						onClick={handleSignOut}
						size={ButtonSize.Compact}
						type="button"
					>
						{isSigningOut ? "Signing out…" : "Sign out"}
					</Button>
				</header>

				{signOutError ? (
					<p
						className="border-b border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive sm:px-8"
						role="alert"
					>
						{signOutError}
					</p>
				) : null}

				<main className="w-full px-5 py-10 sm:px-8 sm:py-14 lg:px-14">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

function navLinkClassName({ isActive }: { isActive: boolean }): string {
	return `block rounded-md px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground ${
		isActive
			? "bg-primary-foreground text-primary"
			: "text-primary-foreground hover:bg-primary-foreground/10"
	}`;
}
