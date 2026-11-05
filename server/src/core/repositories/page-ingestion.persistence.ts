import type { EntryEncounter } from "../entities/entry-encounter.entity.js";
import type { Page } from "../entities/page.entity.js";

export interface PageIngestionEncounterInput {
	entryId: string;
	count: number;
}

export interface PersistPageIngestionInput {
	page: {
		id: string;
		userId: string;
		collectionId: string;
		iso: string;
		name: string;
		description: string | null;
		summary: string;
	};
	encounters: readonly PageIngestionEncounterInput[];
}

export interface PersistPageIngestionResult {
	page: Page;
	encounters: readonly EntryEncounter[];
}

/**
 * Short, transaction-aware write boundary for page ingestion.
 *
 * Provider calls must finish before this operation begins. Implementations must
 * recheck collection and entry ownership/language inside the transaction, then
 * commit the page and all encounters together.
 */
export interface PageIngestionPersistence {
	persistPageIngestion(
		input: PersistPageIngestionInput,
	): Promise<PersistPageIngestionResult>;
}
