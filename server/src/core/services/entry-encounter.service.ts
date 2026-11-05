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
import type { UserService } from "./user.service.js";

export interface RecordEntryEncounterInput {
	entryId: string;
	pageId: string;
	count: number;
}

export const createEntryEncounterService = (
	entryEncounterRepository: EntryEncounterRepository,
	entryRepository: EntryRepository,
	pageRepository: PageRepository,
	userService: UserService,
) => {
	const recordEncounter = async (
		providerId: string,
		input: RecordEntryEncounterInput,
	) => {
		if (!Number.isSafeInteger(input.count) || input.count <= 0) {
			throw new InvalidEntryEncounterCountError();
		}

		const user = await userService.getOrCreateUser(providerId);
		const entry = await entryRepository.findByIdForUser(input.entryId, user.id);
		if (!entry) {
			throw new EntryNotFoundError();
		}

		const page = await pageRepository.findByIdForUserAndIso(
			input.pageId,
			user.id,
			entry.iso,
		);
		if (!page) {
			throw new PageNotFoundError();
		}

		try {
			return await entryEncounterRepository.record({ ...input, userId: user.id });
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
		providerId: string,
		iso: string,
		pageId: string,
	) => {
		if (!isAssignedIso6391Code(iso)) {
			throw new InvalidPageLanguageCodeError();
		}
		const user = await userService.getOrCreateUser(providerId);
		const vocabulary = await entryEncounterRepository.listPageVocabulary(
			pageId,
			user.id,
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
