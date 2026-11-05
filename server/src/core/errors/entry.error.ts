export class EntryNotFoundError extends Error {
	constructor() {
		super("Entry was not found");
		this.name = "EntryNotFoundError";
	}
}

export class InvalidEntryLanguageCodeError extends Error {
	constructor() {
		super("The selected target language must be an assigned lowercase ISO 639-1 code");
		this.name = "InvalidEntryLanguageCodeError";
	}
}

export class InvalidEntryTextError extends Error {
	constructor(
		public readonly field: "text" | "translation",
		public readonly translationIndex?: number,
	) {
		super(
			field === "text"
				? "text must contain at least one non-whitespace character"
				: `translations[${translationIndex}].text must contain at least one non-whitespace character`,
		);
		this.name = "InvalidEntryTextError";
	}
}
