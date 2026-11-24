import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCreateCollection } from "../../api/mutations/useCreateCollection";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { paths } from "../../router/paths";

export function NewCollectionPage() {
	const { iso = "" } = useParams();
	const navigate = useNavigate();
	const createCollection = useCreateCollection();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const trimmedName = name.trim();

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!iso || !trimmedName) return;

		const trimmedDescription = description.trim();
		createCollection.mutate(
			{
				iso,
				name: trimmedName,
				description: trimmedDescription || null,
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

			<form className="mt-10 space-y-8" onSubmit={handleSubmit}>
				<div>
					<label className="block font-semibold" htmlFor="collection-name">
						Name
					</label>
					<Input
						autoComplete="off"
						autoFocus
						className="mt-3"
						disabled={createCollection.isPending}
						id="collection-name"
						onChange={(event) => setName(event.currentTarget.value)}
						required
						value={name}
					/>
				</div>

				<div>
					<label
						className="block font-semibold"
						htmlFor="collection-description"
					>
						Description <span className="font-normal text-muted-foreground">(optional)</span>
					</label>
					<Textarea
						className="mt-3"
						disabled={createCollection.isPending}
						id="collection-description"
						onChange={(event) => setDescription(event.currentTarget.value)}
						value={description}
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<button
						className="min-h-12 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground outline-none hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						disabled={!trimmedName || createCollection.isPending}
						type="submit"
					>
						{createCollection.isPending ? "Creating..." : "Create collection"}
					</button>
					<Link
						className="inline-flex min-h-12 items-center rounded-md px-4 font-semibold text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
						to={paths.collections(iso)}
					>
						Cancel
					</Link>
				</div>
			</form>

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
