import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../src/api/middleware/errors.js";
import { createCollectionRoutes } from "../../src/api/routes/protected/collection.route.js";
import {
	CollectionNotFoundError,
	InvalidCollectionLanguageCodeError,
} from "../../src/core/errors/collection.error.js";
import type { CollectionService } from "../../src/core/services/collection.service.js";

const collection = {
	id: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
	name: "Der Vorleser",
	description: "A reading collection",
	imgUrl: null,
	userId: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	iso: "de",
};

describe("collection routes", () => {
	const apps: ReturnType<typeof Fastify>[] = [];

	afterEach(async () => {
		await Promise.all(apps.map((app) => app.close()));
	});

	function createApp(service: CollectionService) {
		const app = Fastify();
		apps.push(app);
		app.decorateRequest("authenticatedUserId", null);
		app.addHook("preHandler", async (request) => {
			request.authenticatedUserId = "provider_authenticated";
		});
		app.setErrorHandler(errorHandler);
		app.register(createCollectionRoutes(service), {
			prefix: "/api/:iso/collection",
		});
		return app;
	}

	it("creates a collection using only the authenticated identity", async () => {
		const createCollection = vi.fn().mockResolvedValue(collection);
		const app = createApp({ createCollection } as unknown as CollectionService);

		const response = await app.inject({
			method: "POST",
			url: "/api/de/collection",
			payload: {
				name: collection.name,
				description: collection.description,
				userId: "provider_attacker",
			},
		});

		expect(response.statusCode).toBe(201);
		expect(createCollection).toHaveBeenCalledWith(
			"provider_authenticated",
			"de",
			{
				name: collection.name,
				description: collection.description,
			},
		);
		expect(response.json()).toEqual({
			id: collection.id,
			name: collection.name,
			description: collection.description,
			imgUrl: null,
			iso: collection.iso,
		});
	});

	it("gets collection detail through the authenticated service scope", async () => {
		const getCollection = vi.fn().mockResolvedValue(collection);
		const app = createApp({ getCollection } as unknown as CollectionService);

		const response = await app.inject({
			method: "GET",
			url: `/api/de/collection/${collection.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(getCollection).toHaveBeenCalledWith(
			"provider_authenticated",
			"de",
			collection.id,
		);
		expect(response.json()).not.toHaveProperty("userId");
	});

	it("lists selected-language collections", async () => {
		const listCollections = vi.fn().mockResolvedValue([collection]);
		const app = createApp({ listCollections } as unknown as CollectionService);

		const response = await app.inject({
			method: "GET",
			url: "/api/de/collection",
		});

		expect(response.statusCode).toBe(200);
		expect(listCollections).toHaveBeenCalledWith("provider_authenticated", "de");
		expect(response.json()).toHaveLength(1);
	});

	it("updates a collection through the authenticated service scope", async () => {
		const updated = { ...collection, name: "Updated title" };
		const updateCollection = vi.fn().mockResolvedValue(updated);
		const app = createApp({ updateCollection } as unknown as CollectionService);

		const response = await app.inject({
			method: "PUT",
			url: `/api/de/collection/${collection.id}`,
			payload: { name: "Updated title", userId: "provider_attacker" },
		});

		expect(response.statusCode).toBe(200);
		expect(updateCollection).toHaveBeenCalledWith(
			"provider_authenticated",
			"de",
			collection.id,
			{ name: "Updated title" },
		);
		expect(response.json().name).toBe("Updated title");
	});

	it.each([
		["DE", new Error("schema validation")],
		["zz", new InvalidCollectionLanguageCodeError()],
	] as const)("rejects invalid collection language %s", async (iso, failure) => {
		const createCollection = vi.fn().mockRejectedValue(failure);
		const app = createApp({ createCollection } as unknown as CollectionService);

		const response = await app.inject({
			method: "POST",
			url: `/api/${iso}/collection`,
			payload: { name: "Book" },
		});

		expect(response.statusCode).toBe(400);
	});

	it("returns 404 when another user's collection is requested", async () => {
		const getCollection = vi.fn().mockRejectedValue(new CollectionNotFoundError());
		const app = createApp({ getCollection } as unknown as CollectionService);

		const response = await app.inject({
			method: "GET",
			url: `/api/fr/collection/${collection.id}`,
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("COLLECTION_NOT_FOUND");
	});
});
