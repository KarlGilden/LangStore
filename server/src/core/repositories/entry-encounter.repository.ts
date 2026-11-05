import type {
	EntryEncounter,
	PageVocabularyEntry,
} from "../entities/entry-encounter.entity.js";

export interface RecordEntryEncounterInput {
	entryId: string;
	pageId: string;
	count: number;
	userId: string;
}

export interface EntryEncounterRepository {
	record(input: RecordEntryEncounterInput): Promise<EntryEncounter>;

	listPageVocabulary(
		pageId: string,
		userId: string,
		iso: string,
	): Promise<PageVocabularyEntry[] | null>;
}
