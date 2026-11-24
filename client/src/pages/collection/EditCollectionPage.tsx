import { Link, useNavigate, useParams } from "react-router";
import { useUpdateCollection } from "../../api/mutations/useUpdateCollection";
import { useCollection } from "../../api/queries/useCollection";
import {
	CollectionForm,
	type CollectionFormValues,
} from "../../components/collections/CollectionForm";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { PageStatus } from "../../components/ui/PageStatus";
import { paths } from "../../router/paths";

export function EditCollectionPage() {
	const { collectionId = "", iso = "" } = useParams();
	const navigate = useNavigate();
	const collectionQuery = useCollection(iso, collectionId);
	const updateCollection = useUpdateCollection();
	const collection = collectionQuery.data;

	if (collectionQuery.isLoading) {
		return <PageStatus message="Loading collection..." />;
	}

	if (collectionQuery.error || !collection) {
		return (
			<PageStatus
				message="This collection could not be loaded. Return to collections and try again."
				tone="error"
			/>
		);
	}

	const collectionPath = paths.collection(iso, collection.id);

	const handleSubmit = ({ name, description }: CollectionFormValues) => {
		updateCollection.mutate(
			{
				iso,
				collectionId: collection.id,
				name,
				description,
				imgUrl: collection.imgUrl,
			},
			{
				onSuccess: () => navigate(collectionPath),
			},
		);
	};

	return (
		<section className="mx-auto max-w-3xl">
			<Link
				className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
				to={collectionPath}
			>
				<ArrowLeftIcon className="size-4" />
				{collection.name}
			</Link>

			<header className="mt-6 max-w-2xl">
				<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
					Edit collection
				</h1>
				<p className="mt-4 text-base leading-7 text-muted-foreground">
					Update how this book or reading project appears in your library.
				</p>
			</header>

			<CollectionForm
				cancelTo={collectionPath}
				initialDescription={collection.description}
				initialName={collection.name}
				key={collection.id}
				onSubmit={handleSubmit}
				pending={updateCollection.isPending}
				pendingLabel="Saving..."
				submitLabel="Save changes"
			/>

			{updateCollection.isError ? (
				<p
					className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{updateCollection.error.message}
				</p>
			) : null}
		</section>
	);
}
