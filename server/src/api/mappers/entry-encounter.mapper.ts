import type { PageVocabularyEntry } from "../../core/entities/entry-encounter.entity.js";
import type { PageVocabularyEntryViewModel } from "../schema/page.schema.js";
import { toEntryViewModel } from "./entry.mapper.js";

export function toPageVocabularyEntryViewModel(
	item: PageVocabularyEntry,
): PageVocabularyEntryViewModel {
	return {
		...toEntryViewModel(item.entry),
		count: item.encounter.count,
	};
}
