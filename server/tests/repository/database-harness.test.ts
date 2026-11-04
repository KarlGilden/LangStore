import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	loadRepositoryTestConfig,
	openRepositoryTestDatabase,
	type RepositoryTestDatabase,
} from "../support/repository-test-database.js";

describe.sequential("repository database harness", () => {
	let database: RepositoryTestDatabase;

	beforeAll(async () => {
		const config = loadRepositoryTestConfig(process.env);
		database = await openRepositoryTestDatabase(config);
		await database.recreateAndMigrate();
	});

	beforeEach(async () => {
		await database.reset();
	});

	afterAll(async () => {
		await database?.close();
	});

	it("applies the committed migration chain to an empty database", async () => {
		const result = await database.pool.query<{ users: string | null }>(
			"select to_regclass('public.users')::text as users",
		);

		expect(result.rows[0]?.users).toBe("users");
	});

	it("allows a repository test to create data", async () => {
		await database.pool.query(
			"insert into users (provider_id, email) values ($1, $2)",
			["provider_test", "learner@example.com"],
		);

		const result = await database.pool.query<{ count: string }>(
			"select count(*)::text as count from users",
		);
		expect(result.rows[0]?.count).toBe("1");
	});

	it("removes data created by the previous repository test", async () => {
		const result = await database.pool.query<{ count: string }>(
			"select count(*)::text as count from users",
		);

		expect(result.rows[0]?.count).toBe("0");
	});

	it("closes database connections", async () => {
		const disposable = await openRepositoryTestDatabase(
			loadRepositoryTestConfig(process.env),
		);

		await disposable.close();

		await expect(disposable.pool.query("select 1")).rejects.toThrow();
	});
});
