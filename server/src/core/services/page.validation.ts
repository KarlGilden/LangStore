import {
	InvalidPageLanguageCodeError,
	InvalidPageTextError,
} from "../errors/page.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";

export function requirePageLanguageCode(iso: string): void {
	if (!isAssignedIso6391Code(iso)) {
		throw new InvalidPageLanguageCodeError();
	}
}

export function requirePageText(
	field: "name" | "description",
	value: string,
): void {
	if (!/\S/u.test(value)) {
		throw new InvalidPageTextError(field);
	}
}
