import type { Entry } from "../../../core/entities/entry.entity.js";
import type { Translation } from "../../../core/entities/translation.entity.js";
import type { EntryRow, TranslationRow } from "../schema.js";

export function toDomainTranslation(row: TranslationRow): Translation {
	return {
		id: row.id,
		text: row.text,
		entryId: row.entryId,
		createdAt: row.createdAt,
	};
}

export function toDomainEntry(
	row: EntryRow,
	translationRows: TranslationRow[],
): Entry {
	return {
		id: row.id,
		text: row.text,
		userId: row.userId,
		createdAt: row.createdAt,
		iso: row.iso,
		translations: translationRows.map(toDomainTranslation),
	};
}
