import type { Entry } from "./entry.entity.js";

export interface EntryEncounter {
	id: string;
	entryId: string;
	pageId: string;
	count: number;
	createdAt: Date;
}

export interface PageVocabularyEntry {
	entry: Entry;
	encounter: EntryEncounter;
}
