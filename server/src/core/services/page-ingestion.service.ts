import type { Page } from "../entities/page.entity.js";
import { EmptyRecognizedTextError } from "../errors/page-ingestion.error.js";
import type { TextRecognitionProvider } from "../port/text-recognition.provider.js";
import type { PageIngestionPersistence } from "../repositories/page-ingestion.persistence.js";
import type { CollectionService } from "./collection.service.js";
import { requirePageLanguageCode, requirePageText } from "./page.validation.js";

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

export const createPageIngestionService = (
	collectionService: CollectionService,
	textRecognitionProvider: TextRecognitionProvider,
	persistence: PageIngestionPersistence,
) => {
	const ingestPage = async (input: IngestPageInput): Promise<IngestPageResult> => {
		requirePageLanguageCode(input.iso);
		requirePageText("name", input.name);
		if (input.description !== null) {
			requirePageText("description", input.description);
		}

		const collection = await collectionService.getCollection(
			input.providerId,
			input.iso,
			input.collectionId,
		);
		const recognition = await textRecognitionProvider.recognizeText({
			image: input.photo.bytes,
			mediaType: input.photo.mediaType,
		});
		if (!/\S/u.test(recognition.text)) {
			throw new EmptyRecognizedTextError();
		}

		const result = await persistence.persistPageIngestion({
			page: {
				id: input.pageId,
				userId: collection.userId,
				collectionId: collection.id,
				iso: collection.iso,
				name: input.name,
				description: input.description,
				summary: recognition.text,
			},
			encounters: [],
		});

		return { page: result.page, suggestions: [] };
	};

	return { ingestPage };
};
