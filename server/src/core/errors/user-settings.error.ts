export class SettingsNotFoundError extends Error {
	constructor() {
		super("User settings were not found");
		this.name = "SettingsNotFoundError";
	}
}

export class InvalidLanguageCodeError extends Error {
	constructor(public readonly field: "targetLanguage" | "userLanguage") {
		super(`${field} must be an assigned lowercase ISO 639-1 code`);
		this.name = "InvalidLanguageCodeError";
	}
}
