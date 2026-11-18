import type { ReactNode } from "react";

interface TabButtonProps {
	active: boolean;
	children: ReactNode;
	controls: string;
	id: string;
	onClick: () => void;
}

export function TabButton({
	active,
	children,
	controls,
	id,
	onClick,
}: TabButtonProps) {
	return (
		<button
			aria-controls={controls}
			aria-selected={active}
			className={`relative min-h-12 px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${active ? "text-primary after:absolute after:right-3 after:bottom-0 after:left-3 after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground"}`}
			id={id}
			onClick={onClick}
			role="tab"
			type="button"
		>
			{children}
		</button>
	);
}
