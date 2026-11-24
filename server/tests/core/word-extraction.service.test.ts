import { describe, expect, it } from "vitest";
import {
	createWordExtractionService,
	normaliseSentence,
} from "../../src/core/services/word-extraction.service.js";

describe("WordExtractionService", () => {
	it("returns every unique normalized word with its absolute count", () => {
		const service = createWordExtractionService();

		expect(
			service.extractWords("Haus haus HAUS ging Haus."),
		).toEqual([
			{ text: "haus", count: 4 },
			{ text: "ging", count: 1 },
		]);
	});

	it("preserves supported internal punctuation and keeps numeric tokens", () => {
		const service = createWordExtractionService();

		expect(service.extractWords("Don't E-Mail 123 Häuser don't")).toEqual([
			{ text: "don't", count: 2 },
			{ text: "e-mail", count: 1 },
			{ text: "123", count: 1 },
			{ text: "häuser", count: 1 },
		]);
	});

	it("returns no words for empty or punctuation-only text", () => {
		const service = createWordExtractionService();

		expect(service.extractWords(" \n... !!! ")).toEqual([]);
	});

	it("uses the same normalization representation exposed to selection validation", () => {
		expect(normaliseSentence("‘Haus’ HÄUSER E‑Mail")).toBe(
			"haus häuser e-mail",
		);
	});
});
