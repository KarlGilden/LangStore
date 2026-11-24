import { useParams } from "react-router";
import { useCollection } from "../../api/queries/useCollection";
import { useCollectionPages } from "../../api/queries/useCollectionPages";
import { LinkedResourceItem } from "../../components/common/LinkedResourceItem";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { Button } from "../../components/ui/Button";
import { ButtonSize, ButtonType } from "../../components/ui/Button.types";
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
			<Button
				buttonType={ButtonType.Back}
				to={paths.collections(iso)}
			>
				<ArrowLeftIcon className="size-4" />
				All collections
			</Button>

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
				<div className="flex flex-wrap items-center gap-3">
					<Button
						buttonType={ButtonType.Outline}
						size={ButtonSize.Compact}
						to={paths.editCollection(iso, collection.id)}
					>
						Edit collection
					</Button>
					<Button
						buttonType={ButtonType.AddNew}
						to={paths.newPage(iso, collection.id)}
					>
						New page
					</Button>
				</div>
			</header>

			<div className="mt-8">
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
