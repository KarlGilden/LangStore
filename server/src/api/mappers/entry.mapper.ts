import type { Entry } from "../../core/entities/entry.entity.js";
import type { EntryViewModel } from "../schema/entry.schema.js";

export function toEntryViewModel(entry: Entry): EntryViewModel {
	return {
		id: entry.id,
		text: entry.text,
		createdAt: entry.createdAt.toISOString(),
		translations: entry.translations.map((translation) => ({
			id: translation.id,
			text: translation.text,
			createdAt: translation.createdAt.toISOString(),
		})),
	};
}
