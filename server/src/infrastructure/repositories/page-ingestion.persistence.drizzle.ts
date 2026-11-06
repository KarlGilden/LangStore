import { and, eq, inArray, sql } from "drizzle-orm";
import { CollectionNotFoundError } from "../../core/errors/collection.error.js";
import {
	EntryEncounterLanguageMismatchError,
	EntryEncounterOwnershipError,
} from "../../core/errors/entry-encounter.error.js";
import { PageCreateConflictError } from "../../core/errors/page.error.js";
import type { PageIngestionPersistence } from "../../core/repositories/page-ingestion.persistence.js";
import type { Database } from "../data/db.js";
import { toDomainEntryEncounter } from "../data/mappers/entry-encounter.mapper.js";
import { toDomainPage } from "../data/mappers/page.mapper.js";
import {
	collections,
	entries,
	entryEncounters,
	pages,
} from "../data/schema.js";

export function createDrizzlePageIngestionPersistence(
	db: Database,
): PageIngestionPersistence {
	const persistPageIngestion: PageIngestionPersistence["persistPageIngestion"] =
		async (input) =>
			db.transaction(async (transaction) => {
				const [ownedCollection] = await transaction
					.select({ id: collections.id })
					.from(collections)
					.where(
						and(
							eq(collections.id, input.page.collectionId),
							eq(collections.userId, input.page.userId),
							eq(collections.iso, input.page.iso),
						),
					)
					.limit(1);

				if (!ownedCollection) {
					throw new CollectionNotFoundError();
				}

				const encounterEntryIds = input.encounters.map(({ entryId }) => entryId);
				const uniqueEntryIds = [...new Set(encounterEntryIds)];
				if (uniqueEntryIds.length !== encounterEntryIds.length) {
					throw new Error("Page ingestion encounters must have unique entry IDs");
				}

				if (uniqueEntryIds.length > 0) {
					const matchingEntries = await transaction
						.select({ id: entries.id })
						.from(entries)
						.where(
							and(
								inArray(entries.id, uniqueEntryIds),
								eq(entries.userId, input.page.userId),
								eq(entries.iso, input.page.iso),
							),
						);

					if (matchingEntries.length !== uniqueEntryIds.length) {
						const ownedEntries = await transaction
							.select({ id: entries.id, iso: entries.iso })
							.from(entries)
							.where(
								and(
									inArray(entries.id, uniqueEntryIds),
									eq(entries.userId, input.page.userId),
								),
							);

						if (
							ownedEntries.length === uniqueEntryIds.length &&
							ownedEntries.some(({ iso }) => iso !== input.page.iso)
						) {
							throw new EntryEncounterLanguageMismatchError();
						}
						throw new EntryEncounterOwnershipError();
					}
				}

				const [insertedPage] = await transaction
					.insert(pages)
					.values({
						id: input.page.id,
						userId: input.page.userId,
						collectionId: input.page.collectionId,
						name: input.page.name,
						description: input.page.description,
						summary: input.page.summary,
					})
					.onConflictDoNothing({ target: pages.id })
					.returning();

				let pageRow = insertedPage;
				if (!pageRow) {
					[pageRow] = await transaction
						.select()
						.from(pages)
						.where(eq(pages.id, input.page.id))
						.limit(1);
					if (
						!pageRow ||
						pageRow.userId !== input.page.userId ||
						pageRow.collectionId !== input.page.collectionId ||
						pageRow.name !== input.page.name ||
						pageRow.description !== input.page.description
					) {
						throw new PageCreateConflictError();
					}
				}

				const encounterRows = input.encounters.length
					? await transaction
							.insert(entryEncounters)
							.values(
								input.encounters.map(({ entryId, count }) => ({
									entryId,
									pageId: pageRow.id,
									count,
								})),
							)
							.onConflictDoUpdate({
								target: [entryEncounters.entryId, entryEncounters.pageId],
								set: { count: sql`excluded.count` },
							})
							.returning()
					: [];

				return {
					page: toDomainPage(pageRow),
					encounters: encounterRows.map(toDomainEntryEncounter),
				};
			});

	return { persistPageIngestion };
}
