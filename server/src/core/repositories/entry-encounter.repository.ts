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
	create(input: RecordEntryEncounterInput): Promise<EntryEncounter>;

	getAllPageVocabulary(
		pageId: string,
		userId: string,
		iso: string,
	): Promise<PageVocabularyEntry[] | null>;
}
