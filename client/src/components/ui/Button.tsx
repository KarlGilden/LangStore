import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { ButtonSize, ButtonType } from "./Button.types";

const BUTTON_CLASSES: Record<ButtonType, string> = {
	[ButtonType.AddNew]:
		"inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	[ButtonType.Back]:
		"inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
	[ButtonType.Delete]:
		"inline-flex items-center justify-center rounded-md border border-destructive/40 font-semibold text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring",
	[ButtonType.Destructive]:
		"inline-flex items-center justify-center rounded-md bg-destructive font-semibold text-destructive-foreground outline-none hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring",
	[ButtonType.Floating]:
		"inline-flex min-h-14 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-xl outline-none hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	[ButtonType.Ghost]:
		"inline-flex items-center justify-center rounded-md font-semibold text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
	[ButtonType.Icon]:
		"grid size-11 shrink-0 place-items-center rounded-md border border-border bg-card outline-none hover:bg-muted disabled:cursor-wait disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring",
	[ButtonType.Outline]:
		"inline-flex items-center justify-center rounded-md border border-border bg-card font-semibold outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
	[ButtonType.Solid]:
		"inline-flex items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
	[ButtonSize.Compact]: "min-h-10 px-3 py-2 text-sm",
	[ButtonSize.Medium]: "min-h-11 px-4 py-2.5",
	[ButtonSize.Large]: "min-h-12 px-5 py-3",
};

const DEFAULT_BUTTON_SIZES: Partial<Record<ButtonType, ButtonSize>> = {
	[ButtonType.Delete]: ButtonSize.Medium,
	[ButtonType.Destructive]: ButtonSize.Medium,
	[ButtonType.Ghost]: ButtonSize.Medium,
	[ButtonType.Outline]: ButtonSize.Medium,
	[ButtonType.Solid]: ButtonSize.Large,
};

interface SharedButtonProps {
	buttonType: ButtonType;
	children: ReactNode;
	className?: string;
	size?: ButtonSize;
}

type NativeButtonProps = SharedButtonProps &
	Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
		to?: never;
	};

type ButtonLinkProps = SharedButtonProps &
	Omit<LinkProps, "children" | "className" | "to"> & {
		to: LinkProps["to"];
	};

export type ButtonProps = NativeButtonProps | ButtonLinkProps;

export function Button(props: ButtonProps) {
	if (isButtonLink(props)) {
		const { buttonType, children, className, size, ...linkProps } = props;
		return (
			<Link
				className={getButtonClasses(buttonType, size, className)}
				{...linkProps}
			>
				{children}
			</Link>
		);
	}

	const {
		buttonType,
		children,
		className,
		size,
		type = "button",
		...buttonProps
	} = props;
	return (
		<button
			className={getButtonClasses(buttonType, size, className)}
			type={type}
			{...buttonProps}
		>
			{children}
		</button>
	);
}

function getButtonClasses(
	buttonType: ButtonType,
	size: ButtonSize | undefined,
	className?: string,
): string {
	const resolvedSize = size ?? DEFAULT_BUTTON_SIZES[buttonType];
	return [
		BUTTON_CLASSES[buttonType],
		resolvedSize ? BUTTON_SIZE_CLASSES[resolvedSize] : null,
		"disabled:cursor-not-allowed disabled:opacity-50",
		className,
	]
		.filter(Boolean)
		.join(" ");
}

function isButtonLink(props: ButtonProps): props is ButtonLinkProps {
	return "to" in props && props.to !== undefined;
}
