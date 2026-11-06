import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleCollectionRepository } from "../../src/infrastructure/repositories/collection.repository.drizzle.js";
import { createDrizzleEntryRepository } from "../../src/infrastructure/repositories/entry.repository.drizzle.js";
import { createDrizzlePageIngestionPersistence } from "../../src/infrastructure/repositories/page-ingestion.persistence.drizzle.js";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe("Page ingestion persistence", () => {
	let database: RepositoryTestDatabase;

	beforeAll(async () => {
		database = await openRepositoryTestDatabase(
			loadRepositoryTestConfig(process.env),
		);
		await database.recreateAndMigrate();
	});

	beforeEach(async () => {
		await database.reset();
	});

	afterAll(async () => {
		await database?.close();
	});

	async function createOwnerCollectionAndEntry() {
		const owner = await createDrizzleUserRepository(database.db).create({
			providerId: "provider_one",
			username: null,
			email: "one@example.com",
		});
		if (!owner) throw new Error("Expected user to be created");
		const collection = await createDrizzleCollectionRepository(database.db).create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		const entry = await createDrizzleEntryRepository(database.db).create({
			text: "haus",
			userId: owner.id,
			iso: "de",
			translations: [],
		});
		return { owner, collection, entry };
	}

	it("creates a page and its existing-entry encounters in one operation", async () => {
		const { owner, collection, entry } = await createOwnerCollectionAndEntry();
		const persistence = createDrizzlePageIngestionPersistence(database.db);

		const result = await persistence.persistPageIngestion({
			page: {
				id: "00000000-0000-4000-8000-000000000001",
				userId: owner.id,
				collectionId: collection.id,
				iso: "de",
				name: "Page 1",
				description: null,
				summary: "Haus, Haus!",
			},
			encounters: [{ entryId: entry.id, count: 2 }],
		});

		expect(result.page).toMatchObject({
			userId: owner.id,
			collectionId: collection.id,
			summary: "Haus, Haus!",
		});
		expect(result.encounters).toHaveLength(1);
		expect(result.encounters[0]).toMatchObject({
			entryId: entry.id,
			pageId: result.page.id,
			count: 2,
		});
	});

	it("rolls back the page when an encounter cannot be written", async () => {
		const { owner, collection, entry } = await createOwnerCollectionAndEntry();
		const pageId = "00000000-0000-4000-8000-000000000001";

		await expect(
			createDrizzlePageIngestionPersistence(database.db).persistPageIngestion({
				page: {
					id: pageId,
					userId: owner.id,
					collectionId: collection.id,
					iso: "de",
					name: "Page 1",
					description: null,
					summary: "Haus",
				},
				encounters: [{ entryId: entry.id, count: 0 }],
			}),
		).rejects.toMatchObject({ code: "23514" });

		const stored = await database.pool.query(
			"select id from pages where id = $1",
			[pageId],
		);
		expect(stored.rows).toEqual([]);
	});
});
