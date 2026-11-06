export interface ExtractedWord {
	text: string;
	count: number;
}

export interface WordExtractionService {
	extractWords(text: string): readonly ExtractedWord[];
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

export const createWordExtractionService = (): WordExtractionService => ({
	extractWords(text) {
		const counts = new Map<string, number>();
		const normalizedText = normaliseSentence(text).split(" ");

		for (const word of normalizedText) {
			//const normalizedWord = this.normalizeWord(word);

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
