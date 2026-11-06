import { describe, expect, it, vi } from "vitest";
import type { EntryRepository } from "../../src/core/repositories/entry.repository.js";
import { createWordExtractionService } from "../../src/core/services/word-extraction.service.js";

const USER_ID = "user-1";
const ISO = "de";

function setup(savedWords: string[] = []) {
	// The service only reads `text` from the returned entries.
	const listByUserAndIso = vi
		.fn()
		.mockResolvedValue(savedWords.map((text) => ({ text })));

	const repository: EntryRepository = {
		create: vi.fn(),
		findByIdForUser: vi.fn(),
		findExactByTextsForUserAndIso: vi.fn(),
		listByUserAndIso,
	};

	return {
		service: createWordExtractionService(repository),
		listByUserAndIso,
	};
}

describe("WordExtractionService", () => {
	describe("when the user has no saved words", () => {
		it.each([
			["Haus haus HAUS", [{ text: "haus", count: 3 }]],
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
			[
				"l’amour l'amour co‑op co‐op co-op",
				[
					{ text: "l'amour", count: 2 },
					{ text: "co-op", count: 3 },
				],
			],
		] as const)(
			"extracts and counts words from %j",
			async (input, expected) => {
				const { service } = setup();

				expect(await service.extractWords(input, USER_ID, ISO)).toEqual(
					expected,
				);
			},
		);
	});

	describe("when filtering saved words", () => {
		it("looks up entries for the requested user and language", async () => {
			const { service, listByUserAndIso } = setup();

			await service.extractWords("Bonjour", "user-2", "fr");

			expect(listByUserAndIso).toHaveBeenCalledWith("user-2", "fr");
		});

		it("removes every occurrence of saved words and counts the rest", async () => {
			const { service } = setup(["haus", "und"]);

			const result = await service.extractWords(
				"Haus, Baum und HAUS. Baum! Wald.",
				USER_ID,
				ISO,
			);

			expect(result).toEqual([
				{ text: "baum", count: 2 },
				{ text: "wald", count: 1 },
			]);
		});

		it("filters normalized apostrophes and hyphens against saved entries", async () => {
			const { service } = setup(["l'amour", "co-op"]);

			const result = await service.extractWords(
				"L’amour l'amour co‑op co‐op co-op café",
				USER_ID,
				"fr",
			);

			expect(result).toEqual([{ text: "café", count: 1 }]);
		});

		it("only filters exact forms: saving 'gehen' does not hide 'ging'", async () => {
			const { service } = setup(["gehen"]);

			const result = await service.extractWords(
				"gehen ging ging",
				USER_ID,
				ISO,
			);

			expect(result).toEqual([{ text: "ging", count: 2 }]);
		});

		it("returns no suggestions when every word is already saved", async () => {
			const { service } = setup(["haus", "baum"]);

			expect(
				await service.extractWords("Haus Baum HAUS", USER_ID, ISO),
			).toEqual([]);
		});

		it("counts unsaved words across a 500-word page", async () => {
			const { service } = setup(["haus", "e-mail"]);
			const page = Array.from(
				{ length: 100 },
				() => "Haus welt don't E-Mail 123",
			).join("\n");

			expect(await service.extractWords(page, USER_ID, ISO)).toEqual([
				{ text: "welt", count: 100 },
				{ text: "don't", count: 100 },
				{ text: "123", count: 100 },
			]);
		});
	});
});
