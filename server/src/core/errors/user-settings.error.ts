export class SettingsNotFoundError extends Error {
	constructor() {
		super("User settings were not found");
		this.name = "SettingsNotFoundError";
	}
}

export class InvalidLanguageCodeError extends Error {
	constructor(public readonly field: "targetLanguage" | "userLanguage") {
		super(`${field} must be a supported language code`);
		this.name = "InvalidLanguageCodeError";
	}
}
