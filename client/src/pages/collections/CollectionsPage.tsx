import { useParams } from "react-router";
import { useCollections } from "../../api/queries/useCollections";
import { LinkedResourceItem } from "../../components/common/LinkedResourceItem";
import { ItemList } from "../../components/ui/ItemList";
import { NewResourceButton } from "../../components/ui/NewResourceButton";
import { paths } from "../../router/paths";

export function CollectionsPage() {
	const { iso = "" } = useParams();
	const { data: collections, error, isLoading } = useCollections(iso);

	return (
		<section className="mx-auto max-w-5xl">
			<header className="grid items-end gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div className="max-w-2xl">
					<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
						Collections
					</h1>
					<p className="mt-4 text-base leading-7 text-muted-foreground">
						Return to a book or reading project and continue from the pages you
						have saved.
					</p>
				</div>
				<NewResourceButton to={paths.newCollection(iso)}>
					New collection
				</NewResourceButton>
			</header>

			<ItemList
				className="mt-10"
				emptyMessage="Create a collection before uploading your first page."
				emptyTitle="No collections yet"
				error={error}
				errorMessage="Collections could not be loaded. Try again shortly."
				getKey={(collection) => collection.id}
				isLoading={isLoading}
				items={collections}
				loadingMessage="Loading collections…"
			>
				{(collection) => (
					<LinkedResourceItem
						description={collection.description}
						imageUrl={collection.imgUrl}
						kind="collection"
						meta="View saved pages"
						title={collection.name}
						to={paths.collection(iso, collection.id)}
					/>
				)}
			</ItemList>
		</section>
	);
}
