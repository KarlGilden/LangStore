import { and, desc, eq, inArray } from "drizzle-orm";
import { PageCreateConflictError } from "../../core/errors/page.error.js";
import type { PageRepository } from "../../core/repositories/page.repository.js";
import type { Database } from "../data/db.js";
import { toDomainPage } from "../data/mappers/page.mapper.js";
import { collections, pages } from "../data/schema.js";

export function createDrizzlePageRepository(db: Database): PageRepository {
	const create: PageRepository["create"] = async (input) => {
		const [inserted] = await db
			.insert(pages)
			.values(input)
			.onConflictDoNothing({ target: pages.id })
			.returning();

		if (inserted) {
			return toDomainPage(inserted);
		}

		throw new PageCreateConflictError();
	};

	const getById: PageRepository["getById"] = async (id, userId, iso) => {
		const [row] = await db
			.select({ page: pages })
			.from(pages)
			.innerJoin(
				collections,
				and(
					eq(pages.collectionId, collections.id),
					eq(pages.userId, collections.userId),
				),
			)
			.where(
				and(
					eq(pages.id, id),
					eq(pages.userId, userId),
					eq(collections.iso, iso),
				),
			)
			.limit(1);

		return row ? toDomainPage(row.page) : null;
	};

	const getByCollection: PageRepository["getByCollection"] = async (
		collectionId,
		userId,
		iso,
	) => {
		const rows = await db
			.select({ page: pages })
			.from(pages)
			.innerJoin(
				collections,
				and(
					eq(pages.collectionId, collections.id),
					eq(pages.userId, collections.userId),
				),
			)
			.where(
				and(
					eq(pages.collectionId, collectionId),
					eq(pages.userId, userId),
					eq(collections.iso, iso),
				),
			);

		return rows.map((row) => toDomainPage(row.page));
	};

	const collectionIdsInScope = (userId: string, iso: string) =>
		db
			.select({ id: collections.id })
			.from(collections)
			.where(
				and(eq(collections.userId, userId), eq(collections.iso, iso)),
			);

	const update: PageRepository["update"] = async (
		id,
		userId,
		iso,
		input,
	) => {
		const [row] = await db
			.update(pages)
			.set(input)
			.where(
				and(
					eq(pages.id, id),
					eq(pages.userId, userId),
					inArray(pages.collectionId, collectionIdsInScope(userId, iso)),
				),
			)
			.returning();

		return row ? toDomainPage(row) : null;
	};

	const deletePage: PageRepository["delete"] = async (id, userId, iso) => {
		const [row] = await db
			.delete(pages)
			.where(
				and(
					eq(pages.id, id),
					eq(pages.userId, userId),
					inArray(pages.collectionId, collectionIdsInScope(userId, iso)),
				),
			)
			.returning({ id: pages.id });

		return Boolean(row);
	};

	const getLatest: PageRepository["getLatest"] = async (userId, iso) => {
		const [row] = await db
			.select({ page: pages })
			.from(pages)
			.innerJoin(
				collections,
				and(
					eq(pages.collectionId, collections.id),
					eq(pages.userId, collections.userId),
				),
			)
			.where(and(eq(pages.userId, userId), eq(collections.iso, iso)))
			.orderBy(desc(pages.createdAt), desc(pages.id))
			.limit(1);

		return row ? toDomainPage(row.page) : null;
	};

	return {
		create,
		getById,
		update,
		delete: deletePage,
		getByCollection,
		getLatest,
	};
}
