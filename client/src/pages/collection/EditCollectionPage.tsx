import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDeleteCollection } from "../../api/mutations/useDeleteCollection";
import { useUpdateCollection } from "../../api/mutations/useUpdateCollection";
import { useCollection } from "../../api/queries/useCollection";
import {
	CollectionForm,
	type CollectionFormValues,
} from "../../components/collections/CollectionForm";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { Button } from "../../components/ui/Button";
import { ButtonType } from "../../components/ui/Button.types";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageStatus } from "../../components/ui/PageStatus";
import { paths } from "../../router/paths";

export function EditCollectionPage() {
	const { collectionId = "", iso = "" } = useParams();
	const navigate = useNavigate();
	const collectionQuery = useCollection(iso, collectionId);
	const updateCollection = useUpdateCollection();
	const deleteCollection = useDeleteCollection();
	const [confirmingDelete, setConfirmingDelete] = useState(false);
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

	const handleDelete = () => {
		deleteCollection.mutate(
			{ iso, collectionId: collection.id },
			{ onSuccess: () => navigate(paths.collections(iso), { replace: true }) },
		);
	};

	return (
		<section className="mx-auto max-w-3xl">
			<Button
				buttonType={ButtonType.Back}
				to={collectionPath}
			>
				<ArrowLeftIcon className="size-4" />
				{collection.name}
			</Button>

			<header className="mt-6 grid max-w-3xl gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div className="max-w-2xl">
					<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
						Edit collection
					</h1>
					<p className="mt-4 text-base leading-7 text-muted-foreground">
						Update how this book or reading project appears in your library.
					</p>
				</div>
				<Button
					buttonType={ButtonType.Delete}
					onClick={() => setConfirmingDelete(true)}
					type="button"
				>
					Delete collection
				</Button>
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

			{deleteCollection.isError ? (
				<p
					className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{deleteCollection.error.message}
				</p>
			) : null}

			<ConfirmDialog
				cancelLabel="Cancel"
				confirmLabel={deleteCollection.isPending ? "Deleting..." : "Delete collection"}
				description={`Delete ${collection.name} and all of its pages and encounters? Saved words will remain in your vocabulary.`}
				onConfirm={handleDelete}
				onDismiss={() => {
					if (!deleteCollection.isPending) setConfirmingDelete(false);
				}}
				open={confirmingDelete}
				pending={deleteCollection.isPending}
				title="Delete collection?"
			/>
		</section>
	);
}
