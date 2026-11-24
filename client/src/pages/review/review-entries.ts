import type { EntryViewModel } from "@langstore/contracts";

export type ReviewSort =
	| "alphabetical-asc"
	| "alphabetical-desc"
	| "created-desc"
	| "created-asc";

export function filterAndSortEntries(
	entries: readonly EntryViewModel[],
	search: string,
	sort: ReviewSort,
	locale: string,
): EntryViewModel[] {
	const query = search.trim().toLocaleLowerCase(locale || undefined);
	const visibleEntries = query
		? entries.filter((entry) =>
				[entry.text, ...entry.translations.map(({ text }) => text)].some(
					(value) =>
						value.toLocaleLowerCase(locale || undefined).includes(query),
				),
			)
		: entries;

	return [...visibleEntries].sort((first, second) => {
		switch (sort) {
			case "alphabetical-desc":
				return second.text.localeCompare(first.text, locale, {
					sensitivity: "base",
				});
			case "created-desc":
				return second.createdAt.localeCompare(first.createdAt);
			case "created-asc":
				return first.createdAt.localeCompare(second.createdAt);
			case "alphabetical-asc":
			default:
				return first.text.localeCompare(second.text, locale, {
					sensitivity: "base",
				});
		}
	});
}
