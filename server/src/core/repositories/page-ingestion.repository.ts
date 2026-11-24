import type { Page } from "../entities/page.entity.js";

export interface PageIngestionWord {
	text: string;
	count: number;
}

export interface PersistPageIngestionInput {
	userId: string;
	iso: string;
	page: {
		id: string;
		collectionId: string;
		name: string;
		description: string | null;
		summary: string | null;
	};
	words: readonly PageIngestionWord[];
}

export interface PersistPageIngestionResult {
	page: Page;
	matchedTexts: string[];
}

export interface PageIngestionRepository {
	persistPageIngestion(
		input: PersistPageIngestionInput,
	): Promise<PersistPageIngestionResult>;
}
