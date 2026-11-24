import type { EntryViewModel } from "@langstore/contracts";
import { filterAndSortEntries } from "./review-entries";

const entries: EntryViewModel[] = [
	createEntry("1", "Zug", "train", "2026-02-02T10:00:00.000Z"),
	createEntry("2", "Apfel", "apple", "2026-03-03T10:00:00.000Z"),
	createEntry("3", "Ähre", "ear of wheat", "2026-01-01T10:00:00.000Z"),
];

describe("filterAndSortEntries", () => {
	it("sorts entries alphabetically for the selected language", () => {
		expect(
			filterAndSortEntries(entries, "", "alphabetical-asc", "de").map(
				(entry) => entry.text,
			),
		).toEqual(["Ähre", "Apfel", "Zug"]);
	});

	it("sorts entries by their created date", () => {
		expect(
			filterAndSortEntries(entries, "", "created-desc", "de").map(
				(entry) => entry.text,
			),
		).toEqual(["Apfel", "Zug", "Ähre"]);
	});

	it("finds matches in translations without mutating the source list", () => {
		const originalOrder = entries.map((entry) => entry.id);

		expect(
			filterAndSortEntries(entries, "APPLE", "alphabetical-asc", "de").map(
				(entry) => entry.text,
			),
		).toEqual(["Apfel"]);
		expect(entries.map((entry) => entry.id)).toEqual(originalOrder);
	});
});

function createEntry(
	id: string,
	text: string,
	translation: string,
	createdAt: string,
): EntryViewModel {
	return {
		id,
		text,
		createdAt,
		translations: [
			{
				id: `${id}-translation`,
				text: translation,
				createdAt,
			},
		],
	};
}
