import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CreateEntryInput } from "../../src/core/repositories/entry.repository.js";
import { createDrizzleEntryRepository } from "../../src/infrastructure/repositories/entry.repository.drizzle.js";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe("Entry repository", () => {
	let database: RepositoryTestDatabase;

	beforeAll(async () => {
		database = await openRepositoryTestDatabase(loadRepositoryTestConfig(process.env));
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

	it("migrates Entry and Translation fields, relationships, and indexes", async () => {
		const columns = await database.pool.query<{
			table_name: string;
			column_name: string;
			data_type: string;
			is_nullable: "YES" | "NO";
		}>(`
			select table_name, column_name, data_type, is_nullable
			from information_schema.columns
			where table_schema = 'public' and table_name in ('entries', 'translations')
			order by table_name, ordinal_position
		`);
		const constraints = await database.pool.query<{
			table_name: string;
			constraint_name: string;
			constraint_type: string;
		}>(`
			select table_name, constraint_name, constraint_type
			from information_schema.table_constraints
			where table_schema = 'public' and table_name in ('entries', 'translations')
		`);
		const indexes = await database.pool.query<{
			tablename: string;
			indexname: string;
		}>(`
			select tablename, indexname
			from pg_indexes
			where schemaname = 'public' and tablename in ('entries', 'translations')
		`);

		expect(columns.rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ table_name: "entries", column_name: "text", is_nullable: "NO" }),
				expect.objectContaining({ table_name: "entries", column_name: "user_id", data_type: "uuid" }),
				expect.objectContaining({ table_name: "entries", column_name: "iso", is_nullable: "NO" }),
				expect.objectContaining({ table_name: "translations", column_name: "text", is_nullable: "NO" }),
				expect.objectContaining({ table_name: "translations", column_name: "entry_id", data_type: "uuid" }),
			]),
		);
		expect(
			columns.rows.some(
				(column) =>
					column.table_name === "translations" && column.column_name === "iso",
			),
		).toBe(false);
		expect(
			constraints.rows.filter((row) => row.constraint_type === "FOREIGN KEY"),
		).toHaveLength(2);
		expect(indexes.rows.map((row) => row.indexname)).toEqual(
			expect.arrayContaining([
				"entries_user_id_iso_idx",
				"translations_entry_id_idx",
			]),
		);
	});

	it("creates an entry and its initial translations atomically", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleEntryRepository(database.db);

		const created = await repository.create({
			text: "ausgezeichnet",
			userId: owner.id,
			iso: "de",
			translations: [{ text: "excellent" }, { text: "outstanding" }],
		});

		expect(created).toMatchObject({
			text: "ausgezeichnet",
			userId: owner.id,
			iso: "de",
		});
		expect(created.translations.map((translation) => translation.text)).toEqual([
			"excellent",
			"outstanding",
		]);
	});

	it("rolls back the entry when a translation cannot be persisted", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleEntryRepository(database.db);
		const invalidInput = {
			text: "ausgezeichnet",
			userId: owner.id,
			iso: "de",
			translations: [{ text: null }],
		} as unknown as CreateEntryInput;

		await expect(repository.create(invalidInput)).rejects.toBeDefined();
		const count = await database.pool.query<{ count: string }>(
			"select count(*) from entries where user_id = $1",
			[owner.id],
		);
		expect(count.rows[0]?.count).toBe("0");
	});

	it("scopes detail to the authenticated owner", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const repository = createDrizzleEntryRepository(database.db);
		const created = await repository.create({
			text: "ausgezeichnet",
			userId: owner.id,
			iso: "de",
			translations: [{ text: "excellent" }],
		});

		await expect(
			repository.findByIdForUser(created.id, owner.id),
		).resolves.toEqual(created);
		await expect(
			repository.findByIdForUser(created.id, other.id),
		).resolves.toBeNull();
	});

	it("lists only entries matching owner and selected language", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const repository = createDrizzleEntryRepository(database.db);
		const german = await repository.create({
			text: "ausgezeichnet",
			userId: owner.id,
			iso: "de",
			translations: [],
		});
		await repository.create({
			text: "formidable",
			userId: owner.id,
			iso: "fr",
			translations: [],
		});
		await repository.create({
			text: "wunderbar",
			userId: other.id,
			iso: "de",
			translations: [],
		});

		await expect(repository.listByUserAndIso(owner.id, "de")).resolves.toEqual([
			german,
		]);
	});

	it("does not merge entries with the same text", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleEntryRepository(database.db);
		const input = {
			text: "Bank",
			userId: owner.id,
			iso: "de",
			translations: [] as { text: string }[],
		};

		const first = await repository.create(input);
		const second = await repository.create(input);

		expect(second.id).not.toBe(first.id);
		await expect(repository.listByUserAndIso(owner.id, "de")).resolves.toHaveLength(2);
	});
});
