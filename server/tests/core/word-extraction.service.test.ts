import { describe, expect, it } from "vitest";
import { createWordExtractionService } from "../../src/core/services/word-extraction.service.js";

const service = createWordExtractionService();

describe("WordExtractionService", () => {
	it.each([
		["Haus haus HAUS", [{ text: "haus", count: 3 }]],
		[
			"Hallo,Welt!",
			[
				{ text: "hallo", count: 1 },
				{ text: "welt", count: 1 },
			],
		],
		["„Haus“", [{ text: "haus", count: 1 }]],
		[
			"don't E-Mail",
			[
				{ text: "don't", count: 1 },
				{ text: "e-mail", count: 1 },
			],
		],
		["Häuser", [{ text: "häuser", count: 1 }]],
		[
			"gehen ging",
			[
				{ text: "gehen", count: 1 },
				{ text: "ging", count: 1 },
			],
		],
		["123", [{ text: "123", count: 1 }]],
		["...", []],
	] as const)("normalizes the ING-03 example %#", (input, expected) => {
		expect(service.extractWords(input)).toEqual(expected);
	});

	it.each([
		[
			"  Alpha\n\tbeta  ",
			[
				{ text: "alpha", count: 1 },
				{ text: "beta", count: 1 },
			],
		],
		["...alpha!!!alpha???", [{ text: "alpha", count: 2 }]],
		[
			"'quoted' --hyphen-- ’curly’",
			[
				{ text: "quoted", count: 1 },
				{ text: "hyphen", count: 1 },
				{ text: "curly", count: 1 },
			],
		],
		[
			"Alice and 42 cats cat",
			[
				{ text: "alice", count: 1 },
				{ text: "and", count: 1 },
				{ text: "42", count: 1 },
				{ text: "cats", count: 1 },
				{ text: "cat", count: 1 },
			],
		],
		["\n\t !!! ——— ", []],
	] as const)("handles tokenizer boundary case %#", (input, expected) => {
		expect(service.extractWords(input)).toEqual(expected);
	});

	it("preserves the documented internal apostrophes and hyphens without equating them", () => {
		expect(service.extractWords("l'amour l’amour co-op co‐op co‑op")).toEqual([
			{ text: "l'amour", count: 1 },
			{ text: "l’amour", count: 1 },
			{ text: "co-op", count: 1 },
			{ text: "co‐op", count: 1 },
			{ text: "co‑op", count: 1 },
		]);
	});

	it("normalizes exactly one word for shared creation validation", () => {
		expect(service.normalizeWord(" „HAUS!“ ")).toBe("haus");
		expect(service.normalizeWord("New York")).toBeNull();
		expect(service.normalizeWord("... ")).toBeNull();
	});

	it("counts a synthetic 500-word fixture deterministically", () => {
		const fixture = Array.from(
			{ length: 100 },
			() => "Haus welt don't E-Mail 123",
		).join("\n");

		expect(service.extractWords(fixture)).toEqual([
			{ text: "haus", count: 100 },
			{ text: "welt", count: 100 },
			{ text: "don't", count: 100 },
			{ text: "e-mail", count: 100 },
			{ text: "123", count: 100 },
		]);
	});
});
