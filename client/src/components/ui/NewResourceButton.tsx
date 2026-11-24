import type { ReactNode } from "react";
import { Link } from "react-router";

interface NewResourceButtonProps {
	children: ReactNode;
	to: string;
}

export function NewResourceButton({
	children,
	to,
}: NewResourceButtonProps) {
	return (
		<Link
			className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			to={to}
		>
			{children}
		</Link>
	);
}
