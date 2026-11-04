export class CollectionNotFoundError extends Error {
	constructor() {
		super("Collection was not found");
		this.name = "CollectionNotFoundError";
	}
}

export class InvalidCollectionLanguageCodeError extends Error {
	constructor() {
		super("iso must be an assigned lowercase ISO 639-1 code");
		this.name = "InvalidCollectionLanguageCodeError";
	}
}

export class InvalidCollectionTextError extends Error {
	constructor(public readonly field: "name" | "description" | "imgUrl") {
		super(`${field} must contain at least one non-whitespace character`);
		this.name = "InvalidCollectionTextError";
	}
}
