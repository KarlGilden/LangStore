import { describe, expect, it } from "vitest";
import { loadRepositoryTestConfig } from "../support/repository-test-database.js";

describe("loadRepositoryTestConfig", () => {
	it("runs only in the test environment", () => {
		expect(() =>
			loadRepositoryTestConfig({
				NODE_ENV: "production",
				TEST_DATABASE_URL:
					"postgresql://app:secret@localhost:5432/langstore_test",
			}),
		).toThrow("NODE_ENV=test");
	});

	it("requires a dedicated test database URL", () => {
		expect(() => loadRepositoryTestConfig({ NODE_ENV: "test" })).toThrow(
			"TEST_DATABASE_URL is required",
		);
	});

	it("rejects the configured application database target", () => {
		expect(() =>
			loadRepositoryTestConfig({
				NODE_ENV: "test",
				DATABASE_URL:
					"postgresql://production:secret@localhost:5432/langstore_test",
				TEST_DATABASE_URL:
					"postgresql://test:different@localhost:5432/langstore_test",
			}),
		).toThrow("TEST_DATABASE_URL must not target DATABASE_URL");
	});

	it("rejects a database without an explicit test name", () => {
		expect(() =>
			loadRepositoryTestConfig({
				NODE_ENV: "test",
				TEST_DATABASE_URL: "postgresql://app:secret@localhost:5432/langstore",
			}),
		).toThrow("test database name");
	});

	it("accepts an isolated PostgreSQL test database", () => {
		const config = loadRepositoryTestConfig({
			NODE_ENV: "test",
			TEST_DATABASE_URL:
				"postgresql://app:secret@localhost:5432/langstore_test",
		});

		expect(config.databaseUrl).toBe(
			"postgresql://app:secret@localhost:5432/langstore_test",
		);
	});
});
