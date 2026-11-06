import type { EntryRepository } from "../repositories/entry.repository.js";

export interface ExtractedWord {
	text: string;
	count: number;
}

export interface WordExtractionService {
	extractWords(
		text: string,
		userId: string,
		iso: string,
	): Promise<ExtractedWord[]>;
}

export function normaliseSentence(text: string): string {
	const normalised = text
		.normalize("NFC")
		.toLowerCase()
		.replace(/[‘’ʼ]/gu, "'")
		.replace(/[\u2010\u2011]/gu, "-"); // hyphen and nonbreaking hyphen

	const wordPattern =
		/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['-][\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*/gu;

	return (normalised.match(wordPattern) ?? []).join(" ");
}

export const createWordExtractionService = (
	entryRepository: EntryRepository,
): WordExtractionService => ({
	async extractWords(text, userId, iso) {
		const counts = new Map<string, number>();
		const extractedWords = normaliseSentence(text).split(" ");

		const entries = await entryRepository.listByUserAndIso(userId, iso);

		const filteredWords = extractedWords.filter(
			(word) => !entries.some((entry) => entry.text === word),
		);

		for (const word of filteredWords) {
			if (word === "") {
				continue;
			}

			counts.set(word, (counts.get(word) ?? 0) + 1);
		}

		return Array.from(counts, ([normalizedText, count]) => ({
			text: normalizedText,
			count,
		}));
	},
});
