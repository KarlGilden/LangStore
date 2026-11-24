import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Page } from "../../src/core/entities/page.entity.js";
import { PageNotFoundError } from "../../src/core/errors/page.error.js";
import type { CollectionRepository } from "../../src/core/repositories/collection.repository.js";
import type { PageRepository } from "../../src/core/repositories/page.repository.js";
import { createPageService } from "../../src/core/services/page.service.js";

describe("PageService page management", () => {
	it("updates an owner- and language-scoped page", async () => {
		const page = createPage();
		const update = vi.fn(async () => page);
		const service = createService({ update });

		await expect(
			service.updatePage(page.userId, "de", page.id, {
				name: "Updated page",
				description: null,
			}),
		).resolves.toBe(page);
		expect(update).toHaveBeenCalledWith(page.id, page.userId, "de", {
			name: "Updated page",
			description: null,
		});
	});

	it("deletes an owner- and language-scoped page", async () => {
		const page = createPage();
		const deletePage = vi.fn(async () => true);
		const service = createService({ delete: deletePage });

		await expect(
			service.deletePage(page.userId, "de", page.id),
		).resolves.toBeUndefined();
		expect(deletePage).toHaveBeenCalledWith(page.id, page.userId, "de");
	});

	it("reports scoped missing pages for update and deletion", async () => {
		const page = createPage();
		const service = createService({
			update: vi.fn(async () => null),
			delete: vi.fn(async () => false),
		});

		await expect(
			service.updatePage(page.userId, "de", page.id, {
				name: page.name,
				description: page.description,
			}),
		).rejects.toBeInstanceOf(PageNotFoundError);
		await expect(
			service.deletePage(page.userId, "de", page.id),
		).rejects.toBeInstanceOf(PageNotFoundError);
	});
});

function createService(
	overrides: Partial<Pick<PageRepository, "update" | "delete">>,
) {
	const pageRepository = {
		create: vi.fn(),
		getById: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getByCollection: vi.fn(),
		getLatest: vi.fn(),
		...overrides,
	} as PageRepository;
	const collectionRepository = {
		getById: vi.fn(),
	} as unknown as CollectionRepository;
	return createPageService({ pageRepository, collectionRepository });
}

function createPage(): Page {
	return {
		id: randomUUID(),
		userId: randomUUID(),
		collectionId: randomUUID(),
		name: "Page 1",
		description: null,
		summary: null,
		createdAt: new Date("2026-11-24T12:00:00.000Z"),
	};
}
