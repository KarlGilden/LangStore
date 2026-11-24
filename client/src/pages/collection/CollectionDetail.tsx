import { Link, useParams } from "react-router";
import { useCollection } from "../../api/queries/useCollection";
import { useCollectionPages } from "../../api/queries/useCollectionPages";
import { LinkedResourceItem } from "../../components/common/LinkedResourceItem";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { ItemList } from "../../components/ui/ItemList";
import { PageStatus } from "../../components/ui/PageStatus";
import { paths } from "../../router/paths";

export function CollectionDetail() {
	const { collectionId = "", iso = "" } = useParams();
	const collectionQuery = useCollection(iso, collectionId);
	const pagesQuery = useCollectionPages(iso, collectionId);
	const collection = collectionQuery.data;

	if (collectionQuery.isLoading) {
		return <PageStatus message="Loading collection…" />;
	}

	if (collectionQuery.error || !collection) {
		return (
			<PageStatus
				message="This collection could not be loaded. Return to collections and try again."
				tone="error"
			/>
		);
	}

	return (
		<section className="mx-auto max-w-5xl">
			<Link
				className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
				to={paths.collections(iso)}
			>
				<ArrowLeftIcon className="size-4" />
				All collections
			</Link>

			<header className="mt-6 grid items-end gap-6 border-b border-border pb-8 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div className="max-w-3xl">
					<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
						{collection.name}
					</h1>
					{collection.description ? (
						<p className="mt-4 text-base leading-7 text-muted-foreground">
							{collection.description}
						</p>
					) : null}
				</div>
				<Link
					className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					to={paths.upload(iso)}
				>
					Add a page
				</Link>
			</header>

			<div className="mt-8">
				<h2 className="font-display text-2xl font-semibold tracking-tight">
					Saved pages
				</h2>
				<ItemList
					className="mt-4"
					emptyMessage="Upload a page to start building this collection."
					emptyTitle="No saved pages"
					error={pagesQuery.error}
					errorMessage="Pages could not be loaded. Try again shortly."
					getKey={(page) => page.id}
					isLoading={pagesQuery.isLoading}
					items={pagesQuery.data}
					loadingMessage="Loading pages…"
				>
					{(page) => (
						<LinkedResourceItem
							description={page.description}
							kind="page"
							meta={formatSavedDate(page.createdAt)}
							title={page.name}
							to={paths.page(iso, collection.id, page.id)}
						/>
					)}
				</ItemList>
			</div>
		</section>
	);
}

function formatSavedDate(value: string): string {
	return `Saved ${new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
	}).format(new Date(value))}`;
}
