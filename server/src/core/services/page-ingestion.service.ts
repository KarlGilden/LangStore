import type { Page } from "../entities/page.entity.js";
import type { TextRecognitionProvider } from "../port/text-recognition.provider.js";
import type { TranslationProvider } from "../port/translation.provider.js";
import type { PageIngestionPersistence } from "../repositories/page-ingestion.persistence.js";

export interface PagePhotoInput {
	bytes: Uint8Array;
	mediaType: string;
}

export interface IngestPageInput {
	providerId: string;
	iso: string;
	pageId: string;
	collectionId: string;
	name: string;
	description: string | null;
	photo: PagePhotoInput;
}

export interface PageIngestionSuggestion {
	text: string;
	count: number;
	translation: string;
}

export interface IngestPageResult {
	page: Page;
	suggestions: readonly PageIngestionSuggestion[];
}

export interface PageIngestionService {
	ingestPage(input: IngestPageInput): Promise<IngestPageResult>;
}

/** Explicit dependencies for the coordinator implementation added by ING-05. */
export interface PageIngestionServiceDependencies {
	textRecognitionProvider: TextRecognitionProvider;
	translationProvider: TranslationProvider;
	persistence: PageIngestionPersistence;
}
