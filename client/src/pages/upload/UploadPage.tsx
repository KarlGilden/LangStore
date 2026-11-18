import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import type { PageSuggestionViewModel } from "@langstore/contracts";
import { useUploadPage } from "../../api/mutations/useUploadPage";
import { useCollections } from "../../api/queries/useCollections";
import { paths } from "../../router/paths";
import { CollectionDropdown } from "../../components/common/CollectionDropdown";

const ACCEPTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

export function UploadPage() {
	const { iso = "" } = useParams();
	const uploadPage = useUploadPage();
	const [collectionId, setCollectionId] = useState("");
	const [photo, setPhoto] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);

	const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextPhoto = event.currentTarget.files?.[0] ?? null;
		uploadPage.reset();

		if (nextPhoto && !ACCEPTED_PHOTO_TYPES.has(nextPhoto.type)) {
			setPhoto(null);
			setFileError("Choose a JPEG or PNG photo.");
			event.currentTarget.value = "";
			return;
		}

		setPhoto(nextPhoto);
		setFileError(null);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!collectionId || !photo || !iso) return;

		uploadPage.mutate({
			iso,
			collectionId: collectionId,
			photo,
		});
	};

	return (
		<div className="mx-auto max-w-3xl">
			<header className="max-w-2xl"></header>
			<form className="mt-10 space-y-8" onSubmit={handleSubmit}>
				<CollectionDropdown onChange={setCollectionId} />

				<div>
					<span className="block font-semibold">Page photo</span>
					<label
						className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-card px-6 py-8 text-center text-card-foreground outline-none hover:border-primary hover:bg-secondary/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 sm:min-h-56"
						htmlFor="page-photo"
					>
						<svg
							aria-hidden="true"
							className="size-9 text-primary"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1-1.5h6.6l1 1.5h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.6"
							/>
							<circle
								cx="12"
								cy="12.5"
								r="3.25"
								stroke="currentColor"
								strokeWidth="1.6"
							/>
						</svg>
						<span className="mt-4 font-semibold">
							{photo ? photo.name : "Take or choose a photo"}
						</span>
						<span className="mt-1 text-sm leading-6 text-muted-foreground">
							{photo
								? `${formatFileSize(photo.size)} - JPEG or PNG`
								: "Use your camera on mobile, or select a JPEG or PNG file."}
						</span>
						<input
							accept="image/jpeg,image/png"
							capture="environment"
							className="sr-only"
							id="page-photo"
							onChange={handlePhotoChange}
							type="file"
						/>
					</label>
					{fileError ? (
						<p className="mt-3 text-sm text-destructive" role="alert">
							{fileError}
						</p>
					) : null}
				</div>

				<button
					className="min-h-12 w-full rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground outline-none hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:min-w-40"
					disabled={!collectionId || !photo || uploadPage.isPending}
					type="submit"
				>
					{uploadPage.isPending ? "Reading page..." : "Find words"}
				</button>
			</form>

			<div aria-live="polite" className="mt-8">
				{uploadPage.isError ? (
					<p
						className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
						role="alert"
					>
						{uploadPage.error.message}
					</p>
				) : null}
				{uploadPage.isSuccess ? (
					<SuggestionList suggestions={uploadPage.data.suggestions} />
				) : null}
			</div>
		</div>
	);
}

function SuggestionList({
	suggestions,
}: {
	suggestions: readonly PageSuggestionViewModel[];
}) {
	return (
		<section
			aria-labelledby="suggestions-heading"
			className="border-t border-border pt-8"
		>
			<h2
				className="font-display text-3xl font-semibold tracking-tight"
				id="suggestions-heading"
			>
				{suggestions.length > 0
					? "Words worth a closer look"
					: "No new words found"}
			</h2>
			{suggestions.length > 0 ? (
				<ul className="mt-5 divide-y divide-border border-y border-border">
					{suggestions.map((suggestion) => (
						<li
							className="flex flex-col items-start justify-between gap-2 py-4 sm:flex-row sm:items-baseline sm:gap-5"
							key={suggestion.text}
						>
							<div className="min-w-0">
								<p className="break-words text-lg font-semibold">
									{suggestion.text}
								</p>
								{suggestion.translation ? (
									<p className="mt-1 break-words text-sm text-muted-foreground">
										{suggestion.translation}
									</p>
								) : null}
							</div>
							<span className="shrink-0 text-sm text-muted-foreground">
								{suggestion.count === 1
									? "Once on this page"
									: `${suggestion.count} times on this page`}
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="mt-3 text-sm leading-6 text-muted-foreground">
					LangStore did not find any new word suggestions on this page.
				</p>
			)}
		</section>
	);
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) {
		return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
