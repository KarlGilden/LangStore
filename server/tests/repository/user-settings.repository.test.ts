import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleUserRepository } from "../../src/infrastructure/repositories/user.repository.drizzle.js";
import { createDrizzleUserSettingsRepository } from "../../src/infrastructure/repositories/user-settings.repository.drizzle.js";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe("User settings repository", () => {
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

	it("migrates one settings row per user with the required foreign key", async () => {
		const columns = await database.pool.query<{
			column_name: string;
			data_type: string;
			is_nullable: "YES" | "NO";
		}>(`
			select column_name, data_type, is_nullable
			from information_schema.columns
			where table_schema = 'public' and table_name = 'user_settings'
			order by ordinal_position
		`);
		const constraints = await database.pool.query<{ constraint_type: string }>(`
			select constraint_type
			from information_schema.table_constraints
			where table_schema = 'public' and table_name = 'user_settings'
		`);

		expect(columns.rows).toEqual([
			{ column_name: "user_id", data_type: "uuid", is_nullable: "NO" },
			{ column_name: "target_language", data_type: "character", is_nullable: "NO" },
			{ column_name: "user_language", data_type: "character", is_nullable: "NO" },
		]);
		expect(constraints.rows.map((row) => row.constraint_type)).toEqual(
			expect.arrayContaining(["PRIMARY KEY", "FOREIGN KEY"]),
		);
	});

	it("creates, reads, and replaces the single row for a user", async () => {
		const user = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleUserSettingsRepository(database.db);

		await repository.upsert({ userId: user.id, targetLanguage: "de", userLanguage: "en" });
		await repository.upsert({ userId: user.id, targetLanguage: "fr", userLanguage: "en" });

		await expect(repository.findByUserId(user.id)).resolves.toEqual({
			userId: user.id,
			targetLanguage: "fr",
			userLanguage: "en",
		});
		const count = await database.pool.query<{ count: string }>(
			"select count(*) from user_settings where user_id = $1",
			[user.id],
		);
		expect(count.rows[0]?.count).toBe("1");
	});

	it("isolates settings by user", async () => {
		const first = await createUser("provider_one", "one@example.com");
		const second = await createUser("provider_two", "two@example.com");
		const repository = createDrizzleUserSettingsRepository(database.db);
		await repository.upsert({ userId: first.id, targetLanguage: "de", userLanguage: "en" });
		await repository.upsert({ userId: second.id, targetLanguage: "es", userLanguage: "fr" });

		await expect(repository.findByUserId(first.id)).resolves.toMatchObject({ targetLanguage: "de" });
		await expect(repository.findByUserId(second.id)).resolves.toMatchObject({ targetLanguage: "es" });
	});

	it("enforces the User foreign key and cascades settings on deletion", async () => {
		const user = await createUser("provider_one", "one@example.com");
		const repository = createDrizzleUserSettingsRepository(database.db);
		await repository.upsert({ userId: user.id, targetLanguage: "de", userLanguage: "en" });

		await expect(
			repository.upsert({
				userId: "de44b4c8-b20d-4f6b-b919-129b32270c24",
				targetLanguage: "de",
				userLanguage: "en",
			}),
		).rejects.toMatchObject({ code: "23503" });

		await database.pool.query("delete from users where id = $1", [user.id]);
		await expect(repository.findByUserId(user.id)).resolves.toBeNull();
	});
});
