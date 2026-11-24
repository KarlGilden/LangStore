import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { PageNotFoundError } from "../../src/core/errors/page.error.js";
import * as schema from "../../src/infrastructure/data/schema.js";
import { createDrizzleEntryEncounterRepository } from "../../src/infrastructure/repositories/entry-encounter.repository.drizzle.js";
import { createDrizzleEntryRepository } from "../../src/infrastructure/repositories/entry.repository.drizzle.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("DrizzleEntryRepository page selections", () => {
	const pool = new Pool({ connectionString: databaseUrl, max: 2 });
	const db = drizzle({ client: pool, schema });
	const repository = createDrizzleEntryRepository(db);
	const entryEncounterRepository = createDrizzleEntryEncounterRepository(db);
	const createdUserIds: string[] = [];

	afterEach(async () => {
		if (createdUserIds.length === 0) return;
		await db.delete(schema.users).where(inArray(schema.users.id, createdUserIds));
		createdUserIds.length = 0;
	});

	afterAll(async () => {
		await pool.end();
	});

	it("creates missing entries, reuses existing entries, and preserves request order", async () => {
		const userId = await createUser("mixed");
		const pageId = await createPage(userId, "de");
		const existingEntryId = await createEntry(userId, "de", "haus");
		await db.insert(schema.translations).values({
			entryId: existingEntryId,
			text: "existing translation",
		});

		const result = await repository.savePageEntries({
			userId,
			iso: "de",
			pageId,
			entries: [
				{
					text: "ging",
					count: 1,
					translations: [{ text: "went" }],
				},
				{
					text: "haus",
					count: 3,
					translations: [{ text: "must not be appended" }],
				},
			],
		});

		expect(result.map((entry) => entry.text)).toEqual(["ging", "haus"]);
		expect(result[0]?.translations.map(({ text }) => text)).toEqual(["went"]);
		expect(result[1]?.id).toBe(existingEntryId);
		expect(result[1]?.translations.map(({ text }) => text)).toEqual([
			"existing translation",
		]);

		const encounters = await db
			.select({ text: schema.entries.text, count: schema.entryEncounters.count })
			.from(schema.entryEncounters)
			.innerJoin(
				schema.entries,
				eq(schema.entryEncounters.entryId, schema.entries.id),
			)
			.where(eq(schema.entryEncounters.pageId, pageId));
		expect(new Map(encounters.map(({ text, count }) => [text, count]))).toEqual(
			new Map([
				["ging", 1],
				["haus", 3],
			]),
		);
	});

	it("makes identical retries repeat-safe and replaces the absolute count", async () => {
		const userId = await createUser("retry");
		const pageId = await createPage(userId, "de");
		const firstInput = {
			userId,
			iso: "de",
			pageId,
			entries: [
				{
					text: "haus",
					count: 3,
					translations: [{ text: "house" }],
				},
			],
		};

		const first = await repository.savePageEntries(firstInput);
		const second = await repository.savePageEntries({
			...firstInput,
			entries: [{ ...firstInput.entries[0]!, count: 2 }],
		});

		expect(second[0]?.id).toBe(first[0]?.id);
		expect(second[0]?.translations.map(({ text }) => text)).toEqual(["house"]);
		const [encounter] = await db
			.select()
			.from(schema.entryEncounters)
			.where(eq(schema.entryEncounters.entryId, first[0]!.id));
		expect(encounter?.count).toBe(2);
		expect(
			await db
				.select()
				.from(schema.translations)
				.where(eq(schema.translations.entryId, first[0]!.id)),
		).toHaveLength(1);
	});

	it("resolves concurrent saves to one entry and one encounter", async () => {
		const userId = await createUser("concurrent");
		const pageId = await createPage(userId, "de");
		const save = (translation: string) =>
			repository.savePageEntries({
				userId,
				iso: "de",
				pageId,
				entries: [
					{
						text: "haus",
						count: 2,
						translations: [{ text: translation }],
					},
				],
			});

		const [left, right] = await Promise.all([save("house"), save("home")]);

		expect(left[0]?.id).toBe(right[0]?.id);
		const entryRows = await db
			.select()
			.from(schema.entries)
			.where(
				and(
					eq(schema.entries.userId, userId),
					eq(schema.entries.iso, "de"),
					eq(schema.entries.text, "haus"),
				),
			);
		expect(entryRows).toHaveLength(1);
		expect(
			await db
				.select()
				.from(schema.translations)
				.where(eq(schema.translations.entryId, entryRows[0]!.id)),
		).toHaveLength(1);
		expect(
			await db
				.select()
				.from(schema.entryEncounters)
				.where(eq(schema.entryEncounters.entryId, entryRows[0]!.id)),
		).toHaveLength(1);
	});

	it("rolls back entries and translations when encounter persistence fails", async () => {
		const userId = await createUser("rollback");
		const pageId = await createPage(userId, "de");

		await expect(
			repository.savePageEntries({
				userId,
				iso: "de",
				pageId,
				entries: [
					{
						text: "haus",
						count: 0,
						translations: [{ text: "house" }],
					},
				],
			}),
		).rejects.toBeDefined();

		expect(
			await db
				.select()
				.from(schema.entries)
				.where(eq(schema.entries.userId, userId)),
		).toEqual([]);
	});

	it("rejects pages outside the authenticated user and language scope", async () => {
		const userId = await createUser("caller");
		const otherUserId = await createUser("page-owner");
		const pageId = await createPage(otherUserId, "de");

		await expect(
			repository.savePageEntries({
				userId,
				iso: "de",
				pageId,
				entries: [
					{ text: "haus", count: 1, translations: [] },
				],
			}),
		).rejects.toBeInstanceOf(PageNotFoundError);

		expect(
			await db
				.select()
				.from(schema.entries)
				.where(eq(schema.entries.userId, userId)),
		).toEqual([]);
	});

	it("treats an empty selection as an owner-scoped no-op", async () => {
		const userId = await createUser("empty");
		const pageId = await createPage(userId, "de");

		await expect(
			repository.savePageEntries({
				userId,
				iso: "de",
				pageId,
				entries: [],
			}),
		).resolves.toEqual([]);
	});

	it("aggregates review counts before attaching multiple translations", async () => {
		const userId = await createUser("review");
		const firstPageId = await createPage(userId, "de");
		const secondPageId = await createPage(userId, "de");
		const encounteredEntryId = await createEntry(userId, "de", "haus");
		const unencounteredEntryId = await createEntry(userId, "de", "ging");
		await db.insert(schema.translations).values([
			{ entryId: encounteredEntryId, text: "house" },
			{ entryId: encounteredEntryId, text: "home" },
		]);
		await db.insert(schema.entryEncounters).values([
			{ entryId: encounteredEntryId, pageId: firstPageId, count: 3 },
			{ entryId: encounteredEntryId, pageId: secondPageId, count: 2 },
		]);

		const results = await repository.getAllForReview(userId, "de");
		const byId = new Map(results.map((entry) => [entry.id, entry]));

		expect(byId.get(encounteredEntryId)).toEqual(
			expect.objectContaining({
				encounterCount: 5,
				encounterPageCount: 2,
			}),
		);
		expect(
			new Set(
				byId.get(encounteredEntryId)?.translations.map(({ text }) => text),
			),
		).toEqual(new Set(["house", "home"]));
		expect(byId.get(unencounteredEntryId)).toEqual(
			expect.objectContaining({
				encounterCount: 0,
				encounterPageCount: 0,
			}),
		);
	});

	it("returns one page-vocabulary item without multiplying its absolute count", async () => {
		const userId = await createUser("page-vocabulary");
		const pageId = await createPage(userId, "de");
		const entryId = await createEntry(userId, "de", "haus");
		await db.insert(schema.translations).values([
			{ entryId, text: "house" },
			{ entryId, text: "home" },
		]);
		await db.insert(schema.entryEncounters).values({
			entryId,
			pageId,
			count: 3,
		});

		const results = await entryEncounterRepository.getAllPageVocabulary(
			pageId,
			userId,
			"de",
		);

		expect(results).toHaveLength(1);
		expect(results?.[0]?.encounter.count).toBe(3);
		expect(
			new Set(results?.[0]?.entry.translations.map(({ text }) => text)),
		).toEqual(new Set(["house", "home"]));
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

	async function createPage(userId: string, iso: string): Promise<string> {
		const collectionId = randomUUID();
		await db.insert(schema.collections).values({
			id: collectionId,
			userId,
			iso,
			name: "Test collection",
		});
		const pageId = randomUUID();
		await db.insert(schema.pages).values({
			id: pageId,
			userId,
			collectionId,
			name: "Page 1",
			summary: "Test page",
		});
		return pageId;
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
