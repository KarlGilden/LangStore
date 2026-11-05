export class PageNotFoundError extends Error {
	constructor() {
		super("Page was not found");
		this.name = "PageNotFoundError";
	}
}

export class PageCreateConflictError extends Error {
	constructor() {
		super("The page ID is already in use with different creation fields");
		this.name = "PageCreateConflictError";
	}
}

export class InvalidPageLanguageCodeError extends Error {
	constructor() {
		super("iso must be an assigned lowercase ISO 639-1 code");
		this.name = "InvalidPageLanguageCodeError";
	}
}

export class InvalidPageTextError extends Error {
	constructor(public readonly field: "name" | "description") {
		super(`${field} must contain at least one non-whitespace character`);
		this.name = "InvalidPageTextError";
	}
}
