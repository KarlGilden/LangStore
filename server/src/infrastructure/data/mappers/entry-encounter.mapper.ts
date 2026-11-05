import type { EntryEncounter } from "../../../core/entities/entry-encounter.entity.js";
import type { EntryEncounterRow } from "../schema.js";

export function toDomainEntryEncounter(
	row: EntryEncounterRow,
): EntryEncounter {
	return {
		id: row.id,
		entryId: row.entryId,
		pageId: row.pageId,
		count: row.count,
		createdAt: row.createdAt,
	};
}
