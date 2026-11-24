import {
	SUPPORTED_LANGUAGES,
	type EntryReviewViewModel,
} from "@langstore/contracts";
import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useDeleteEntry } from "../../api/mutations/useDeleteEntry";
import { useUpdateEntryTranslations } from "../../api/mutations/useUpdateEntryTranslations";
import { useEntries } from "../../api/queries/useEntries";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Input } from "../../components/ui/Input";
import { PageStatus } from "../../components/ui/PageStatus";
import { EditTranslationsDialog } from "./EditTranslationsDialog";
import {
	filterAndSortEntries,
	type ReviewSort,
} from "./review-entries";

const EMPTY_ENTRIES: readonly EntryReviewViewModel[] = [];

export function ReviewPage() {
	const { iso = "" } = useParams();
	const entriesQuery = useEntries(iso);
	const updateEntryTranslations = useUpdateEntryTranslations();
	const deleteEntry = useDeleteEntry();
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<ReviewSort>("alphabetical-asc");
	const [selectedEntry, setSelectedEntry] =
		useState<EntryReviewViewModel | null>(null);
	const [entryToDelete, setEntryToDelete] =
		useState<EntryReviewViewModel | null>(null);
	const entries = entriesQuery.data ?? EMPTY_ENTRIES;
	const languageName =
		SUPPORTED_LANGUAGES.find((language) => language.iso === iso)?.name ?? iso;
	const visibleEntries = useMemo(
		() => filterAndSortEntries(entries, search, sort, iso),
		[entries, iso, search, sort],
	);

	const dismissDialog = () => {
		if (updateEntryTranslations.isPending) return;
		updateEntryTranslations.reset();
		setSelectedEntry(null);
	};

	const saveTranslations = (translations: readonly string[]) => {
		if (!selectedEntry) return;
		updateEntryTranslations.mutate(
			{
				iso,
				entryId: selectedEntry.id,
				translations,
			},
			{ onSuccess: () => setSelectedEntry(null) },
		);
	};

	const requestEntryDelete = () => {
		if (!selectedEntry) return;
		setEntryToDelete(selectedEntry);
		setSelectedEntry(null);
	};

	const confirmEntryDelete = () => {
		if (!entryToDelete) return;
		deleteEntry.mutate(
			{ iso, entryId: entryToDelete.id },
			{ onSuccess: () => setEntryToDelete(null) },
		);
	};

	return (
		<section className="mx-auto max-w-5xl">
			<header className="grid items-end gap-7 border-b border-border pb-8 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div>
					<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
						Review
					</h1>
					<p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
						Browse and refine the vocabulary saved from your {languageName} reading.
					</p>
				</div>
				<div className="flex items-baseline gap-3 sm:text-right">
					<strong className="font-display text-5xl font-semibold leading-none text-primary">
						{entries.length}
					</strong>
					<span className="max-w-24 text-sm leading-5 font-medium text-muted-foreground">
						{entries.length === 1 ? "saved word" : "saved words"}
					</span>
				</div>
			</header>

			<div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-end">
				<div>
					<label className="block text-sm font-semibold" htmlFor="review-search">
						Find a word or translation
					</label>
					<Input
						className="mt-2"
						id="review-search"
						onChange={(event) => setSearch(event.currentTarget.value)}
						placeholder="Search saved vocabulary"
						type="search"
						value={search}
					/>
				</div>
				<div>
					<label className="block text-sm font-semibold" htmlFor="review-sort">
						Sort entries
					</label>
					<select
						className="mt-2 min-h-12 w-full rounded-md border border-input bg-card px-4 py-3 text-card-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
						id="review-sort"
						onChange={(event) => setSort(event.currentTarget.value as ReviewSort)}
						value={sort}
					>
						<option value="alphabetical-asc">Alphabetical: A–Z</option>
						<option value="alphabetical-desc">Alphabetical: Z–A</option>
						<option value="created-desc">Created: newest first</option>
						<option value="created-asc">Created: oldest first</option>
					</select>
				</div>
			</div>

			<p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
				{search.trim()
					? `${visibleEntries.length} of ${entries.length} entries shown`
					: `${visibleEntries.length} ${visibleEntries.length === 1 ? "entry" : "entries"}`}
			</p>

			<div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
				{entriesQuery.isLoading ? (
					<PageStatus compact message="Loading saved words…" />
				) : entriesQuery.error ? (
					<PageStatus
						compact
						message="Saved words could not be loaded. Try again shortly."
						tone="error"
					/>
				) : entries.length === 0 ? (
					<PageStatus
						compact
						message="Save vocabulary from a page and it will appear here."
						title="No saved words yet"
					/>
				) : visibleEntries.length === 0 ? (
					<PageStatus
						compact
						message="Try a different word or translation."
						title="No matching entries"
					/>
				) : (
					<ul>
						{visibleEntries.map((entry) => (
							<li
								className="review-entry-item border-b border-border last:border-b-0"
								key={entry.id}
							>
								<button
									className="grid w-full gap-2 px-5 py-5 text-left outline-none hover:bg-muted/60 focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-6"
									onClick={() => {
										updateEntryTranslations.reset();
										setSelectedEntry(entry);
									}}
									type="button"
								>
									<span className="min-w-0">
										<span className="block break-words font-display text-2xl font-semibold tracking-tight text-card-foreground">
											{entry.text}
										</span>
										<span className="mt-1 block break-words text-sm leading-6 text-muted-foreground">
											{formatTranslations(entry)}
										</span>
										<span className="mt-2 block text-xs font-medium text-muted-foreground">
											{formatEncounters(entry)}
										</span>
									</span>
									<span className="text-xs font-medium text-muted-foreground sm:text-right">
										<span className="block">{formatCreatedDate(entry.createdAt)}</span>
										<span className="mt-1 block text-primary">Edit translations</span>
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			{selectedEntry ? (
				<EditTranslationsDialog
					entry={selectedEntry}
					error={updateEntryTranslations.error}
					key={selectedEntry.id}
					onDismiss={dismissDialog}
					onRequestDelete={requestEntryDelete}
					onSave={saveTranslations}
					pending={updateEntryTranslations.isPending}
				/>
			) : null}

			{entryToDelete ? (
				<ConfirmDialog
					cancelLabel="Cancel"
					confirmLabel={deleteEntry.isPending ? "Deleting..." : "Delete word"}
					description={`Delete ${entryToDelete.text}, its translations, and all of its recorded encounters? This does not delete any pages.`}
					error={deleteEntry.error?.message}
					onConfirm={confirmEntryDelete}
					onDismiss={() => {
						if (deleteEntry.isPending) return;
						deleteEntry.reset();
						setEntryToDelete(null);
					}}
					open
					pending={deleteEntry.isPending}
					title="Delete word?"
				/>
			) : null}
		</section>
	);
}

function formatTranslations(entry: EntryReviewViewModel): string {
	if (entry.translations.length === 0) return "No translations saved";
	return entry.translations.map(({ text }) => text).join(", ");
}

function formatEncounters(entry: EntryReviewViewModel): string {
	const encounterLabel = entry.encounterCount === 1 ? "encounter" : "encounters";
	const pageLabel = entry.encounterPageCount === 1 ? "page" : "pages";
	return `${entry.encounterCount} ${encounterLabel} across ${entry.encounterPageCount} ${pageLabel}`;
}

function formatCreatedDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
		new Date(value),
	);
}
