export class InvalidEntryEncounterCountError extends Error {
	constructor() {
		super("count must be a positive integer");
		this.name = "InvalidEntryEncounterCountError";
	}
}

export class EntryEncounterOwnershipError extends Error {
	constructor() {
		super("Entry and page must belong to the authenticated user");
		this.name = "EntryEncounterOwnershipError";
	}
}

export class EntryEncounterLanguageMismatchError extends Error {
	constructor() {
		super("Entry language must match the page collection language");
		this.name = "EntryEncounterLanguageMismatchError";
	}
}
