import { fileURLToPath } from "node:url";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../../src/infrastructure/data/schema.js";

export interface RepositoryTestConfig {
	databaseUrl: string;
}

export interface RepositoryTestDatabase {
	pool: Pool;
	db: NodePgDatabase<typeof schema>;
	recreateAndMigrate(): Promise<void>;
	reset(): Promise<void>;
	close(): Promise<void>;
}

const migrationsFolder = fileURLToPath(
	new URL("../../migrations", import.meta.url),
);

function databaseTarget(url: URL): string {
	const port = url.port || "5432";
	const databaseName = decodeURIComponent(url.pathname).toLowerCase();
	return `${url.hostname.toLowerCase()}:${port}${databaseName}`;
}

function parsePostgresUrl(value: string, variableName: string): URL {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`${variableName} must be a valid PostgreSQL URL`);
	}

	if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
		throw new Error(`${variableName} must use postgres or postgresql`);
	}

	return url;
}

export function loadRepositoryTestConfig(
	environment: Record<string, string | undefined>,
): RepositoryTestConfig {
	if (environment.NODE_ENV !== "test") {
		throw new Error("Repository database tests require NODE_ENV=test");
	}

	const databaseUrl = environment.TEST_DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("TEST_DATABASE_URL is required for repository tests");
	}

	const testUrl = parsePostgresUrl(databaseUrl, "TEST_DATABASE_URL");
	const databaseName = decodeURIComponent(testUrl.pathname.replace(/^\//, ""));
	if (!/(?:^|[_-])test(?:$|[_-])/i.test(databaseName)) {
		throw new Error(
			"TEST_DATABASE_URL must use a database with an explicit test database name",
		);
	}

	if (environment.DATABASE_URL) {
		const applicationUrl = parsePostgresUrl(
			environment.DATABASE_URL,
			"DATABASE_URL",
		);
		if (databaseTarget(applicationUrl) === databaseTarget(testUrl)) {
			throw new Error("TEST_DATABASE_URL must not target DATABASE_URL");
		}
	}

	return { databaseUrl };
}

export async function openRepositoryTestDatabase(
	config: RepositoryTestConfig,
): Promise<RepositoryTestDatabase> {
	const pool = new Pool({
		connectionString: config.databaseUrl,
		application_name: "langstore-repository-tests",
		max: 2,
	});
	const db = drizzle({ client: pool, schema });
	let closed = false;

	return {
		pool,
		db,
		async recreateAndMigrate() {
			await pool.query(`
				drop schema if exists drizzle cascade;
				drop schema if exists public cascade;
				create schema public;
			`);
			await migrate(db, { migrationsFolder });
		},
		async reset() {
			const tables = await pool.query<{ table_name: string }>(`
				select table_name
				from information_schema.tables
				where table_schema = 'public' and table_type = 'BASE TABLE'
				order by table_name
			`);

			if (tables.rows.length === 0) {
				return;
			}

			const identifiers = tables.rows
				.map(({ table_name }) => `"${table_name.replaceAll('"', '""')}"`)
				.join(", ");
			await pool.query(`truncate table ${identifiers} restart identity cascade`);
		},
		async close() {
			if (!closed) {
				closed = true;
				await pool.end();
			}
		},
	};
}
