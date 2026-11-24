import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { InvalidEntryEncounterCountError } from "../../src/core/errors/entry-encounter.error.js";
import {
	EntryNotFoundError,
	InvalidEntrySelectionError,
} from "../../src/core/errors/entry.error.js";
import { PageNotFoundError } from "../../src/core/errors/page.error.js";
import type { Entry } from "../../src/core/entities/entry.entity.js";
import type { EntryRepository } from "../../src/core/repositories/entry.repository.js";
import { createEntryService } from "../../src/core/services/entry.service.js";

describe("EntryService.savePageEntries", () => {
	it("validates the complete batch and delegates normalized selected entries", async () => {
		const context = createTestContext();
		const inputs = [
			{
				text: "haus",
				count: 3,
				translations: [
					{ text: "house" },
					{ text: "" },
					{ text: "house" },
				],
			},
		];

		await context.service.savePageEntries(
			context.userId,
			"de",
			context.pageId,
			inputs,
		);

		expect(context.savePageEntries).toHaveBeenCalledWith({
			userId: context.userId,
			iso: "de",
			pageId: context.pageId,
			entries: [
				{
					text: "haus",
					count: 3,
					translations: [{ text: "house" }],
				},
			],
		});
	});

	it("performs no persistence when any batch item is invalid", async () => {
		const context = createTestContext();

		await expect(
			context.service.savePageEntries(
				context.userId,
				"de",
				context.pageId,
				[
					{ text: "haus", count: 1 },
					{ text: "ging", count: 0 },
				],
			),
		).rejects.toBeInstanceOf(InvalidEntryEncounterCountError);
		expect(context.savePageEntries).not.toHaveBeenCalled();
	});

	it("rejects non-normalized or multiword selections before persistence", async () => {
		const context = createTestContext();

		await expect(
			context.service.savePageEntries(
				context.userId,
				"de",
				context.pageId,
				[{ text: "Haus Welt", count: 1 }],
			),
		).rejects.toBeInstanceOf(InvalidEntrySelectionError);
		expect(context.savePageEntries).not.toHaveBeenCalled();
	});

	it("delegates an empty selection so the repository still scopes the page", async () => {
		const context = createTestContext({ result: [] });

		await expect(
			context.service.savePageEntries(
				context.userId,
				"de",
				context.pageId,
				[],
			),
		).resolves.toEqual([]);
		expect(context.savePageEntries).toHaveBeenCalledWith({
			userId: context.userId,
			iso: "de",
			pageId: context.pageId,
			entries: [],
		});
	});

	it("preserves the repository's scoped page-not-found error", async () => {
		const context = createTestContext({ error: new PageNotFoundError() });

		await expect(
			context.service.savePageEntries(
				context.userId,
				"de",
				context.pageId,
				[{ text: "haus", count: 1 }],
			),
		).rejects.toBeInstanceOf(PageNotFoundError);
	});
});

describe("EntryService.deleteEntry", () => {
	it("delegates an owner- and language-scoped deletion", async () => {
		const deleteEntry = vi.fn(async () => true);
		const context = createTestContext({ deleteEntry });
		const entryId = randomUUID();

		await expect(
			context.service.deleteEntry(context.userId, "de", entryId),
		).resolves.toBeUndefined();
		expect(deleteEntry).toHaveBeenCalledWith(entryId, context.userId, "de");
	});

	it("reports a scoped missing entry", async () => {
		const context = createTestContext({
			deleteEntry: vi.fn(async () => false),
		});

		await expect(
			context.service.deleteEntry(context.userId, "de", randomUUID()),
		).rejects.toBeInstanceOf(EntryNotFoundError);
	});
});

function createTestContext(
	options: {
		result?: Entry[];
		error?: Error;
		deleteEntry?: EntryRepository["delete"];
	} = {},
) {
	const userId = randomUUID();
	const pageId = randomUUID();
	const result = options.result ?? [createEntry(userId)];
	const savePageEntries = vi.fn<EntryRepository["savePageEntries"]>(
		async () => {
			if (options.error) throw options.error;
			return result;
		},
	);
	const entryRepository = {
		create: vi.fn(),
		savePageEntries,
		getById: vi.fn(),
		getByPages: vi.fn(),
		getAll: vi.fn(),
		getAllForReview: vi.fn(),
		updateTranslations: vi.fn(),
		delete: options.deleteEntry ?? vi.fn(),
	} as unknown as EntryRepository;

	return {
		userId,
		pageId,
		savePageEntries,
		service: createEntryService({ entryRepository }),
	};
}

function createEntry(userId: string): Entry {
	return {
		id: randomUUID(),
		text: "haus",
		userId,
		iso: "de",
		createdAt: new Date("2026-11-24T12:00:00.000Z"),
		translations: [],
	};
}
