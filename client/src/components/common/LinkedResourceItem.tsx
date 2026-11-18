import { Link } from "react-router";
import { ChevronRightIcon } from "../icons/ChevronRightIcon";
import { PageIcon } from "../icons/PageIcon";

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
				<ChevronRightIcon className="size-5 text-muted-foreground group-hover:text-primary" />
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
				<PageIcon className="size-8" />
			)}
		</span>
	);
}
