import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Collection } from "../../src/core/entities/collection.entity.js";
import type { Page } from "../../src/core/entities/page.entity.js";
import { CollectionNotFoundError } from "../../src/core/errors/collection.error.js";
import { EmptyRecognizedTextError } from "../../src/core/errors/page-ingestion.error.js";
import type { TextRecognitionService } from "../../src/core/port/text-recognition.provider.js";
import type { CollectionRepository } from "../../src/core/repositories/collection.repository.js";
import type { PageIngestionRepository } from "../../src/core/repositories/page-ingestion.repository.js";
import { createCollectionService } from "../../src/core/services/collection.service.js";
import {
	createPageIngestionService,
	type IngestPageInput,
} from "../../src/core/services/page-ingestion.service.js";
import { createWordExtractionService } from "../../src/core/services/word-extraction.service.js";

describe("PageIngestionService", () => {
	it("persists every extracted count and returns only transaction-unmatched suggestions", async () => {
		const context = createTestContext({
			recognizedText: "Haus haus ging Welt.",
			matchedTexts: ["haus"],
		});

		const result = await context.service.ingestPage(context.input);

		expect(result).toEqual({
			page: context.page,
			suggestions: [
				{ text: "ging", count: 1, translation: "" },
				{ text: "welt", count: 1, translation: "" },
			],
		});
		expect(context.persistPageIngestion).toHaveBeenCalledWith({
			userId: context.input.userId,
			iso: context.input.iso,
			page: {
				id: context.input.pageId,
				collectionId: context.collection.id,
				name: context.input.name,
				description: context.input.description,
				summary: "Haus haus ging Welt.",
			},
			words: [
				{ text: "haus", count: 2 },
				{ text: "ging", count: 1 },
				{ text: "welt", count: 1 },
			],
		});
	});

	it("returns no suggestions when the transaction matches every extracted word", async () => {
		const context = createTestContext({
			recognizedText: "Haus ging",
			matchedTexts: ["haus", "ging"],
		});

		const result = await context.service.ingestPage(context.input);

		expect(result.suggestions).toEqual([]);
		expect(result.page).toBe(context.page);
	});

	it("checks collection access before invoking text recognition", async () => {
		const context = createTestContext({ collection: null });

		await expect(context.service.ingestPage(context.input)).rejects.toBeInstanceOf(
			CollectionNotFoundError,
		);
		expect(context.recognizeText).not.toHaveBeenCalled();
		expect(context.persistPageIngestion).not.toHaveBeenCalled();
	});

	it("does not persist a page when recognized text is empty", async () => {
		const context = createTestContext({ recognizedText: " \n\t " });

		await expect(context.service.ingestPage(context.input)).rejects.toBeInstanceOf(
			EmptyRecognizedTextError,
		);
		expect(context.persistPageIngestion).not.toHaveBeenCalled();
	});

	it("does not produce a result when atomic persistence fails", async () => {
		const persistenceError = new Error("transaction failed");
		const context = createTestContext({ persistenceError });

		await expect(context.service.ingestPage(context.input)).rejects.toBe(
			persistenceError,
		);
	});
});

interface TestContextOptions {
	collection?: Collection | null;
	recognizedText?: string;
	matchedTexts?: string[];
	persistenceError?: Error;
}

function createTestContext(options: TestContextOptions = {}) {
	const userId = randomUUID();
	const collection: Collection = options.collection ?? {
		id: randomUUID(),
		name: "Book",
		description: null,
		imgUrl: null,
		userId,
		iso: "de",
	};
	const input: IngestPageInput = {
		userId,
		iso: "de",
		pageId: randomUUID(),
		collectionId: collection.id,
		name: "Page 1",
		description: null,
		photo: {
			bytes: new Uint8Array([1, 2, 3]),
			mediaType: "image/jpeg",
		},
	};
	const page: Page = {
		id: input.pageId,
		userId,
		collectionId: collection.id,
		name: input.name,
		description: input.description,
		summary: options.recognizedText ?? "Haus ging",
		createdAt: new Date("2026-11-24T12:00:00.000Z"),
	};

	const collectionRepository: CollectionRepository = {
		create: async () => collection,
		getById: async () =>
			options.collection === null ? null : collection,
		update: async () => collection,
		getAll: async () => [collection],
	};
	const recognizeText = vi.fn<TextRecognitionService["recognizeText"]>(
		async () => ({ text: options.recognizedText ?? "Haus ging" }),
	);
	const persistPageIngestion = vi.fn<
		PageIngestionRepository["persistPageIngestion"]
	>(async () => {
		if (options.persistenceError) throw options.persistenceError;
		return {
			page,
			matchedTexts: options.matchedTexts ?? [],
		};
	});

	return {
		collection,
		input,
		page,
		recognizeText,
		persistPageIngestion,
		service: createPageIngestionService({
			collectionService: createCollectionService({ collectionRepository }),
			textRecognitionService: { recognizeText },
			wordExtractionService: createWordExtractionService(),
			pageIngestionRepository: { persistPageIngestion },
		}),
	};
}
