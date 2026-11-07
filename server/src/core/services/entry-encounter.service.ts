import {
	EntryEncounterLanguageMismatchError,
	EntryEncounterOwnershipError,
	InvalidEntryEncounterCountError,
} from "../errors/entry-encounter.error.js";
import { EntryNotFoundError } from "../errors/entry.error.js";
import {
	InvalidPageLanguageCodeError,
	PageNotFoundError,
} from "../errors/page.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { EntryEncounterRepository } from "../repositories/entry-encounter.repository.js";
import type { EntryRepository } from "../repositories/entry.repository.js";
import type { PageRepository } from "../repositories/page.repository.js";

export interface RecordEntryEncounterInput {
	entryId: string;
	pageId: string;
	count: number;
}

export const createEntryEncounterService = (
	entryEncounterRepository: EntryEncounterRepository,
	entryRepository: EntryRepository,
	pageRepository: PageRepository,
) => {
	const recordEncounter = async (
		userId: string,
		input: RecordEntryEncounterInput,
	) => {
		if (!Number.isSafeInteger(input.count) || input.count <= 0) {
			throw new InvalidEntryEncounterCountError();
		}

		const entry = await entryRepository.getById(input.entryId, userId);
		if (!entry) {
			throw new EntryNotFoundError();
		}

		const page = await pageRepository.getById(input.pageId, userId, entry.iso);
		if (!page) {
			throw new PageNotFoundError();
		}

		try {
			return await entryEncounterRepository.create({ ...input, userId });
		} catch (error) {
			// The repository repeats the ownership/language checks transactionally.
			// Convert races or direct repository rejections to scoped not-found errors.
			if (error instanceof EntryEncounterOwnershipError) {
				throw new PageNotFoundError();
			}
			if (error instanceof EntryEncounterLanguageMismatchError) {
				throw new PageNotFoundError();
			}
			throw error;
		}
	};

	const getPageVocabulary = async (
		userId: string,
		iso: string,
		pageId: string,
	) => {
		if (!isAssignedIso6391Code(iso)) {
			throw new InvalidPageLanguageCodeError();
		}
		const vocabulary = await entryEncounterRepository.getAllPageVocabulary(
			pageId,
			userId,
			iso,
		);
		if (!vocabulary) {
			throw new PageNotFoundError();
		}
		return vocabulary;
	};

	return { recordEncounter, getPageVocabulary };
};

export type EntryEncounterService = ReturnType<
	typeof createEntryEncounterService
>;
