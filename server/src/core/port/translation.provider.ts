export interface TranslationInput {
	texts: readonly string[];
	sourceLanguage: string;
	targetLanguage: string;
}

export interface TranslatedText {
	sourceText: string;
	translatedText: string;
}

/** Provider-neutral boundary for independent vocabulary translations. */
export interface TranslationProvider {
	translateTexts(input: TranslationInput): Promise<readonly TranslatedText[]>;
}
