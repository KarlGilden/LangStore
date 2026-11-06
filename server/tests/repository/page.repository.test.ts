import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleCollectionRepository } from "../../src/infrastructure/repositories/collection.repository.drizzle.js";
import { createDrizzlePageRepository } from "../../src/infrastructure/repositories/page.repository.drizzle.js";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe("Page repository", () => {
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

	it("migrates Page fields, ownership constraints, and query indexes", async () => {
		const columns = await database.pool.query<{
			column_name: string;
			data_type: string;
			is_nullable: "YES" | "NO";
			datetime_precision: number | null;
		}>(`
			select column_name, data_type, is_nullable, datetime_precision
			from information_schema.columns
			where table_schema = 'public' and table_name = 'pages'
			order by ordinal_position
		`);
		const constraints = await database.pool.query<{
			constraint_name: string;
			constraint_type: string;
		}>(`
			select constraint_name, constraint_type
			from information_schema.table_constraints
			where table_schema = 'public' and table_name = 'pages'
		`);
		const indexes = await database.pool.query<{ indexname: string }>(`
			select indexname
			from pg_indexes
			where schemaname = 'public' and tablename = 'pages'
		`);

		expect(columns.rows).toEqual([
			expect.objectContaining({ column_name: "id", data_type: "uuid", is_nullable: "NO" }),
			expect.objectContaining({ column_name: "user_id", data_type: "uuid", is_nullable: "NO" }),
			expect.objectContaining({ column_name: "collection_id", data_type: "uuid", is_nullable: "NO" }),
			expect.objectContaining({ column_name: "name", data_type: "text", is_nullable: "NO" }),
			expect.objectContaining({ column_name: "description", data_type: "text", is_nullable: "YES" }),
			expect.objectContaining({ column_name: "summary", data_type: "text", is_nullable: "YES" }),
			expect.objectContaining({
				column_name: "created_at",
				data_type: "timestamp with time zone",
				is_nullable: "NO",
				datetime_precision: 3,
			}),
		]);
		expect(
			constraints.rows.filter((row) => row.constraint_type === "FOREIGN KEY"),
		).toHaveLength(2);
		expect(indexes.rows.map((row) => row.indexname)).toEqual(
			expect.arrayContaining([
				"pages_user_id_created_at_id_idx",
				"pages_collection_id_idx",
			]),
		);
	});

	it("creates a page and makes an exact retry idempotent", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const collection = await createDrizzleCollectionRepository(database.db).create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		const repository = createDrizzlePageRepository(database.db);
		const input = {
			id: "00000000-0000-4000-8000-000000000001",
			userId: owner.id,
			collectionId: collection.id,
			name: "Page 1",
			description: null,
			summary: null,
		};

		const created = await repository.create(input);
		await expect(repository.create(input)).resolves.toEqual(created);
		const count = await database.pool.query<{ count: string }>(
			"select count(*) from pages where id = $1",
			[input.id],
		);
		expect(count.rows[0]?.count).toBe("1");
	});

	it("rejects reuse of a page ID with different creation fields", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const collection = await createDrizzleCollectionRepository(database.db).create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		const repository = createDrizzlePageRepository(database.db);
		const input = {
			id: "00000000-0000-4000-8000-000000000001",
			userId: owner.id,
			collectionId: collection.id,
			name: "Page 1",
			description: null,
			summary: null,
		};
		await repository.create(input);

		await expect(
			repository.create({ ...input, name: "Different page" }),
		).rejects.toMatchObject({ name: "PageCreateConflictError" });
	});

	it("enforces matching Page and Collection ownership", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const collection = await createDrizzleCollectionRepository(database.db).create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});

		await expect(
			createDrizzlePageRepository(database.db).create({
				id: "00000000-0000-4000-8000-000000000001",
				userId: other.id,
				collectionId: collection.id,
				name: "Page 1",
				description: null,
				summary: null,
			}),
		).rejects.toMatchObject({ code: "23503" });
	});

	it("scopes detail and collection listing by owner and collection language", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const collection = await createDrizzleCollectionRepository(database.db).create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		const repository = createDrizzlePageRepository(database.db);
		const created = await repository.create({
			id: "00000000-0000-4000-8000-000000000001",
			userId: owner.id,
			collectionId: collection.id,
			name: "Page 1",
			description: null,
			summary: null,
		});

		await expect(
			repository.findByIdForUserAndIso(created.id, owner.id, "de"),
		).resolves.toEqual(created);
		await expect(
			repository.findByIdForUserAndIso(created.id, owner.id, "fr"),
		).resolves.toBeNull();
		await expect(
			repository.findByIdForUserAndIso(created.id, other.id, "de"),
		).resolves.toBeNull();
		await expect(
			repository.listByCollectionForUserAndIso(collection.id, owner.id, "de"),
		).resolves.toEqual([created]);
	});

	it("selects the latest page by createdAt then id within owner and language", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const collections = createDrizzleCollectionRepository(database.db);
		const german = await collections.create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		const french = await collections.create({
			name: "French book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "fr",
		});
		const otherGerman = await collections.create({
			name: "Other German book",
			description: null,
			imgUrl: null,
			userId: other.id,
			iso: "de",
		});
		const repository = createDrizzlePageRepository(database.db);
		const first = await repository.create({
			id: "00000000-0000-4000-8000-000000000001",
			userId: owner.id,
			collectionId: german.id,
			name: "First",
			description: null,
			summary: null,
		});
		const second = await repository.create({
			id: "00000000-0000-4000-8000-000000000002",
			userId: owner.id,
			collectionId: german.id,
			name: "Second",
			description: null,
			summary: null,
		});
		await repository.create({
			id: "00000000-0000-4000-8000-000000000003",
			userId: owner.id,
			collectionId: french.id,
			name: "French",
			description: null,
			summary: null,
		});
		await repository.create({
			id: "00000000-0000-4000-8000-000000000004",
			userId: other.id,
			collectionId: otherGerman.id,
			name: "Other user",
			description: null,
			summary: null,
		});
		const sameTime = new Date("2026-11-04T12:00:00.000Z");
		await database.pool.query(
			"update pages set created_at = $1 where id = any($2::uuid[])",
			[sameTime, [first.id, second.id]],
		);

		await expect(repository.findLatestByUserAndIso(owner.id, "de")).resolves.toMatchObject({
			id: second.id,
		});
	});
});
