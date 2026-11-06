import { describe, expect, it, vi } from "vitest";
import { CollectionNotFoundError } from "../../src/core/errors/collection.error.js";
import { TextRecognitionFailedError } from "../../src/core/errors/page-ingestion.error.js";
import type { TextRecognitionProvider } from "../../src/core/port/text-recognition.provider.js";
import type { PageIngestionPersistence } from "../../src/core/repositories/page-ingestion.persistence.js";
import type { CollectionService } from "../../src/core/services/collection.service.js";
import {
	createPageIngestionService,
	type IngestPageInput,
} from "../../src/core/services/page-ingestion.service.js";

const collection = {
	id: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
	name: "Der Vorleser",
	description: null,
	imgUrl: null,
	userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	iso: "de",
};

const page = {
	id: "d6b3df44-bfd1-4ac6-9e7c-6d828a235f0c",
	userId: collection.userId,
	collectionId: collection.id,
	name: "Page 1",
	description: null,
	summary: "Haus, Haus!",
	createdAt: new Date("2026-11-05T12:00:00.000Z"),
};

const input: IngestPageInput = {
	providerId: "provider_authenticated",
	iso: "de",
	pageId: page.id,
	collectionId: collection.id,
	name: page.name,
	description: null,
	photo: {
		bytes: new Uint8Array([0xff, 0xd8, 0xff]),
		mediaType: "image/jpeg",
	},
};

function createDependencies() {
	const getCollection = vi.fn().mockResolvedValue(collection);
	const collectionService = { getCollection } as unknown as CollectionService;
	const textRecognitionProvider: TextRecognitionProvider = {
		recognizeText: vi.fn().mockResolvedValue({ text: "Haus, Haus!" }),
	};
	const persistence: PageIngestionPersistence = {
		persistPageIngestion: vi.fn().mockResolvedValue({ page, encounters: [] }),
	};
	const service = createPageIngestionService(
		collectionService,
		textRecognitionProvider,
		persistence,
	);
	return {
		service,
		getCollection,
		textRecognitionProvider,
		persistence,
	};
}

describe("PageIngestionService", () => {
	it("recognizes and saves an owned page through provider-neutral dependencies", async () => {
		const dependencies = createDependencies();

		await expect(dependencies.service.ingestPage(input)).resolves.toEqual({
			page,
			suggestions: [],
		});
		expect(dependencies.getCollection).toHaveBeenCalledWith(
			input.providerId,
			input.iso,
			input.collectionId,
		);
		expect(dependencies.textRecognitionProvider.recognizeText).toHaveBeenCalledWith({
			image: input.photo.bytes,
			mediaType: input.photo.mediaType,
		});
		expect(dependencies.persistence.persistPageIngestion).toHaveBeenCalledWith({
			page: {
				id: input.pageId,
				userId: collection.userId,
				collectionId: collection.id,
				iso: collection.iso,
				name: input.name,
				description: null,
				summary: "Haus, Haus!",
			},
			encounters: [],
		});
		expect(dependencies.getCollection.mock.invocationCallOrder[0]).toBeLessThan(
			vi.mocked(dependencies.textRecognitionProvider.recognizeText).mock.invocationCallOrder[0]!,
		);
	});

	it("does not call OCR or persistence for a missing, cross-user, or wrong-language collection", async () => {
		const dependencies = createDependencies();
		dependencies.getCollection.mockRejectedValue(new CollectionNotFoundError());

		await expect(dependencies.service.ingestPage({ ...input, iso: "fr" }))
			.rejects.toMatchObject({ name: "CollectionNotFoundError" });
		expect(dependencies.textRecognitionProvider.recognizeText).not.toHaveBeenCalled();
		expect(dependencies.persistence.persistPageIngestion).not.toHaveBeenCalled();
	});

	it.each([
		["invalid language", { iso: "DE" }],
		["blank name", { name: "   " }],
		["blank description", { description: "\n" }],
	] as const)("rejects %s before resolving ownership", async (_label, override) => {
		const dependencies = createDependencies();
		await expect(dependencies.service.ingestPage({ ...input, ...override }))
			.rejects.toBeInstanceOf(Error);
		expect(dependencies.getCollection).not.toHaveBeenCalled();
		expect(dependencies.textRecognitionProvider.recognizeText).not.toHaveBeenCalled();
		expect(dependencies.persistence.persistPageIngestion).not.toHaveBeenCalled();
	});

	it("rejects empty recognized text without persisting a page", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.textRecognitionProvider.recognizeText)
			.mockResolvedValue({ text: " \n" });

		await expect(dependencies.service.ingestPage(input)).rejects.toMatchObject({
			name: "EmptyRecognizedTextError",
		});
		expect(dependencies.persistence.persistPageIngestion).not.toHaveBeenCalled();
	});

	it("does not persist when OCR fails", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.textRecognitionProvider.recognizeText)
			.mockRejectedValue(new TextRecognitionFailedError());

		await expect(dependencies.service.ingestPage(input)).rejects.toMatchObject({
			name: "TextRecognitionFailedError",
		});
		expect(dependencies.persistence.persistPageIngestion).not.toHaveBeenCalled();
	});
});
