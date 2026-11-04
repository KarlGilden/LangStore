import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe.sequential("User repository", () => {
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

	it("migrates the complete User field contract", async () => {
		const result = await database.pool.query<{
			column_name: string;
			data_type: string;
			is_nullable: "YES" | "NO";
			datetime_precision: number | null;
		}>(`
			select column_name, data_type, is_nullable, datetime_precision
			from information_schema.columns
			where table_schema = 'public' and table_name = 'users'
			order by ordinal_position
		`);

		expect(result.rows).toHaveLength(5);
		expect(result.rows).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ column_name: "id", data_type: "uuid", is_nullable: "NO" }),
				expect.objectContaining({ column_name: "provider_id", data_type: "text", is_nullable: "NO" }),
				expect.objectContaining({ column_name: "username", data_type: "text", is_nullable: "YES" }),
				expect.objectContaining({ column_name: "email", data_type: "text", is_nullable: "NO" }),
				expect.objectContaining({
				column_name: "created_at",
				data_type: "timestamp with time zone",
				is_nullable: "NO",
				datetime_precision: 3,
				}),
			]),
		);
	});

	it("creates and finds a user by provider ID", async () => {
		const repository = createDrizzleUserRepository(database.db);
		const created = await repository.create({
			providerId: "provider_one",
			username: "reader",
			email: "reader@example.com",
		});

		await expect(repository.findByProviderId("provider_one")).resolves.toEqual(
			created,
		);
		expect(created?.username).toBe("reader");
	});

	it("enforces unique provider IDs", async () => {
		const repository = createDrizzleUserRepository(database.db);
		await repository.create({
			providerId: "provider_duplicate",
			username: null,
			email: "first@example.com",
		});

		await expect(
			repository.create({
				providerId: "provider_duplicate",
				username: null,
				email: "second@example.com",
			}),
		).resolves.toBeNull();
	});

	it("enforces unique normalized emails", async () => {
		const repository = createDrizzleUserRepository(database.db);
		await repository.create({
			providerId: "provider_one",
			username: null,
			email: "reader@example.com",
		});

		await expect(
			repository.create({
				providerId: "provider_two",
				username: null,
				email: "reader@example.com",
			}),
		).rejects.toMatchObject({ code: "23505" });
	});
});
