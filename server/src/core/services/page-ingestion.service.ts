import type { Page } from "../entities/page.entity.js";
import { EmptyRecognizedTextError } from "../errors/page-ingestion.error.js";
import type { TextRecognitionService } from "../port/text-recognition.provider.js";
import type { PageIngestionRepository } from "../repositories/page-ingestion.repository.js";
import type { CollectionService } from "./collection.service.js";
import { requirePageLanguageCode, requirePageText } from "./page.validation.js";
import type { WordExtractionService } from "./word-extraction.service.js";

type PageIngestionServiceDependencies = {
	collectionService: CollectionService;
	textRecognitionService: TextRecognitionService;
	wordExtractionService: WordExtractionService;
	pageIngestionRepository: PageIngestionRepository;
};

export interface PagePhotoInput {
	bytes: Uint8Array;
	mediaType: string;
}

export interface IngestPageInput {
	userId: string;
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
	suggestions: PageIngestionSuggestion[];
}

export interface PageIngestionService {
	ingestPage(input: IngestPageInput): Promise<IngestPageResult>;
}

export const createPageIngestionService = ({
	collectionService,
	textRecognitionService,
	pageIngestionRepository,
	wordExtractionService,
}: PageIngestionServiceDependencies) => {
	const ingestPage = async (
		input: IngestPageInput,
	): Promise<IngestPageResult> => {
		requirePageLanguageCode(input.iso);
		requirePageText("name", input.name);

		if (input.description !== null) {
			requirePageText("description", input.description);
		}

		const collection = await collectionService.getCollection(
			input.userId,
			input.iso,
			input.collectionId,
		);

		const recognition = await textRecognitionService.recognizeText({
			image: input.photo.bytes,
			mediaType: input.photo.mediaType,
		});

		if (!/\S/u.test(recognition.text)) {
			throw new EmptyRecognizedTextError();
		}

		const extractedWords = wordExtractionService.extractWords(recognition.text);
		const persisted = await pageIngestionRepository.persistPageIngestion({
			userId: input.userId,
			iso: input.iso,
			page: {
				id: input.pageId,
				collectionId: collection.id,
				name: input.name,
				description: input.description,
				summary: formatSummary(recognition.text),
			},
			words: extractedWords,
		});
		const matchedTexts = new Set(persisted.matchedTexts);

		return {
			page: persisted.page,
			suggestions: extractedWords.flatMap(({ text, count }) =>
				matchedTexts.has(text) ? [] : [{ text, count, translation: "" }],
			),
		};
	};

	return { ingestPage };
};

const formatSummary = (summary: string) => {
	return summary
		.replace(/\s+/gu, " ")
		.replace(/ +([.,;:!?…])/gu, "$1")
		.trim();
};
