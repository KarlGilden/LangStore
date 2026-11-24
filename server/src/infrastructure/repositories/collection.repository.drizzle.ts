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

	const getById: CollectionRepository["getById"] = async (id, userId, iso) => {
		const [row] = await db
			.select()
			.from(collections)
			.where(
				and(
					eq(collections.id, id),
					eq(collections.userId, userId),
					eq(collections.iso, iso),
				),
			)
			.limit(1);

		return row ? toDomainCollection(row) : null;
	};

	const getAll: CollectionRepository["getAll"] = async (userId, iso) => {
		const rows = await db
			.select()
			.from(collections)
			.where(and(eq(collections.userId, userId), eq(collections.iso, iso)));

		return rows.map(toDomainCollection);
	};

	const update: CollectionRepository["update"] = async (
		id,
		userId,
		iso,
		input,
	) => {
		const [row] = await db
			.update(collections)
			.set(input)
			.where(
				and(
					eq(collections.id, id),
					eq(collections.userId, userId),
					eq(collections.iso, iso),
				),
			)
			.returning();

		return row ? toDomainCollection(row) : null;
	};

	const deleteCollection: CollectionRepository["delete"] = async (
		id,
		userId,
		iso,
	) => {
		const [row] = await db
			.delete(collections)
			.where(
				and(
					eq(collections.id, id),
					eq(collections.userId, userId),
					eq(collections.iso, iso),
				),
			)
			.returning({ id: collections.id });

		return Boolean(row);
	};

	return {
		create,
		getById,
		update,
		delete: deleteCollection,
		getAll,
	};
}
