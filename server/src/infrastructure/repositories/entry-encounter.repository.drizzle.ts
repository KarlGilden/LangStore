import { and, asc, eq, inArray } from "drizzle-orm";
import {
	EntryEncounterLanguageMismatchError,
	EntryEncounterOwnershipError,
} from "../../core/errors/entry-encounter.error.js";
import type { EntryEncounterRepository } from "../../core/repositories/entry-encounter.repository.js";
import type { Database } from "../data/db.js";
import { toDomainEntryEncounter } from "../data/mappers/entry-encounter.mapper.js";
import { toDomainEntry } from "../data/mappers/entry.mapper.js";
import {
	collections,
	entries,
	entryEncounters,
	pages,
	translations,
	type TranslationRow,
} from "../data/schema.js";

export function createDrizzleEntryEncounterRepository(
	db: Database,
): EntryEncounterRepository {
	const record: EntryEncounterRepository["record"] = async (input) =>
		db.transaction(async (transaction) => {
			const [entry] = await transaction
				.select({ userId: entries.userId, iso: entries.iso })
				.from(entries)
				.where(eq(entries.id, input.entryId))
				.limit(1);
			const [page] = await transaction
				.select({ userId: pages.userId, iso: collections.iso })
				.from(pages)
				.innerJoin(
					collections,
					and(
						eq(pages.collectionId, collections.id),
						eq(pages.userId, collections.userId),
					),
				)
				.where(eq(pages.id, input.pageId))
				.limit(1);

			if (
				!entry ||
				!page ||
				entry.userId !== input.userId ||
				page.userId !== input.userId
			) {
				throw new EntryEncounterOwnershipError();
			}
			if (entry.iso !== page.iso) {
				throw new EntryEncounterLanguageMismatchError();
			}

			const [row] = await transaction
				.insert(entryEncounters)
				.values({
					entryId: input.entryId,
					pageId: input.pageId,
					count: input.count,
				})
				.onConflictDoUpdate({
					target: [entryEncounters.entryId, entryEncounters.pageId],
					set: { count: input.count },
				})
				.returning();

			if (!row) {
				throw new Error("Failed to persist entry encounter");
			}
			return toDomainEntryEncounter(row);
		});

	const listPageVocabulary: EntryEncounterRepository["listPageVocabulary"] =
		async (pageId, userId, iso) => {
			const [ownedPage] = await db
				.select({ id: pages.id })
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
						eq(pages.id, pageId),
						eq(pages.userId, userId),
						eq(collections.iso, iso),
					),
				)
				.limit(1);

			if (!ownedPage) {
				return null;
			}

			// Load one row per encounter before translations so a multi-translation
			// entry cannot multiply its occurrence count.
			const rows = await db
				.select({ encounter: entryEncounters, entry: entries })
				.from(entryEncounters)
				.innerJoin(entries, eq(entryEncounters.entryId, entries.id))
				.where(
					and(
						eq(entryEncounters.pageId, pageId),
						eq(entries.userId, userId),
						eq(entries.iso, iso),
					),
				)
				.orderBy(asc(entryEncounters.createdAt), asc(entryEncounters.id));

			if (rows.length === 0) {
				return [];
			}

			const translationRows = await db
				.select()
				.from(translations)
				.where(inArray(translations.entryId, rows.map(({ entry }) => entry.id)))
				.orderBy(asc(translations.createdAt), asc(translations.id));
			const translationsByEntryId = new Map<string, TranslationRow[]>();
			for (const translation of translationRows) {
				const grouped = translationsByEntryId.get(translation.entryId) ?? [];
				grouped.push(translation);
				translationsByEntryId.set(translation.entryId, grouped);
			}

			return rows.map(({ encounter, entry }) => ({
				encounter: toDomainEntryEncounter(encounter),
				entry: toDomainEntry(
					entry,
					translationsByEntryId.get(entry.id) ?? [],
				),
			}));
		};

	return { record, listPageVocabulary };
}
