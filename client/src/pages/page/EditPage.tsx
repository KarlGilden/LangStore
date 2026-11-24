import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useDeletePage } from "../../api/mutations/useDeletePage";
import { useUpdatePage } from "../../api/mutations/useUpdatePage";
import { usePage } from "../../api/queries/usePage";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import {
	PageForm,
	type PageFormValues,
} from "../../components/pages/PageForm";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageStatus } from "../../components/ui/PageStatus";
import { paths } from "../../router/paths";

export function EditPage() {
	const { iso = "", collectionId = "", pageId = "" } = useParams();
	const navigate = useNavigate();
	const pageQuery = usePage(iso, pageId);
	const updatePage = useUpdatePage();
	const deletePage = useDeletePage();
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const page = pageQuery.data;

	if (pageQuery.isLoading) {
		return <PageStatus message="Loading page..." />;
	}

	if (pageQuery.error || !page || page.collectionId !== collectionId) {
		return (
			<PageStatus
				message="This page could not be loaded. Return to the collection and try again."
				tone="error"
			/>
		);
	}

	const pagePath = paths.page(iso, page.collectionId, page.id);
	const collectionPath = paths.collection(iso, page.collectionId);

	const handleSubmit = ({ name, description }: PageFormValues) => {
		updatePage.mutate(
			{ iso, pageId: page.id, name, description },
			{ onSuccess: () => navigate(pagePath) },
		);
	};

	const handleDelete = () => {
		deletePage.mutate(
			{ iso, collectionId: page.collectionId, pageId: page.id },
			{ onSuccess: () => navigate(collectionPath, { replace: true }) },
		);
	};

	return (
		<section className="mx-auto max-w-3xl">
			<Link
				className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
				to={pagePath}
			>
				<ArrowLeftIcon className="size-4" />
				{page.name}
			</Link>

			<header className="mt-6 grid max-w-3xl gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div className="max-w-2xl">
					<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
						Edit page
					</h1>
					<p className="mt-4 text-base leading-7 text-muted-foreground">
						Update how this page appears in its collection.
					</p>
				</div>
				<button
					className="min-h-11 rounded-md border border-destructive/40 px-4 py-2.5 font-semibold text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
					onClick={() => setConfirmingDelete(true)}
					type="button"
				>
					Delete page
				</button>
			</header>

			<PageForm
				cancelTo={pagePath}
				initialDescription={page.description}
				initialName={page.name}
				key={page.id}
				onSubmit={handleSubmit}
				pending={updatePage.isPending}
			/>

			{updatePage.isError || deletePage.isError ? (
				<p
					className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{updatePage.error?.message ?? deletePage.error?.message}
				</p>
			) : null}

			<ConfirmDialog
				cancelLabel="Cancel"
				confirmLabel={deletePage.isPending ? "Deleting..." : "Delete page"}
				description={`Delete ${page.name} and all encounters recorded on it? Saved words will remain in your vocabulary.`}
				onConfirm={handleDelete}
				onDismiss={() => {
					if (!deletePage.isPending) setConfirmingDelete(false);
				}}
				open={confirmingDelete}
				pending={deletePage.isPending}
				title="Delete page?"
			/>
		</section>
	);
}
