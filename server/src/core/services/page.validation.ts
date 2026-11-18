import {
	InvalidPageLanguageCodeError,
	InvalidPageTextError,
} from "../errors/page.error.js";
import { isSupportedLanguageIso } from "@langstore/contracts";

export function requirePageLanguageCode(iso: string): void {
	if (!isSupportedLanguageIso(iso)) {
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
