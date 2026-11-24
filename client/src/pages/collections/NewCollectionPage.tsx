import { Link, useNavigate, useParams } from "react-router";
import { useCreateCollection } from "../../api/mutations/useCreateCollection";
import {
	CollectionForm,
	type CollectionFormValues,
} from "../../components/collections/CollectionForm";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { paths } from "../../router/paths";

export function NewCollectionPage() {
	const { iso = "" } = useParams();
	const navigate = useNavigate();
	const createCollection = useCreateCollection();

	const handleSubmit = ({ name, description }: CollectionFormValues) => {
		if (!iso) return;
		createCollection.mutate(
			{
				iso,
				name,
				description,
			},
			{
				onSuccess: (collection) => {
					navigate(paths.collection(iso, collection.id));
				},
			},
		);
	};

	return (
		<section className="mx-auto max-w-3xl">
			<Link
				className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
				to={paths.collections(iso)}
			>
				<ArrowLeftIcon className="size-4" />
				All collections
			</Link>

			<header className="mt-6 max-w-2xl">
				<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
					New collection
				</h1>
				<p className="mt-4 text-base leading-7 text-muted-foreground">
					Create a home for pages from the same book or reading project.
				</p>
			</header>

			<CollectionForm
				cancelTo={paths.collections(iso)}
				onSubmit={handleSubmit}
				pending={createCollection.isPending}
				pendingLabel="Creating..."
				submitLabel="Create collection"
			/>

			{createCollection.isError ? (
				<p
					className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{createCollection.error.message}
				</p>
			) : null}
		</section>
	);
}
