import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/api/middleware/errors.js";
import { createEntryRoutes } from "../../src/api/routes/protected/entry.route.js";
import {
	EntryNotFoundError,
	InvalidEntryTextError,
} from "../../src/core/errors/entry.error.js";
import type { EntryService } from "../../src/core/services/entry.service.js";

const entry = {
	id: "1197bff7-03e9-40b8-933d-faa88de99154",
	text: "ausgezeichnet",
	userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
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
};

describe("entry routes", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	function createApp(service: EntryService) {
		const app = Fastify();
		apps.push(app);
		app.decorateRequest("authenticatedUserId", null);
		app.addHook("preHandler", async (request) => {
			request.authenticatedUserId = "provider_authenticated";
		});
		app.setErrorHandler(errorHandler);
		app.register(createEntryRoutes(service), { prefix: "/api/entry" });
		return app;
	}

	it("saves a selected entry using only the authenticated identity", async () => {
		const createEntry = vi.fn().mockResolvedValue(entry);
		const app = createApp({ createEntry } as unknown as EntryService);

		const response = await app.inject({
			method: "POST",
			url: "/api/entry",
			payload: {
				text: entry.text,
				translations: [{ text: "excellent" }],
				userId: "attacker",
				iso: "fr",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(createEntry).toHaveBeenCalledWith("provider_authenticated", {
			text: entry.text,
			translations: [{ text: "excellent" }],
		});
		expect(response.json()).toEqual({
			id: entry.id,
			text: entry.text,
			iso: "de",
			createdAt: "2026-11-05T12:00:00.000Z",
			translations: [
				{
					id: entry.translations[0]?.id,
					text: "excellent",
					createdAt: "2026-11-05T12:00:00.000Z",
				},
			],
		});
	});

	it("retrieves owner-scoped entry detail", async () => {
		const getEntry = vi.fn().mockResolvedValue(entry);
		const app = createApp({ getEntry } as unknown as EntryService);

		const response = await app.inject({
			method: "GET",
			url: `/api/entry/${entry.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(getEntry).toHaveBeenCalledWith("provider_authenticated", entry.id);
		expect(response.json()).not.toHaveProperty("userId");
		expect(response.json().translations[0]).not.toHaveProperty("entryId");
	});

	it("lists entries in the selected language", async () => {
		const listEntries = vi.fn().mockResolvedValue([entry]);
		const app = createApp({ listEntries } as unknown as EntryService);

		const response = await app.inject({ method: "GET", url: "/api/entry" });

		expect(response.statusCode).toBe(200);
		expect(listEntries).toHaveBeenCalledWith("provider_authenticated");
		expect(response.json()).toHaveLength(1);
	});

	it("returns a validation error for blank entry text", async () => {
		const createEntry = vi
			.fn()
			.mockRejectedValue(new InvalidEntryTextError("text"));
		const app = createApp({ createEntry } as unknown as EntryService);

		const response = await app.inject({
			method: "POST",
			url: "/api/entry",
			payload: { text: " " },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error.code).toBe("INVALID_ENTRY_TEXT");
	});

	it("returns 404 when another user's entry is requested", async () => {
		const getEntry = vi.fn().mockRejectedValue(new EntryNotFoundError());
		const app = createApp({ getEntry } as unknown as EntryService);

		const response = await app.inject({
			method: "GET",
			url: `/api/entry/${entry.id}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("ENTRY_NOT_FOUND");
	});
});
