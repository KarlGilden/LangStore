import {
	EntryNotFoundError,
	InvalidEntryLanguageCodeError,
	InvalidEntryTextError,
} from "../errors/entry.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { EntryRepository } from "../repositories/entry.repository.js";
import type { UserSettingsService } from "./user-settings.service.js";

export interface CreateEntryInput {
	text: string;
	translations?: { text: string }[];
}

function requireNonBlank(
	field: "text" | "translation",
	value: string,
	translationIndex?: number,
): void {
	if (!/\S/u.test(value)) {
		throw new InvalidEntryTextError(field, translationIndex);
	}
}

function requireLanguageCode(iso: string): void {
	if (!isAssignedIso6391Code(iso)) {
		throw new InvalidEntryLanguageCodeError();
	}
}

export const createEntryService = (
	entryRepository: EntryRepository,
	userSettingsService: UserSettingsService,
) => {
	const createEntry = async (
		userId: string,
		iso: string,
		input: CreateEntryInput,
	) => {
		requireNonBlank("text", input.text);
		const translations = input.translations ?? [];
		translations.forEach((translation, index) => {
			requireNonBlank("translation", translation.text, index);
		});

		return entryRepository.create({
			text: input.text,
			translations,
			userId: userId,
			iso: iso,
		});
	};

	const getEntry = async (userId: string, entryId: string) => {
		const entry = await entryRepository.getById(entryId, userId);
		if (!entry) {
			throw new EntryNotFoundError();
		}
		return entry;
	};

	const getAllEntries = async (userId: string) => {
		const settings = await userSettingsService.getSettings(userId);
		requireLanguageCode(settings.targetLanguage);
		return entryRepository.getAll(settings.userId, settings.targetLanguage);
	};

	return { createEntry, getEntry, getAllEntries };
};

export type EntryService = ReturnType<typeof createEntryService>;
