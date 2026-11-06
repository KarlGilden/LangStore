import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleCollectionRepository } from "../../src/infrastructure/repositories/collection.repository.drizzle.js";
import { createDrizzleEntryEncounterRepository } from "../../src/infrastructure/repositories/entry-encounter.repository.drizzle.js";
import { createDrizzleEntryRepository } from "../../src/infrastructure/repositories/entry.repository.drizzle.js";
import { createDrizzlePageRepository } from "../../src/infrastructure/repositories/page.repository.drizzle.js";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe("EntryEncounter repository", () => {
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

	async function createUser(providerId: string, email: string) {
		const user = await createDrizzleUserRepository(database.db).create({
			providerId,
			username: null,
			email,
		});
		if (!user) throw new Error("Expected user to be created");
		return user;
	}

	async function createPageAndEntry(options?: {
		entryIso?: string;
		entryOwner?: "owner" | "other";
		pageIso?: string;
	}) {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const collection = await createDrizzleCollectionRepository(database.db).create({
			name: "Book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: options?.pageIso ?? "de",
		});
		const page = await createDrizzlePageRepository(database.db).create({
			id: "00000000-0000-4000-8000-000000000001",
			userId: owner.id,
			collectionId: collection.id,
			name: "Page 1",
			description: null,
			summary: null,
		});
		const entryOwner = options?.entryOwner === "other" ? other : owner;
		const entry = await createDrizzleEntryRepository(database.db).create({
			text: "ausgezeichnet",
			userId: entryOwner.id,
			iso: options?.entryIso ?? "de",
			translations: [{ text: "excellent" }, { text: "outstanding" }],
		});
		return { owner, other, page, entry };
	}

	it("migrates foreign keys, positive count, unique pair, and query index", async () => {
		const constraints = await database.pool.query<{
			constraint_name: string;
			constraint_type: string;
			check_clause: string | null;
		}>(`
			select tc.constraint_name, tc.constraint_type, cc.check_clause
			from information_schema.table_constraints tc
			left join information_schema.check_constraints cc
				on cc.constraint_name = tc.constraint_name
			where tc.table_schema = 'public' and tc.table_name = 'entry_encounters'
		`);
		const indexes = await database.pool.query<{ indexname: string }>(`
			select indexname
			from pg_indexes
			where schemaname = 'public' and tablename = 'entry_encounters'
		`);

		expect(
			constraints.rows.filter((row) => row.constraint_type === "FOREIGN KEY"),
		).toHaveLength(2);
		expect(
			constraints.rows.some(
				(row) =>
					row.constraint_type === "UNIQUE" &&
					row.constraint_name === "entry_encounters_entry_id_page_id_unique",
			),
		).toBe(true);
		expect(
			constraints.rows.some(
				(row) =>
					row.constraint_type === "CHECK" &&
					row.check_clause?.includes("count") &&
					row.check_clause.includes("> 0"),
			),
		).toBe(true);
		expect(indexes.rows.map((row) => row.indexname)).toContain(
			"entry_encounters_page_id_entry_id_idx",
		);
	});

	it("upserts an absolute count so retries do not increment", async () => {
		const { owner, page, entry } = await createPageAndEntry();
		const repository = createDrizzleEntryEncounterRepository(database.db);

		const created = await repository.record({
			entryId: entry.id,
			pageId: page.id,
			count: 3,
			userId: owner.id,
		});
		const replayed = await repository.record({
			entryId: entry.id,
			pageId: page.id,
			count: 3,
			userId: owner.id,
		});
		const corrected = await repository.record({
			entryId: entry.id,
			pageId: page.id,
			count: 2,
			userId: owner.id,
		});

		expect(replayed.id).toBe(created.id);
		expect(corrected).toMatchObject({ id: created.id, count: 2 });
		const stored = await database.pool.query<{ count: number }>(
			"select count from entry_encounters where entry_id = $1 and page_id = $2",
			[entry.id, page.id],
		);
		expect(stored.rows).toEqual([{ count: 2 }]);
	});

	it("rejects non-positive counts at the database boundary", async () => {
		const { owner, page, entry } = await createPageAndEntry();
		await expect(
			createDrizzleEntryEncounterRepository(database.db).record({
				entryId: entry.id,
				pageId: page.id,
				count: 0,
				userId: owner.id,
			}),
		).rejects.toMatchObject({ code: "23514" });
	});

	it("rejects cross-user entry and page pairs", async () => {
		const { owner, page, entry } = await createPageAndEntry({
			entryOwner: "other",
		});
		await expect(
			createDrizzleEntryEncounterRepository(database.db).record({
				entryId: entry.id,
				pageId: page.id,
				count: 1,
				userId: owner.id,
			}),
		).rejects.toMatchObject({ name: "EntryEncounterOwnershipError" });
	});

	it("rejects an Entry.iso and Collection.iso mismatch", async () => {
		const { owner, page, entry } = await createPageAndEntry({
			entryIso: "fr",
			pageIso: "de",
		});
		await expect(
			createDrizzleEntryEncounterRepository(database.db).record({
				entryId: entry.id,
				pageId: page.id,
				count: 1,
				userId: owner.id,
			}),
		).rejects.toMatchObject({
			name: "EntryEncounterLanguageMismatchError",
		});
	});

	it("retrieves page entries with translations without multiplying counts", async () => {
		const { owner, other, page, entry } = await createPageAndEntry();
		const repository = createDrizzleEntryEncounterRepository(database.db);
		await repository.record({
			entryId: entry.id,
			pageId: page.id,
			count: 4,
			userId: owner.id,
		});

		const vocabulary = await repository.listPageVocabulary(
			page.id,
			owner.id,
			"de",
		);

		expect(vocabulary).toHaveLength(1);
		expect(vocabulary?.[0]).toMatchObject({
			entry: { id: entry.id },
			encounter: { count: 4 },
		});
		expect(vocabulary?.[0]?.entry.translations.map(({ text }) => text)).toEqual([
			"excellent",
			"outstanding",
		]);
		await expect(
			repository.listPageVocabulary(page.id, other.id, "de"),
		).resolves.toBeNull();
		await expect(
			repository.listPageVocabulary(page.id, owner.id, "fr"),
		).resolves.toBeNull();
	});
});
