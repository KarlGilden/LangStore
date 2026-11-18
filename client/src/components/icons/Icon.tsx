import type { ReactNode } from "react";

export interface IconProps {
	className?: string;
}

export const ICON_STROKE_WIDTH = 1.8;

interface IconBaseProps extends IconProps {
	children: ReactNode;
}

export function Icon({ children, className }: IconBaseProps) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			focusable="false"
			viewBox="0 0 24 24"
		>
			{children}
		</svg>
	);
}
