import type { ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

export function Input({ className, ...props }: InputProps) {
	const classes = [
		"min-h-12 w-full rounded-md border border-input bg-card px-4 py-3 text-card-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <input className={classes} {...props} />;
}
