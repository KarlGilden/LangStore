export const SUPPORTED_LANGUAGES = [
	{ iso: "de", name: "German" },
	{ iso: "es", name: "Spanish" },
	{ iso: "fr", name: "French" },
	{ iso: "en", name: "English" },
] as const;

export type SupportedLanguageIso =
	(typeof SUPPORTED_LANGUAGES)[number]["iso"];

export const SUPPORTED_LANGUAGE_ISOS: readonly SupportedLanguageIso[] =
	SUPPORTED_LANGUAGES.map(({ iso }) => iso);

export const DEFAULT_LANGUAGE_ISO: SupportedLanguageIso = "de";

const supportedLanguageIsoSet: ReadonlySet<string> = new Set(
	SUPPORTED_LANGUAGE_ISOS,
);

export function isSupportedLanguageIso(
	value: string,
): value is SupportedLanguageIso {
	return supportedLanguageIsoSet.has(value);
}
