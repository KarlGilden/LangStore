import type { ComponentProps } from "react";

type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
	const classes = [
		"min-h-32 w-full resize-y rounded-md border border-input bg-card px-4 py-3 font-sans text-card-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <textarea className={classes} {...props} />;
}
