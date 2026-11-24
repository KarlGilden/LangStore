import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { CollectionNotFoundError } from "../../src/core/errors/collection.error.js";
import { PageCreateConflictError } from "../../src/core/errors/page.error.js";
import * as schema from "../../src/infrastructure/data/schema.js";
import { createDrizzlePageIngestionRepository } from "../../src/infrastructure/repositories/page-ingestion.repository.drizzle.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("DrizzlePageIngestionRepository", () => {
	const pool = new Pool({ connectionString: databaseUrl, max: 2 });
	const db = drizzle({ client: pool, schema });
	const repository = createDrizzlePageIngestionRepository(db);
	const createdUserIds: string[] = [];

	afterEach(async () => {
		if (createdUserIds.length === 0) return;
		await db.delete(schema.users).where(inArray(schema.users.id, createdUserIds));
		createdUserIds.length = 0;
	});

	afterAll(async () => {
		await pool.end();
	});

	it("atomically saves a page and encounters for owner-scoped matching entries", async () => {
		const userId = await createUser("owner");
		const otherUserId = await createUser("other");
		const collectionId = await createCollection(userId, "de");
		const matchingEntryId = await createEntry(userId, "de", "haus");
		await createEntry(otherUserId, "de", "welt");
		await createEntry(userId, "en", "house");
		const pageId = randomUUID();

		const result = await repository.persistPageIngestion({
			userId,
			iso: "de",
			page: {
				id: pageId,
				collectionId,
				name: "Page 1",
				description: null,
				summary: "Haus Haus Haus Welt house neu",
			},
			words: [
				{ text: "haus", count: 3 },
				{ text: "welt", count: 1 },
				{ text: "house", count: 1 },
				{ text: "neu", count: 1 },
			],
		});

		expect(result.page.id).toBe(pageId);
		expect(result.matchedTexts).toEqual(["haus"]);
		expect(
			await db
				.select()
				.from(schema.entryEncounters)
				.where(eq(schema.entryEncounters.pageId, pageId)),
		).toEqual([
			expect.objectContaining({
				entryId: matchingEntryId,
				pageId,
				count: 3,
			}),
		]);
	});

	it("replaces an existing encounter with the submitted absolute count", async () => {
		const userId = await createUser("retry");
		const collectionId = await createCollection(userId, "de");
		const entryId = await createEntry(userId, "de", "haus");
		const pageId = randomUUID();
		const baseInput = {
			userId,
			iso: "de",
			page: {
				id: pageId,
				collectionId,
				name: "Page 1",
				description: null,
				summary: "Haus Haus Haus",
			},
		};

		await repository.persistPageIngestion({
			...baseInput,
			words: [{ text: "haus", count: 3 }],
		});
		await repository.persistPageIngestion({
			...baseInput,
			words: [{ text: "haus", count: 2 }],
		});

		const encounters = await db
			.select()
			.from(schema.entryEncounters)
			.where(eq(schema.entryEncounters.entryId, entryId));
		expect(encounters).toHaveLength(1);
		expect(encounters[0]?.count).toBe(2);
	});

	it("rolls back page creation when an encounter write fails", async () => {
		const userId = await createUser("rollback");
		const collectionId = await createCollection(userId, "de");
		await createEntry(userId, "de", "haus");
		const pageId = randomUUID();

		await expect(
			repository.persistPageIngestion({
				userId,
				iso: "de",
				page: {
					id: pageId,
					collectionId,
					name: "Page 1",
					description: null,
					summary: "Haus",
				},
				words: [{ text: "haus", count: 0 }],
			}),
		).rejects.toBeDefined();

		expect(
			await db.select().from(schema.pages).where(eq(schema.pages.id, pageId)),
		).toEqual([]);
	});

	it("rejects a collection outside the authenticated user and language scope", async () => {
		const userId = await createUser("scoped");
		const otherUserId = await createUser("collection-owner");
		const collectionId = await createCollection(otherUserId, "de");
		const pageId = randomUUID();

		await expect(
			repository.persistPageIngestion({
				userId,
				iso: "de",
				page: {
					id: pageId,
					collectionId,
					name: "Page 1",
					description: null,
					summary: "Haus",
				},
				words: [{ text: "haus", count: 1 }],
			}),
		).rejects.toBeInstanceOf(CollectionNotFoundError);

		expect(
			await db.select().from(schema.pages).where(eq(schema.pages.id, pageId)),
		).toEqual([]);
	});

	it("rejects reuse of a page ID with different creation fields", async () => {
		const userId = await createUser("conflict");
		const collectionId = await createCollection(userId, "de");
		const pageId = randomUUID();
		const page = {
			id: pageId,
			collectionId,
			name: "Page 1",
			description: null,
			summary: "Haus",
		};

		await repository.persistPageIngestion({
			userId,
			iso: "de",
			page,
			words: [],
		});

		await expect(
			repository.persistPageIngestion({
				userId,
				iso: "de",
				page: { ...page, name: "Different page" },
				words: [],
			}),
		).rejects.toBeInstanceOf(PageCreateConflictError);
	});

	async function createUser(label: string): Promise<string> {
		const id = randomUUID();
		createdUserIds.push(id);
		await db.insert(schema.users).values({
			id,
			providerId: `test-${label}-${id}`,
			email: `${label}-${id}@example.test`,
		});
		return id;
	}

	async function createCollection(
		userId: string,
		iso: string,
	): Promise<string> {
		const id = randomUUID();
		await db.insert(schema.collections).values({
			id,
			userId,
			iso,
			name: "Test collection",
		});
		return id;
	}

	async function createEntry(
		userId: string,
		iso: string,
		text: string,
	): Promise<string> {
		const [entry] = await db
			.insert(schema.entries)
			.values({ userId, iso, text })
			.returning({ id: schema.entries.id });
		if (!entry) throw new Error("Failed to create test entry");
		return entry.id;
	}
});
