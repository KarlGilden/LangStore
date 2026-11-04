import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleCollectionRepository } from "../../src/infrastructure/repositories/collection.repository.drizzle.js";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe("Collection repository", () => {
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

	it("migrates Collection fields, ownership constraints, and required indexes", async () => {
		const columns = await database.pool.query<{
			column_name: string;
			data_type: string;
			is_nullable: "YES" | "NO";
		}>(`
			select column_name, data_type, is_nullable
			from information_schema.columns
			where table_schema = 'public' and table_name = 'collections'
			order by ordinal_position
		`);
		const constraints = await database.pool.query<{
			constraint_name: string;
			constraint_type: string;
		}>(`
			select constraint_name, constraint_type
			from information_schema.table_constraints
			where table_schema = 'public' and table_name = 'collections'
		`);
		const indexes = await database.pool.query<{ indexname: string }>(`
			select indexname
			from pg_indexes
			where schemaname = 'public' and tablename = 'collections'
		`);

		expect(columns.rows).toEqual([
			{ column_name: "id", data_type: "uuid", is_nullable: "NO" },
			{ column_name: "name", data_type: "text", is_nullable: "NO" },
			{ column_name: "description", data_type: "text", is_nullable: "YES" },
			{ column_name: "img_url", data_type: "text", is_nullable: "YES" },
			{ column_name: "user_id", data_type: "uuid", is_nullable: "NO" },
			{ column_name: "iso", data_type: "character", is_nullable: "NO" },
		]);
		expect(constraints.rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ constraint_type: "FOREIGN KEY" }),
				{
					constraint_name: "collections_id_user_id_unique",
					constraint_type: "UNIQUE",
				},
			]),
		);
		expect(indexes.rows.map((row) => row.indexname)).toContain(
			"collections_user_id_iso_idx",
		);
	});

	it("creates and retrieves a collection for its owner", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleCollectionRepository(database.db);
		const created = await repository.create({
			name: "Der Vorleser",
			description: "A reading collection",
			imgUrl: "https://example.com/cover.jpg",
			userId: owner.id,
			iso: "de",
		});

		await expect(
			repository.findByIdForUserAndIso(created.id, owner.id, "de"),
		).resolves.toEqual(created);
	});

	it("does not retrieve a collection through another owner's scope", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const repository = createDrizzleCollectionRepository(database.db);
		const created = await repository.create({
			name: "Der Vorleser",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});

		await expect(
			repository.findByIdForUserAndIso(created.id, other.id, "de"),
		).resolves.toBeNull();
		await expect(
			repository.findByIdForUserAndIso(created.id, owner.id, "fr"),
		).resolves.toBeNull();
	});

	it("updates a collection only through its owner's scope", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const repository = createDrizzleCollectionRepository(database.db);
		const created = await repository.create({
			name: "Original title",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});

		await expect(
			repository.updateForUserAndIso(created.id, other.id, "de", {
				name: "Attacker title",
				description: null,
				imgUrl: null,
			}),
		).resolves.toBeNull();
		await expect(
			repository.updateForUserAndIso(created.id, owner.id, "fr", {
				name: "Wrong language title",
				description: null,
				imgUrl: null,
			}),
		).resolves.toBeNull();
		await expect(
			repository.updateForUserAndIso(created.id, owner.id, "de", {
				name: "Updated title",
				description: "Updated description",
				imgUrl: null,
			}),
		).resolves.toMatchObject({
			name: "Updated title",
			description: "Updated description",
			iso: "de",
		});
	});

	it("lists only collections for the requested owner and language", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const other = await createUser("provider_two", "two@example.com");
		const repository = createDrizzleCollectionRepository(database.db);
		const selected = await repository.create({
			name: "German book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		await repository.create({
			name: "French book",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "fr",
		});
		await repository.create({
			name: "Other user's German book",
			description: null,
			imgUrl: null,
			userId: other.id,
			iso: "de",
		});

		await expect(repository.listByUserAndIso(owner.id, "de")).resolves.toEqual([
			selected,
		]);
	});

	it("enforces the owner foreign key and cascades collections on user deletion", async () => {
		const owner = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleCollectionRepository(database.db);

		await expect(
			repository.create({
				name: "Invalid owner",
				description: null,
				imgUrl: null,
				userId: "de44b4c8-b20d-4f6b-b919-129b32270c24",
				iso: "de",
			}),
		).rejects.toMatchObject({ code: "23503" });

		const created = await repository.create({
			name: "Owned collection",
			description: null,
			imgUrl: null,
			userId: owner.id,
			iso: "de",
		});
		await database.pool.query("delete from users where id = $1", [owner.id]);
		await expect(
			repository.findByIdForUserAndIso(created.id, owner.id, "de"),
		).resolves.toBeNull();
	});
});
