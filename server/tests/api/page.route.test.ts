import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/api/middleware/errors.js";
import {
	createCollectionPageRoutes,
	createPageRoutes,
} from "../../src/api/routes/protected/page.route.js";
import { CollectionNotFoundError } from "../../src/core/errors/collection.error.js";
import { PageNotFoundError } from "../../src/core/errors/page.error.js";
import type { PageService } from "../../src/core/services/page.service.js";
import type { EntryEncounterService } from "../../src/core/services/entry-encounter.service.js";

const page = {
	id: "d6b3df44-bfd1-4ac6-9e7c-6d828a235f0c",
	userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	collectionId: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
	name: "Page 1",
	description: null,
	summary: "A short summary",
	createdAt: new Date("2026-11-04T12:00:00.000Z"),
};

describe("page routes", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	function createApp(
		service: PageService,
		entryEncounterService?: EntryEncounterService,
	) {
		const app = Fastify();
		apps.push(app);
		app.decorateRequest("authenticatedUserId", null);
		app.addHook("preHandler", async (request) => {
			request.authenticatedUserId = "provider_authenticated";
		});
		app.setErrorHandler(errorHandler);
		app.register(createPageRoutes(service, entryEncounterService), {
			prefix: "/api/:iso/page",
		});
		app.register(createCollectionPageRoutes(service), {
			prefix: "/api/:iso/collection",
		});
		return app;
	}

	it("returns owner-scoped page detail", async () => {
		const getPage = vi.fn().mockResolvedValue(page);
		const app = createApp({ getPage } as unknown as PageService);

		const response = await app.inject({
			method: "GET",
			url: `/api/de/page/${page.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(getPage).toHaveBeenCalledWith(
			"provider_authenticated",
			"de",
			page.id,
		);
		expect(response.json()).toEqual({
			id: page.id,
			collectionId: page.collectionId,
			name: page.name,
			description: null,
			summary: page.summary,
			createdAt: "2026-11-04T12:00:00.000Z",
		});
	});

	it("returns an empty page list for an owned empty collection", async () => {
		const listCollectionPages = vi.fn().mockResolvedValue([]);
		const app = createApp({ listCollectionPages } as unknown as PageService);

		const response = await app.inject({
			method: "GET",
			url: `/api/de/collection/${page.collectionId}/page`,
		});

		expect(response.statusCode).toBe(200);
		expect(listCollectionPages).toHaveBeenCalledWith(
			"provider_authenticated",
			"de",
			page.collectionId,
		);
		expect(response.json()).toEqual([]);
	});

	it("creates a page in the collection from the authenticated route context", async () => {
		const createPage = vi.fn().mockResolvedValue(page);
		const app = createApp({ createPage } as unknown as PageService);

		const response = await app.inject({
			method: "POST",
			url: `/api/de/collection/${page.collectionId}/page`,
			payload: {
				id: page.id,
				name: page.name,
				description: page.description,
				collectionId: "attacker-collection",
				userId: "provider_attacker",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(createPage).toHaveBeenCalledWith("provider_authenticated", "de", {
			id: page.id,
			name: page.name,
			description: null,
			collectionId: page.collectionId,
		});
		expect(response.json().id).toBe(page.id);
	});

	it("returns the latest page for an explicit language", async () => {
		const getLatestPage = vi.fn().mockResolvedValue(page);
		const app = createApp({ getLatestPage } as unknown as PageService);

		const response = await app.inject({
			method: "GET",
			url: "/api/de/page/latest",
		});

		expect(response.statusCode).toBe(200);
		expect(getLatestPage).toHaveBeenCalledWith("provider_authenticated", "de");
		expect(response.json().id).toBe(page.id);
	});

	it("returns 404 for a page outside the caller scope", async () => {
		const getPage = vi.fn().mockRejectedValue(new PageNotFoundError());
		const app = createApp({ getPage } as unknown as PageService);

		const response = await app.inject({
			method: "GET",
			url: `/api/fr/page/${page.id}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("PAGE_NOT_FOUND");
	});

	it("returns 404 for a collection outside the caller scope", async () => {
		const listCollectionPages = vi
			.fn()
			.mockRejectedValue(new CollectionNotFoundError());
		const app = createApp({ listCollectionPages } as unknown as PageService);

		const response = await app.inject({
			method: "GET",
			url: `/api/de/collection/${page.collectionId}/page`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("COLLECTION_NOT_FOUND");
	});

	it("returns page vocabulary counts and translations", async () => {
		const vocabulary = [{
			entry: {
				id: "1197bff7-03e9-40b8-933d-faa88de99154",
				text: "ausgezeichnet",
				userId: page.userId,
				iso: "de",
				createdAt: new Date("2026-11-05T12:00:00.000Z"),
				translations: [
					{
						id: "139ada60-7504-43f6-ac80-092d065f645e",
						text: "excellent",
						entryId: "1197bff7-03e9-40b8-933d-faa88de99154",
						createdAt: new Date("2026-11-05T12:00:00.000Z"),
					},
				],
			},
			encounter: {
				id: "f93f0f16-ff92-47f0-b4de-e9d454a34102",
				entryId: "1197bff7-03e9-40b8-933d-faa88de99154",
				pageId: page.id,
				count: 3,
				createdAt: new Date("2026-11-05T12:00:00.000Z"),
			},
		}];
		const getPageVocabulary = vi.fn().mockResolvedValue(vocabulary);
		const app = createApp({} as PageService, {
			getPageVocabulary,
		} as unknown as EntryEncounterService);

		const response = await app.inject({
			method: "GET",
			url: `/api/de/page/${page.id}/vocabulary`,
		});

		expect(response.statusCode).toBe(200);
		expect(getPageVocabulary).toHaveBeenCalledWith(
			"provider_authenticated",
			"de",
			page.id,
		);
		expect(response.json()).toEqual([
			{
				id: vocabulary[0]!.entry.id,
				text: "ausgezeichnet",
				iso: "de",
				createdAt: "2026-11-05T12:00:00.000Z",
				count: 3,
				translations: [
					{
						id: vocabulary[0]!.entry.translations[0]!.id,
						text: "excellent",
						createdAt: "2026-11-05T12:00:00.000Z",
					},
				],
			},
		]);
	});

	it("returns 404 for another user's page vocabulary", async () => {
		const getPageVocabulary = vi.fn().mockRejectedValue(new PageNotFoundError());
		const app = createApp({} as PageService, {
			getPageVocabulary,
		} as unknown as EntryEncounterService);

		const response = await app.inject({
			method: "GET",
			url: `/api/de/page/${page.id}/vocabulary`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("PAGE_NOT_FOUND");
	});
});
