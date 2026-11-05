import type { Entry } from "../../core/entities/entry.entity.js";
import type { EntryViewModel } from "../viewmodels/entry.viewmodel.js";

export function toEntryViewModel(entry: Entry): EntryViewModel {
	return {
		id: entry.id,
		text: entry.text,
		iso: entry.iso,
		createdAt: entry.createdAt.toISOString(),
		translations: entry.translations.map((translation) => ({
			id: translation.id,
			text: translation.text,
			createdAt: translation.createdAt.toISOString(),
		})),
	};
}
