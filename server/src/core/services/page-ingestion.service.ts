import type { Page } from "../entities/page.entity.js";
import { EmptyRecognizedTextError } from "../errors/page-ingestion.error.js";
import type { TextRecognitionService } from "../port/text-recognition.provider.js";
import type { CollectionService } from "./collection.service.js";
import type { PageService } from "./page.service.js";
import { requirePageLanguageCode, requirePageText } from "./page.validation.js";
import type { WordExtractionService } from "./word-extraction.service.js";

type PageIngestionServiceDependencies = {
	collectionService: CollectionService;
	textRecognitionService: TextRecognitionService;
	wordExtractionService: WordExtractionService;
	pageService: PageService;
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
	pageService,
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

		const page = await pageService.createPage(input.userId, input.iso, {
			collectionId: collection.id,
			name: input.name,
			description: input.description,
			summary: formatSummary(recognition.text),
		});

		const extractedWords = await wordExtractionService.extractWords(
			recognition.text,
			input.userId,
			input.iso,
		);

		return {
			page: page,
			suggestions: extractedWords.flatMap(({ text, count }) => [
				{ text, count, translation: "" },
			]),
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
