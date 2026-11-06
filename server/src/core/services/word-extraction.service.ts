export interface ExtractedWord {
	text: string;
	count: number;
}

export interface WordExtractionService {
	extractWords(text: string): readonly ExtractedWord[];
	normalizeWord(text: string): string | null;
}

const WORD_PART = /[\p{L}\p{M}\p{N}]/u;
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

/**
 * Joiners preserved only when they occur between word characters.
 *
 * Straight and curly apostrophes remain distinct deliberately. The three
 * hyphens cover the ASCII hyphen-minus and the two Unicode hyphens commonly
 * produced by OCR. All other punctuation and symbols are token boundaries.
 */
const INTERNAL_JOINERS = new Set(["'", "\u2019", "-", "\u2010", "\u2011"]);

function tokenize(text: string): string[] {
	const characters = Array.from(text.toLowerCase());
	const tokens: string[] = [];
	let current = "";

	const flush = () => {
		if (LETTER_OR_NUMBER.test(current)) {
			tokens.push(current);
		}
		current = "";
	};

	for (let index = 0; index < characters.length; index += 1) {
		const character = characters[index]!;
		if (WORD_PART.test(character)) {
			current += character;
			continue;
		}

		const nextCharacter = characters[index + 1];
		if (
			INTERNAL_JOINERS.has(character) &&
			current.length > 0 &&
			nextCharacter !== undefined &&
			WORD_PART.test(nextCharacter)
		) {
			current += character;
			continue;
		}

		flush();
	}

	flush();
	return tokens;
}

export const createWordExtractionService = (): WordExtractionService => ({
	extractWords(text) {
		const counts = new Map<string, number>();
		for (const token of tokenize(text)) {
			counts.set(token, (counts.get(token) ?? 0) + 1);
		}

		return Array.from(counts, ([normalizedText, count]) => ({
			text: normalizedText,
			count,
		}));
	},

	normalizeWord(text) {
		const tokens = tokenize(text);
		return tokens.length === 1 ? tokens[0]! : null;
	},
});
