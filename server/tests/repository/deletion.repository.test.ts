import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import * as schema from "../../src/infrastructure/data/schema.js";
import { createDrizzleCollectionRepository } from "../../src/infrastructure/repositories/collection.repository.drizzle.js";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("Drizzle deletion repositories", () => {
	const pool = new Pool({ connectionString: databaseUrl, max: 2 });
	const db = drizzle({ client: pool, schema });
	const collectionRepository = createDrizzleCollectionRepository(db);
	const createdUserIds: string[] = [];

	afterEach(async () => {
		if (createdUserIds.length === 0) return;
		await db.delete(schema.users).where(inArray(schema.users.id, createdUserIds));
		createdUserIds.length = 0;
	});

	afterAll(async () => {
		await pool.end();
	});

	it("deletes a collection's pages and encounters but preserves entries", async () => {
		const userId = await createUser("collection-delete");
		const collectionId = randomUUID();
		const pageId = randomUUID();
		const entryId = randomUUID();
		await db.insert(schema.collections).values({
			id: collectionId,
			userId,
			iso: "de",
			name: "Test collection",
		});
		await db.insert(schema.pages).values({
			id: pageId,
			userId,
			collectionId,
			name: "Page 1",
		});
		await db.insert(schema.entries).values({
			id: entryId,
			userId,
			iso: "de",
			text: "haus",
		});
		await db.insert(schema.entryEncounters).values({ entryId, pageId });

		await expect(
			collectionRepository.delete(collectionId, userId, "de"),
		).resolves.toBe(true);
		expect(await db.select().from(schema.pages).where(eq(schema.pages.id, pageId))).toEqual([]);
		expect(
			await db
				.select()
				.from(schema.entryEncounters)
				.where(eq(schema.entryEncounters.pageId, pageId)),
		).toEqual([]);
		expect(
			await db.select().from(schema.entries).where(eq(schema.entries.id, entryId)),
		).toHaveLength(1);
	});

	async function createUser(label: string): Promise<string> {
		const id = randomUUID();
		createdUserIds.push(id);
		await db.insert(schema.users).values({
			id,
			providerId: `test-${label}-${id}`,
			email: `${label}-${id}@example.test`,
		});
		return id;
	}
});
