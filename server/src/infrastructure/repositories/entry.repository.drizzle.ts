import {
	and,
	asc,
	eq,
	getTableColumns,
	inArray,
	sql,
} from "drizzle-orm";
import { EntryAlreadyExistsError } from "../../core/errors/entry.error.js";
import { PageNotFoundError } from "../../core/errors/page.error.js";
import type { EntryRepository } from "../../core/repositories/entry.repository.js";
import type { Database } from "../data/db.js";
import { toDomainEntry } from "../data/mappers/entry.mapper.js";
import {
	collections,
	entries,
	entryEncounters,
	pages,
	translations,
	type TranslationRow,
} from "../data/schema.js";

export function createDrizzleEntryRepository(db: Database): EntryRepository {
	const create: EntryRepository["create"] = async (input) => {
		try {
			return await db.transaction(async (transaction) => {
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
		} catch (error) {
			if (isPostgresUniqueViolation(error)) {
				throw new EntryAlreadyExistsError();
			}
			throw error;
		}
	};

	const savePageEntries: EntryRepository["savePageEntries"] = async (input) => {
		try {
			return await db.transaction(async (transaction) => {
				const [ownedPage] = await transaction
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
							eq(pages.id, input.pageId),
							eq(pages.userId, input.userId),
							eq(collections.iso, input.iso),
						),
					)
					.limit(1);

				if (!ownedPage) {
					throw new PageNotFoundError();
				}
				if (input.entries.length === 0) {
					return [];
				}

				const entryRows = await transaction
					.insert(entries)
					.values(
						input.entries.map(({ text }) => ({
							text,
							userId: input.userId,
							iso: input.iso,
						})),
					)
					.returning();
				if (entryRows.length !== input.entries.length) {
					throw new Error("Failed to persist entries");
				}

				const entryByText = new Map(entryRows.map((row) => [row.text, row]));
				const translationInputs = input.entries.flatMap((selection) => {
					const entry = entryByText.get(selection.text);
					if (!entry) throw new Error("Failed to resolve persisted entry");
					return selection.translations.map(({ text }) => ({
						entryId: entry.id,
						text,
					}));
				});
				const translationRows = translationInputs.length
					? await transaction
							.insert(translations)
							.values(translationInputs)
							.returning()
					: [];

				await transaction.insert(entryEncounters).values(
					input.entries.map((selection) => {
						const entry = entryByText.get(selection.text);
						if (!entry) throw new Error("Failed to resolve persisted entry");
						return {
							entryId: entry.id,
							pageId: input.pageId,
							count: selection.count,
						};
					}),
				);

				const translationsByEntryId = new Map<string, TranslationRow[]>();
				for (const row of translationRows) {
					const grouped = translationsByEntryId.get(row.entryId) ?? [];
					grouped.push(row);
					translationsByEntryId.set(row.entryId, grouped);
				}

				return input.entries.map((selection) => {
					const entry = entryByText.get(selection.text);
					if (!entry) throw new Error("Failed to resolve persisted entry");
					return toDomainEntry(
						entry,
						translationsByEntryId.get(entry.id) ?? [],
					);
				});
			});
		} catch (error) {
			if (isPostgresUniqueViolation(error)) {
				throw new EntryAlreadyExistsError();
			}
			throw error;
		}
	};

	const getById: EntryRepository["getById"] = async (id, userId) => {
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

	const getByPages: EntryRepository["getByPages"] = async (
		texts,
		userId,
		iso,
	) => {
		if (texts.length === 0) {
			return [];
		}

		const entryRows = await db
			.select()
			.from(entries)
			.where(
				and(
					eq(entries.userId, userId),
					eq(entries.iso, iso),
					inArray(entries.text, [...new Set(texts)]),
				),
			)
			.orderBy(asc(entries.createdAt), asc(entries.id));

		if (entryRows.length === 0) {
			return [];
		}

		const translationRows = await db
			.select()
			.from(translations)
			.where(
				inArray(
					translations.entryId,
					entryRows.map((entry) => entry.id),
				),
			)
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

	const getAll: EntryRepository["getAll"] = async (userId, iso) => {
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
			.where(
				inArray(
					translations.entryId,
					entryRows.map((entry) => entry.id),
				),
			)
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

	const getAllForReview: EntryRepository["getAllForReview"] = async (
		userId,
		iso,
	) => {
		const encounterCounts = db
			.select({
				entryId: entryEncounters.entryId,
				encounterCount: sql<number>`sum(${entryEncounters.count})`
					.mapWith(Number)
					.as("encounter_count"),
				encounterPageCount: sql<number>`count(*)`
					.mapWith(Number)
					.as("encounter_page_count"),
			})
			.from(entryEncounters)
			.groupBy(entryEncounters.entryId)
			.as("encounter_counts");

		const reviewRows = await db
			.select({
				...getTableColumns(entries),
				encounterCount:
					sql<number>`coalesce(${encounterCounts.encounterCount}, 0)`.mapWith(
						Number,
					),
				encounterPageCount:
					sql<number>`coalesce(${encounterCounts.encounterPageCount}, 0)`.mapWith(
						Number,
					),
			})
			.from(entries)
			.leftJoin(
				encounterCounts,
				eq(encounterCounts.entryId, entries.id),
			)
			.where(and(eq(entries.userId, userId), eq(entries.iso, iso)))
			.orderBy(asc(entries.createdAt), asc(entries.id));

		if (reviewRows.length === 0) {
			return [];
		}

		const translationRows = await db
			.select()
			.from(translations)
			.where(
				inArray(
					translations.entryId,
					reviewRows.map((entry) => entry.id),
				),
			)
			.orderBy(asc(translations.createdAt), asc(translations.id));
		const byEntryId = new Map<string, TranslationRow[]>();
		for (const translation of translationRows) {
			const grouped = byEntryId.get(translation.entryId) ?? [];
			grouped.push(translation);
			byEntryId.set(translation.entryId, grouped);
		}

		return reviewRows.map((entry) => ({
			...toDomainEntry(entry, byEntryId.get(entry.id) ?? []),
			encounterCount: entry.encounterCount,
			encounterPageCount: entry.encounterPageCount,
		}));
	};

	const updateTranslations: EntryRepository["updateTranslations"] = async (
		input,
	) =>
		db.transaction(async (transaction) => {
			const [entryRow] = await transaction
				.select()
				.from(entries)
				.where(
					and(
						eq(entries.id, input.entryId),
						eq(entries.userId, input.userId),
						eq(entries.iso, input.iso),
					),
				)
				.limit(1)
				.for("update");

			if (!entryRow) {
				return null;
			}

			await transaction
				.delete(translations)
				.where(eq(translations.entryId, entryRow.id));

			if (input.translations.length > 0) {
				await transaction.insert(translations).values(
					input.translations.map((translation) => ({
						entryId: entryRow.id,
						text: translation.text,
					})),
				);
			}

			const translationRows = await transaction
				.select()
				.from(translations)
				.where(eq(translations.entryId, entryRow.id))
				.orderBy(asc(translations.createdAt), asc(translations.id));

			return toDomainEntry(entryRow, translationRows);
		});

	return {
		create,
		savePageEntries,
		getById,
		getByPages,
		getAll,
		getAllForReview,
		updateTranslations,
	};
}

function isPostgresUniqueViolation(error: unknown): boolean {
	let current = error;
	while (current && typeof current === "object") {
		if ("code" in current && current.code === "23505") return true;
		current = "cause" in current ? current.cause : undefined;
	}
	return false;
}
