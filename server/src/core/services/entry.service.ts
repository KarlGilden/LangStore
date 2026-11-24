import {
	EntryNotFoundError,
	InvalidEntryLanguageCodeError,
	InvalidEntrySelectionError,
	InvalidEntryTextError,
} from "../errors/entry.error.js";
import {
	isSupportedLanguageIso,
	MAX_PAGE_ENTRY_SELECTIONS,
	MAX_PAGE_ENTRY_TEXT_LENGTH,
	MAX_PAGE_ENTRY_TRANSLATIONS,
	MAX_PAGE_ENTRY_TRANSLATION_LENGTH,
} from "@langstore/contracts";
import type { EntryRepository } from "../repositories/entry.repository.js";
import type { UserSettingsService } from "./user-settings.service.js";
import { InvalidEntryEncounterCountError } from "../errors/entry-encounter.error.js";
import { normaliseSentence } from "./word-extraction.service.js";

export type EntryServiceDependencies = {
	entryRepository: EntryRepository;
};

export interface CreateEntryInput {
	text: string;
	translations?: { text: string }[];
}

export interface SavePageEntryInput {
	text: string;
	count: number;
	translations?: { text: string }[];
}

export interface UpdateEntryTranslationsInput {
	translations: { text: string }[];
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
	if (!isSupportedLanguageIso(iso)) {
		throw new InvalidEntryLanguageCodeError();
	}
}

export const createEntryService = ({
	entryRepository,
}: EntryServiceDependencies) => {
	const createEntry = async (
		userId: string,
		iso: string,
		input: CreateEntryInput,
	) => {
		requireNonBlank("text", input.text);
		requireLanguageCode(iso);
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

	const savePageEntries = async (
		userId: string,
		iso: string,
		pageId: string,
		inputs: SavePageEntryInput[],
	) => {
		requireLanguageCode(iso);
		if (inputs.length > MAX_PAGE_ENTRY_SELECTIONS) {
			throw new InvalidEntrySelectionError(
				`entries must contain at most ${MAX_PAGE_ENTRY_SELECTIONS} items`,
			);
		}

		const seenTexts = new Set<string>();
		const validatedEntries = inputs.map((input, entryIndex) => {
			requireNonBlank("text", input.text);
			if (input.text.length > MAX_PAGE_ENTRY_TEXT_LENGTH) {
				throw new InvalidEntrySelectionError(
					`entries[${entryIndex}].text is too long`,
				);
			}

			const normalisedText = normaliseSentence(input.text);
			if (normalisedText !== input.text || normalisedText.includes(" ")) {
				throw new InvalidEntrySelectionError(
					`entries[${entryIndex}].text must be one normalized word`,
				);
			}
			if (seenTexts.has(normalisedText)) {
				throw new InvalidEntrySelectionError(
					`entries contains duplicate text: ${normalisedText}`,
				);
			}
			seenTexts.add(normalisedText);

			if (!Number.isSafeInteger(input.count) || input.count <= 0) {
				throw new InvalidEntryEncounterCountError();
			}

			const submittedTranslations = input.translations ?? [];
			if (submittedTranslations.length > MAX_PAGE_ENTRY_TRANSLATIONS) {
				throw new InvalidEntrySelectionError(
					`entries[${entryIndex}].translations must contain at most ${MAX_PAGE_ENTRY_TRANSLATIONS} items`,
				);
			}

			const translationTexts = new Set<string>();
			const translations = submittedTranslations.flatMap(
				(translation, translationIndex) => {
					if (translation.text.length > MAX_PAGE_ENTRY_TRANSLATION_LENGTH) {
						throw new InvalidEntrySelectionError(
							`entries[${entryIndex}].translations[${translationIndex}].text is too long`,
						);
					}
					if (!/\S/u.test(translation.text)) return [];
					if (translationTexts.has(translation.text)) return [];
					translationTexts.add(translation.text);
					return [{ text: translation.text }];
				},
			);

			return {
				text: normalisedText,
				count: input.count,
				translations,
			};
		});

		return entryRepository.savePageEntries({
			userId,
			iso,
			pageId,
			entries: validatedEntries,
		});
	};

	const getAllEntries = async (userId: string, iso: string) => {
		return entryRepository.getAll(userId, iso);
	};

	const getAllEntriesForReview = async (userId: string, iso: string) => {
		requireLanguageCode(iso);
		return entryRepository.getAllForReview(userId, iso);
	};

	const updateEntryTranslations = async (
		userId: string,
		iso: string,
		entryId: string,
		input: UpdateEntryTranslationsInput,
	) => {
		requireLanguageCode(iso);
		if (input.translations.length > MAX_PAGE_ENTRY_TRANSLATIONS) {
			throw new InvalidEntrySelectionError(
				`translations must contain at most ${MAX_PAGE_ENTRY_TRANSLATIONS} items`,
			);
		}

		input.translations.forEach((translation, index) => {
			requireNonBlank("translation", translation.text, index);
			if (translation.text.length > MAX_PAGE_ENTRY_TRANSLATION_LENGTH) {
				throw new InvalidEntrySelectionError(
					`translations[${index}].text is too long`,
				);
			}
		});

		const entry = await entryRepository.updateTranslations({
			entryId,
			userId,
			iso,
			translations: input.translations,
		});
		if (!entry) {
			throw new EntryNotFoundError();
		}

		return entry;
	};

	const deleteEntry = async (
		userId: string,
		iso: string,
		entryId: string,
	) => {
		requireLanguageCode(iso);
		const deleted = await entryRepository.delete(entryId, userId, iso);
		if (!deleted) {
			throw new EntryNotFoundError();
		}
	};

	return {
		createEntry,
		savePageEntries,
		getEntry,
		getAllEntries,
		getAllEntriesForReview,
		updateEntryTranslations,
		deleteEntry,
	};
};

export type EntryService = ReturnType<typeof createEntryService>;
