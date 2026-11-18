import {
	useRef,
	useState,
	type ChangeEvent,
	type FormEvent,
} from "react";
import { useParams } from "react-router";
import type { PageSuggestionViewModel } from "@langstore/contracts";
import { useSavePageEntries } from "../../api/mutations/useSavePageEntries";
import { useUploadPage } from "../../api/mutations/useUploadPage";
import { CollectionDropdown } from "../../components/common/CollectionDropdown";
import { ArrowLeftIcon } from "../../components/icons/ArrowLeftIcon";
import { CameraIcon } from "../../components/icons/CameraIcon";
import { CheckIcon } from "../../components/icons/CheckIcon";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SelectableWordItem } from "../../components/vocabulary/SelectableWordItem";

const ACCEPTED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);

export function UploadPage() {
	const { iso = "" } = useParams();
	const uploadPage = useUploadPage();
	const savePageEntries = useSavePageEntries();
	const photoInputRef = useRef<HTMLInputElement>(null);
	const [collectionId, setCollectionId] = useState("");
	const [photo, setPhoto] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [selectedTexts, setSelectedTexts] = useState<Set<string>>(
		() => new Set(),
	);
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	const resetWorkflow = () => {
		uploadPage.reset();
		savePageEntries.reset();
		setSelectedTexts(new Set());
		setPhoto(null);
		setFileError(null);
		setShowCancelDialog(false);
		if (photoInputRef.current) photoInputRef.current.value = "";
	};

	const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextPhoto = event.currentTarget.files?.[0] ?? null;
		uploadPage.reset();
		savePageEntries.reset();

		if (nextPhoto && !ACCEPTED_PHOTO_TYPES.has(nextPhoto.type)) {
			setPhoto(null);
			setFileError("Choose a JPEG or PNG photo.");
			event.currentTarget.value = "";
			return;
		}

		setPhoto(nextPhoto);
		setFileError(null);
	};

	const handleUpload = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!collectionId || !photo || !iso) return;

		uploadPage.mutate(
			{ iso, collectionId, photo },
			{
				onSuccess: ({ suggestions }) => {
					setSelectedTexts(new Set(suggestions.map(({ text }) => text)));
				},
			},
		);
	};

	if (savePageEntries.isSuccess) {
		return (
			<SaveSuccess
				count={savePageEntries.data.length}
				onUploadAnother={resetWorkflow}
			/>
		);
	}

	if (uploadPage.isSuccess) {
		if (uploadPage.data.suggestions.length === 0) {
			return <NoSuggestionsFound onReturn={resetWorkflow} />;
		}

		const suggestions = uploadPage.data.suggestions;
		const selectedSuggestions = suggestions.filter(({ text }) =>
			selectedTexts.has(text),
		);

		return (
			<>
				<WordSelectionView
					disabled={savePageEntries.isPending}
					error={savePageEntries.error?.message ?? null}
					onCancel={() => setShowCancelDialog(true)}
					onSave={() => {
						if (!iso || selectedSuggestions.length === 0) return;
						savePageEntries.mutate({
							iso,
							pageId: uploadPage.data.page.id,
							suggestions: selectedSuggestions,
						});
					}}
					onSelectAll={() =>
						setSelectedTexts(new Set(suggestions.map(({ text }) => text)))
					}
					onToggle={(text) => {
						setSelectedTexts((current) => {
							const next = new Set(current);
							if (next.has(text)) next.delete(text);
							else next.add(text);
							return next;
						});
					}}
					onUnselectAll={() => setSelectedTexts(new Set())}
					pending={savePageEntries.isPending}
					selectedTexts={selectedTexts}
					suggestions={suggestions}
				/>
				<ConfirmDialog
					confirmLabel="Discard words"
					description="This page has already been processed. The suggested words will not be saved if you leave now."
					onConfirm={resetWorkflow}
					onDismiss={() => setShowCancelDialog(false)}
					open={showCancelDialog}
					title="Are you sure?"
				/>
			</>
		);
	}

	return (
		<div className="mx-auto max-w-3xl">
			<header className="max-w-2xl">
				<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
					Find words on a page
				</h1>
				<p className="mt-4 text-base leading-7 text-muted-foreground">
					Choose a collection and photograph a page. You will decide which new
					words to keep after it is read.
				</p>
			</header>
			<form className="mt-10 space-y-8" onSubmit={handleUpload}>
				<CollectionDropdown onChange={setCollectionId} />

				<div>
					<span className="block font-semibold">Page photo</span>
					<label
						className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-card px-6 py-8 text-center text-card-foreground outline-none hover:border-primary hover:bg-secondary/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 sm:min-h-56"
						htmlFor="page-photo"
					>
						<CameraIcon className="size-9 text-primary" />
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
							ref={photoInputRef}
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

			{uploadPage.isError ? (
				<p
					className="mt-8 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{uploadPage.error.message}
				</p>
			) : null}
		</div>
	);
}

