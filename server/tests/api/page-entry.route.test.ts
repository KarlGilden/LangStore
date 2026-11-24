import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageNotFoundError } from "../../src/core/errors/page.error.js";
import type { Entry } from "../../src/core/entities/entry.entity.js";
import {
	APPLICATION_SERVICES_DECORATOR,
	type ApplicationServices,
} from "../../src/api/composition/serviceUtils.js";
import { errorHandler } from "../../src/api/middleware/errors.js";
import { pageRoutes } from "../../src/api/routes/api/learn/page.route.js";
import type { EntryService } from "../../src/core/services/entry.service.js";

describe("POST /:iso/page/:id/entries", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.splice(0).map((app) => app.close()));
	});

	it("forwards only authenticated route context and selected entries", async () => {
		const userId = randomUUID();
		const pageId = randomUUID();
		const entry = createEntry(userId);
		const savePageEntries = vi.fn(async () => [entry]);
		const app = await createPageRouteApp(userId, savePageEntries);

		const response = await app.inject({
			method: "POST",
			url: `/de/page/${pageId}/entries`,
			payload: {
				entries: [
					{
						text: "haus",
						count: 2,
						translations: [{ text: "house" }],
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(savePageEntries).toHaveBeenCalledWith(userId, "de", pageId, [
			{
				text: "haus",
				count: 2,
				translations: [{ text: "house" }],
			},
		]);
		expect(response.json()).toEqual([
			{
				id: entry.id,
				text: "haus",
				createdAt: "2026-11-24T12:00:00.000Z",
				translations: [],
			},
		]);
	});

	it("returns an empty array for an empty selection", async () => {
		const savePageEntries = vi.fn(async () => []);
		const app = await createPageRouteApp(randomUUID(), savePageEntries);

		const response = await app.inject({
			method: "POST",
			url: `/de/page/${randomUUID()}/entries`,
			payload: { entries: [] },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual([]);
	});

	it("maps scoped page failures to the existing not-found response", async () => {
		const savePageEntries = vi.fn(async () => {
			throw new PageNotFoundError();
		});
		const app = await createPageRouteApp(randomUUID(), savePageEntries);

		const response = await app.inject({
			method: "POST",
			url: `/de/page/${randomUUID()}/entries`,
			payload: {
				entries: [{ text: "haus", count: 1, translations: [] }],
			},
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error).toEqual({
			code: "PAGE_NOT_FOUND",
			message: "Page was not found",
		});
	});

	it("rejects structurally invalid selections before calling the service", async () => {
		const savePageEntries = vi.fn(async () => []);
		const app = await createPageRouteApp(randomUUID(), savePageEntries);

		const response = await app.inject({
			method: "POST",
			url: `/de/page/${randomUUID()}/entries`,
			payload: { entries: [{ text: "haus", count: 0 }] },
		});

		expect(response.statusCode).toBe(400);
		expect(savePageEntries).not.toHaveBeenCalled();
	});

	async function createPageRouteApp(
		userId: string,
		savePageEntries: EntryService["savePageEntries"],
	) {
		const app = Fastify({ logger: false });
		apps.push(app);
		app.decorate(
			APPLICATION_SERVICES_DECORATOR,
			{
				entryService: { savePageEntries },
				pageService: {},
				entryEncounterService: {},
			} as unknown as ApplicationServices,
		);
		app.decorateRequest("currentUserId", null);
		app.addHook("onRequest", async (request) => {
			request.currentUserId = userId;
		});
		app.setErrorHandler(errorHandler);
		await app.register(pageRoutes, { prefix: "/:iso/page" });
		await app.ready();
		return app;
	}
});

function createEntry(userId: string): Entry {
	return {
		id: randomUUID(),
		text: "haus",
		userId,
		iso: "de",
		createdAt: new Date("2026-11-24T12:00:00.000Z"),
		translations: [],
	};
}
