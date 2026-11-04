import { and, eq } from "drizzle-orm";
import type { CollectionRepository } from "../../core/repositories/collection.repository.js";
import type { Database } from "../data/db.js";
import { toDomainCollection } from "../data/mappers/collection.mapper.js";
import { collections } from "../data/schema.js";

export function createDrizzleCollectionRepository(
	db: Database,
): CollectionRepository {
	const create: CollectionRepository["create"] = async (input) => {
		const [row] = await db.insert(collections).values(input).returning();

		if (!row) {
			throw new Error("Failed to persist collection");
		}

		return toDomainCollection(row);
	};

	const findByIdForUser: CollectionRepository["findByIdForUser"] = async (
		id,
		userId,
	) => {
		const [row] = await db
			.select()
			.from(collections)
			.where(and(eq(collections.id, id), eq(collections.userId, userId)))
			.limit(1);

		return row ? toDomainCollection(row) : null;
	};

	const listByUserAndIso: CollectionRepository["listByUserAndIso"] = async (
		userId,
		iso,
	) => {
		const rows = await db
			.select()
			.from(collections)
			.where(and(eq(collections.userId, userId), eq(collections.iso, iso)));

		return rows.map(toDomainCollection);
	};

	const updateForUser: CollectionRepository["updateForUser"] = async (
		id,
		userId,
		input,
	) => {
		const [row] = await db
			.update(collections)
			.set(input)
			.where(and(eq(collections.id, id), eq(collections.userId, userId)))
			.returning();

		return row ? toDomainCollection(row) : null;
	};

	return { create, findByIdForUser, updateForUser, listByUserAndIso };
}
