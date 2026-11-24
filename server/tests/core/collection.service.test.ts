import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { CollectionNotFoundError } from "../../src/core/errors/collection.error.js";
import type { CollectionRepository } from "../../src/core/repositories/collection.repository.js";
import { createCollectionService } from "../../src/core/services/collection.service.js";

describe("CollectionService.deleteCollection", () => {
	it("delegates an owner- and language-scoped deletion", async () => {
		const deleteCollection = vi.fn(async () => true);
		const service = createCollectionService({
			collectionRepository: createRepository(deleteCollection),
		});
		const userId = randomUUID();
		const collectionId = randomUUID();

		await expect(
			service.deleteCollection(userId, "de", collectionId),
		).resolves.toBeUndefined();
		expect(deleteCollection).toHaveBeenCalledWith(collectionId, userId, "de");
	});

	it("reports a scoped missing collection", async () => {
		const service = createCollectionService({
			collectionRepository: createRepository(vi.fn(async () => false)),
		});

		await expect(
			service.deleteCollection(randomUUID(), "de", randomUUID()),
		).rejects.toBeInstanceOf(CollectionNotFoundError);
	});
});

function createRepository(
	deleteCollection: CollectionRepository["delete"],
): CollectionRepository {
	return {
		create: vi.fn(),
		getById: vi.fn(),
		update: vi.fn(),
		delete: deleteCollection,
		getAll: vi.fn(),
	};
}
