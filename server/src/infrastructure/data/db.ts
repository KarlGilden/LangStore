import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export function createDatabase(databaseUrl: string) {
	const pool = new Pool({
		connectionString: databaseUrl,
		ssl: true,
		max: 5,
	});

	const db = drizzle({ client: pool, schema });

	return {
		db,
		close: () => pool.end(),
	};
}

export type Database = ReturnType<typeof createDatabase>["db"];
