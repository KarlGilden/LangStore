import { Link } from "react-router";

interface LinkedResourceItemProps {
	to: string;
	title: string;
	description: string | null;
	meta: string;
	kind: "collection" | "page";
	imageUrl?: string | null;
}

export function LinkedResourceItem({
	to,
	title,
	description,
	meta,
	kind,
	imageUrl,
}: LinkedResourceItemProps) {
	return (
		<li className="border-b border-border last:border-b-0">
			<Link
				className="group grid min-h-28 grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 px-4 py-5 outline-none hover:bg-muted focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:gap-6 sm:px-6"
				to={to}
			>
				<ResourceVisual imageUrl={imageUrl} kind={kind} title={title} />
				<span className="min-w-0">
					<span className="block font-display text-xl font-semibold tracking-tight text-card-foreground sm:text-2xl">
						{title}
					</span>
					<span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">
						{description || "No description"}
					</span>
					<span className="mt-2 block text-xs font-medium text-primary">
						{meta}
					</span>
				</span>
				<svg
					aria-hidden="true"
					className="size-5 text-muted-foreground group-hover:text-primary"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						d="m9 18 6-6-6-6"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.8"
					/>
				</svg>
			</Link>
		</li>
	);
}

function ResourceVisual({
	imageUrl,
	kind,
	title,
}: Pick<LinkedResourceItemProps, "imageUrl" | "kind" | "title">) {
	if (imageUrl) {
		return (
			<img
				alt=""
				className="h-20 w-full rounded-md border border-border object-cover"
				src={imageUrl}
			/>
		);
	}

	return (
		<span
			aria-hidden="true"
			className="grid h-20 w-full place-items-center rounded-md border border-border bg-secondary text-secondary-foreground"
		>
			{kind === "collection" ? (
				<span className="font-display text-3xl font-semibold">
					{title.slice(0, 1).toLocaleUpperCase()}
				</span>
			) : (
				<PageIcon />
			)}
		</span>
	);
}

function PageIcon() {
	return (
		<svg className="size-8" fill="none" viewBox="0 0 32 32">
			<path
				d="M9 4.5h9l5 5v18H9v-23Z"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M18 4.5v5h5M13 15h6M13 19h6M13 23h4"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
		</svg>
	);
}
