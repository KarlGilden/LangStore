import {
	EntryNotFoundError,
	InvalidEntryLanguageCodeError,
	InvalidEntryTextError,
} from "../errors/entry.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { EntryRepository } from "../repositories/entry.repository.js";
import type { UserService } from "./user.service.js";
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
	userService: UserService,
	userSettingsService: UserSettingsService,
) => {
	const createEntry = async (providerId: string, input: CreateEntryInput) => {
		requireNonBlank("text", input.text);
		const translations = input.translations ?? [];
		translations.forEach((translation, index) => {
			requireNonBlank("translation", translation.text, index);
		});

		const settings = await userSettingsService.getSettings(providerId);
		requireLanguageCode(settings.targetLanguage);
		return entryRepository.create({
			text: input.text,
			translations,
			userId: settings.userId,
			iso: settings.targetLanguage,
		});
	};

	const getEntry = async (providerId: string, entryId: string) => {
		const user = await userService.getOrCreateUser(providerId);
		const entry = await entryRepository.findByIdForUser(entryId, user.id);
		if (!entry) {
			throw new EntryNotFoundError();
		}
		return entry;
	};

	const listEntries = async (providerId: string) => {
		const settings = await userSettingsService.getSettings(providerId);
		requireLanguageCode(settings.targetLanguage);
		return entryRepository.listByUserAndIso(
			settings.userId,
			settings.targetLanguage,
		);
	};

	return { createEntry, getEntry, listEntries };
};

export type EntryService = ReturnType<typeof createEntryService>;
