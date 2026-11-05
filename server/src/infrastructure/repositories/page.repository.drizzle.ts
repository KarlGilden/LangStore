import { and, desc, eq } from "drizzle-orm";
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

		const [existing] = await db
			.select()
			.from(pages)
			.where(eq(pages.id, input.id))
			.limit(1);
		if (
			existing &&
			existing.userId === input.userId &&
			existing.collectionId === input.collectionId &&
			existing.name === input.name &&
			existing.description === input.description
		) {
			return toDomainPage(existing);
		}

		throw new PageCreateConflictError();
	};

	const findByIdForUserAndIso: PageRepository["findByIdForUserAndIso"] = async (
		id,
		userId,
		iso,
	) => {
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

	const listByCollectionForUserAndIso: PageRepository["listByCollectionForUserAndIso"] =
		async (collectionId, userId, iso) => {
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

	const findLatestByUserAndIso: PageRepository["findLatestByUserAndIso"] = async (
		userId,
		iso,
	) => {
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
				and(eq(pages.userId, userId), eq(collections.iso, iso)),
			)
			.orderBy(desc(pages.createdAt), desc(pages.id))
			.limit(1);

		return row ? toDomainPage(row.page) : null;
	};

	return {
		create,
		findByIdForUserAndIso,
		listByCollectionForUserAndIso,
		findLatestByUserAndIso,
	};
}
