import { and, eq, inArray, sql } from "drizzle-orm";
import { CollectionNotFoundError } from "../../core/errors/collection.error.js";
import { PageCreateConflictError } from "../../core/errors/page.error.js";
import type { PageIngestionRepository } from "../../core/repositories/page-ingestion.repository.js";
import type { Database } from "../data/db.js";
import { toDomainPage } from "../data/mappers/page.mapper.js";
import {
	collections,
	entries,
	entryEncounters,
	pages,
} from "../data/schema.js";

export function createDrizzlePageIngestionRepository(
	db: Database,
): PageIngestionRepository {
	const persistPageIngestion: PageIngestionRepository["persistPageIngestion"] =
		async (input) =>
			db.transaction(async (transaction) => {
				const [ownedCollection] = await transaction
					.select({ id: collections.id })
					.from(collections)
					.where(
						and(
							eq(collections.id, input.page.collectionId),
							eq(collections.userId, input.userId),
							eq(collections.iso, input.iso),
						),
					)
					.limit(1);

				if (!ownedCollection) {
					throw new CollectionNotFoundError();
				}

				const countsByText = new Map<string, number>();
				for (const word of input.words) {
					if (countsByText.has(word.text)) {
						throw new Error("Page ingestion words must have unique text");
					}
					countsByText.set(word.text, word.count);
				}

				const matchingEntries =
					countsByText.size === 0
						? []
						: await transaction
								.select({ id: entries.id, text: entries.text })
								.from(entries)
								.where(
									and(
										eq(entries.userId, input.userId),
										eq(entries.iso, input.iso),
										inArray(entries.text, [...countsByText.keys()]),
									),
								);

				const [insertedPage] = await transaction
					.insert(pages)
					.values({
						id: input.page.id,
						userId: input.userId,
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
						pageRow.userId !== input.userId ||
						pageRow.collectionId !== input.page.collectionId ||
						pageRow.name !== input.page.name ||
						pageRow.description !== input.page.description
					) {
						throw new PageCreateConflictError();
					}
				}

				if (matchingEntries.length > 0) {
					await transaction
						.insert(entryEncounters)
						.values(
							matchingEntries.map((entry) => ({
								entryId: entry.id,
								pageId: pageRow.id,
								count: requireWordCount(countsByText, entry.text),
							})),
						)
						.onConflictDoUpdate({
							target: [entryEncounters.entryId, entryEncounters.pageId],
							set: { count: sql`excluded.count` },
						});
				}

				const matchedTextSet = new Set(
					matchingEntries.map((entry) => entry.text),
				);

				return {
					page: toDomainPage(pageRow),
					matchedTexts: input.words.flatMap((word) =>
						matchedTextSet.has(word.text) ? [word.text] : [],
					),
				};
			});

	return { persistPageIngestion };
}

function requireWordCount(
	countsByText: ReadonlyMap<string, number>,
	text: string,
): number {
	const count = countsByText.get(text);
	if (count === undefined) {
		throw new Error("Failed to resolve page ingestion word count");
	}
	return count;
}
