export class InvalidPageUploadError extends Error {
	constructor(message = "A valid JPEG or PNG photo, name, and optional description are required") {
		super(message);
		this.name = "InvalidPageUploadError";
	}
}

export class PageUploadTooLargeError extends Error {
	constructor() {
		super("The page photo must not exceed 10,000,000 bytes");
		this.name = "PageUploadTooLargeError";
	}
}

export class EmptyRecognizedTextError extends Error {
	constructor() {
		super("No readable text was found in the page photo");
		this.name = "EmptyRecognizedTextError";
	}
}

export class TextRecognitionFailedError extends Error {
	constructor() {
		super("Text recognition is temporarily unavailable");
		this.name = "TextRecognitionFailedError";
	}
}
