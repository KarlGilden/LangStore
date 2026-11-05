import { and, asc, eq, inArray } from "drizzle-orm";
import type { EntryRepository } from "../../core/repositories/entry.repository.js";
import type { Database } from "../data/db.js";
import { toDomainEntry } from "../data/mappers/entry.mapper.js";
import {
	entries,
	translations,
	type TranslationRow,
} from "../data/schema.js";

export function createDrizzleEntryRepository(db: Database): EntryRepository {
	const create: EntryRepository["create"] = async (input) =>
		db.transaction(async (transaction) => {
			const [entryRow] = await transaction
				.insert(entries)
				.values({ text: input.text, userId: input.userId, iso: input.iso })
				.returning();

			if (!entryRow) {
				throw new Error("Failed to persist entry");
			}

			const translationRows = input.translations.length
				? await transaction
						.insert(translations)
						.values(
							input.translations.map((translation) => ({
								entryId: entryRow.id,
								text: translation.text,
							})),
						)
						.returning()
				: [];

			return toDomainEntry(entryRow, translationRows);
		});

	const findByIdForUser: EntryRepository["findByIdForUser"] = async (
		id,
		userId,
	) => {
		const [entryRow] = await db
			.select()
			.from(entries)
			.where(and(eq(entries.id, id), eq(entries.userId, userId)))
			.limit(1);

		if (!entryRow) {
			return null;
		}

		const translationRows = await db
			.select()
			.from(translations)
			.where(eq(translations.entryId, entryRow.id))
			.orderBy(asc(translations.createdAt), asc(translations.id));
		return toDomainEntry(entryRow, translationRows);
	};

	const listByUserAndIso: EntryRepository["listByUserAndIso"] = async (
		userId,
		iso,
	) => {
		const entryRows = await db
			.select()
			.from(entries)
			.where(and(eq(entries.userId, userId), eq(entries.iso, iso)))
			.orderBy(asc(entries.createdAt), asc(entries.id));

		if (entryRows.length === 0) {
			return [];
		}

		const translationRows = await db
			.select()
			.from(translations)
			.where(inArray(translations.entryId, entryRows.map((entry) => entry.id)))
			.orderBy(asc(translations.createdAt), asc(translations.id));
		const byEntryId = new Map<string, TranslationRow[]>();
		for (const translation of translationRows) {
			const grouped = byEntryId.get(translation.entryId) ?? [];
			grouped.push(translation);
			byEntryId.set(translation.entryId, grouped);
		}

		return entryRows.map((entry) =>
			toDomainEntry(entry, byEntryId.get(entry.id) ?? []),
		);
	};

	return { create, findByIdForUser, listByUserAndIso };
}