interface WordSelectionViewProps {
	suggestions: readonly PageSuggestionViewModel[];
	selectedTexts: ReadonlySet<string>;
	pending: boolean;
	disabled: boolean;
	error: string | null;
	onToggle: (text: string) => void;
	onSelectAll: () => void;
	onUnselectAll: () => void;
	onSave: () => void;
	onCancel: () => void;
}

function WordSelectionView({
	suggestions,
	selectedTexts,
	pending,
	disabled,
	error,
	onToggle,
	onSelectAll,
	onUnselectAll,
	onSave,
	onCancel,
}: WordSelectionViewProps) {
	const selectedCount = selectedTexts.size;
	const allSelected = selectedCount === suggestions.length;

	return (
		<section className="-mx-5 -my-10 flex min-h-[calc(100dvh-8rem)] flex-col bg-background sm:-mx-8 sm:-my-14 md:min-h-[calc(100dvh-4rem)] lg:-mx-14">
			<header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
				<button
					aria-label="Cancel word selection"
					className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-card outline-none hover:bg-muted disabled:cursor-wait disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
					disabled={disabled}
					onClick={onCancel}
					type="button"
				>
					<ArrowLeftIcon className="size-5" />
				</button>
				<div className="min-w-0 flex-1">
					<h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
						Choose words to save
					</h1>
					<p className="mt-0.5 text-sm text-muted-foreground" aria-live="polite">
						{formatSelectionCount(selectedCount, suggestions.length)}
					</p>
				</div>
				<button
					className="min-h-10 rounded-md px-3 text-sm font-semibold text-primary outline-none hover:bg-secondary disabled:cursor-wait disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
					disabled={disabled}
					onClick={allSelected ? onUnselectAll : onSelectAll}
					type="button"
				>
					{allSelected ? "Clear all" : "Select all"}
				</button>
			</header>

			<ul className="grid flex-1 content-start border-l border-border bg-card sm:grid-cols-2 xl:grid-cols-3">
				{suggestions.map((suggestion) => (
					<SelectableWordItem
						count={suggestion.count}
						disabled={disabled}
						key={suggestion.text}
						onToggle={() => onToggle(suggestion.text)}
						selected={selectedTexts.has(suggestion.text)}
						text={suggestion.text}
						translation={suggestion.translation}
					/>
				))}
			</ul>

			<div className="pointer-events-none fixed right-5 bottom-5 z-30 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3 sm:right-8 sm:bottom-8">
				{error ? (
					<p
						className="pointer-events-auto max-w-sm rounded-md border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-xl"
						role="alert"
					>
						{error}
					</p>
				) : null}
				<button
					className="pointer-events-auto min-h-14 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-xl outline-none hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					disabled={selectedCount === 0 || pending}
					onClick={onSave}
					type="button"
				>
					{pending
						? "Saving words..."
						: `Save ${selectedCount} ${selectedCount === 1 ? "word" : "words"}`}
				</button>
			</div>
		</section>
	);
}

function SaveSuccess({
	count,
	onUploadAnother,
}: {
	count: number;
	onUploadAnother: () => void;
}) {
	return (
		<section className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center text-center">
			<span className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
				<CheckIcon className="size-7" />
			</span>
			<h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">
				Words saved
			</h1>
			<p className="mt-3 max-w-md leading-7 text-muted-foreground">
				{count === 1
					? "1 word was added to your vocabulary."
					: `${count} words were added to your vocabulary.`}
			</p>
			<button
				className="mt-8 min-h-12 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				onClick={onUploadAnother}
				type="button"
			>
				Upload another page
			</button>
		</section>
	);
}

function NoSuggestionsFound({ onReturn }: { onReturn: () => void }) {
	return (
		<section className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-center justify-center text-center">
			<h1 className="font-display text-4xl font-semibold tracking-tight">
				No new words found
			</h1>
			<p className="mt-3 max-w-md leading-7 text-muted-foreground">
				This page was processed, but every recognized word is already saved or
				no suggestions were found.
			</p>
			<button
				className="mt-8 min-h-12 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				onClick={onReturn}
				type="button"
			>
				Return to upload
			</button>
		</section>
	);
}

function formatSelectionCount(selected: number, total: number): string {
	return `${selected} of ${total} selected`;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024 * 1024) {
		return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
