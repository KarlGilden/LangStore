import type { Entry } from "../entities/entry.entity.js";

export interface CreateEntryInput {
	text: string;
	userId: string;
	iso: string;
	translations: { text: string }[];
}

export interface SavePageEntriesInput {
	userId: string;
	iso: string;
	pageId: string;
	entries: {
		text: string;
		count: number;
		translations: { text: string }[];
	}[];
}

export type EntryReviewResult = Entry & {
	encounterCount: number;
	encounterPageCount: number;
};

export interface ReplaceEntryTranslationsInput {
	entryId: string;
	userId: string;
	iso: string;
	translations: { text: string }[];
}

export interface EntryRepository {
	create(input: CreateEntryInput): Promise<Entry>;

	savePageEntries(input: SavePageEntriesInput): Promise<Entry[]>;

	getById(id: string, userId: string): Promise<Entry | null>;

	getByPages(
		texts: readonly string[],
		userId: string,
		iso: string,
	): Promise<Entry[]>;

	getAll(userId: string, iso: string): Promise<Entry[]>;

	getAllForReview(userId: string, iso: string): Promise<EntryReviewResult[]>;

	updateTranslations(input: ReplaceEntryTranslationsInput): Promise<Entry | null>;

	delete(id: string, userId: string, iso: string): Promise<boolean>;
}
