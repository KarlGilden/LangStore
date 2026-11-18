interface PageStatusProps {
	message: string;
	title?: string;
	tone?: "muted" | "error";
	compact?: boolean;
	className?: string;
}

export function PageStatus({
	message,
	title,
	tone = "muted",
	compact = false,
}: PageStatusProps) {
	return (
		<div
			className={`${compact ? "py-10" : "mx-auto max-w-3xl py-20"} text-center ${tone === "error" ? "text-destructive" : "text-muted-foreground"}`}
			role={tone === "error" ? "alert" : "status"}
		>
			{title ? (
				<h2 className="font-display text-2xl font-semibold text-foreground">
					{title}
				</h2>
			) : null}
			<p className={title ? "mt-2 text-sm leading-6" : undefined}>{message}</p>
		</div>
	);
}
