import { describe, expect, it, vi } from "vitest";
import type { EntryRepository } from "../../src/core/repositories/entry.repository.js";
import { createEntryService } from "../../src/core/services/entry.service.js";
import type { UserService } from "../../src/core/services/user.service.js";
import type { UserSettingsService } from "../../src/core/services/user-settings.service.js";

const user = {
	id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	providerId: "provider_authenticated",
	username: null,
	email: "reader@example.com",
	createdAt: new Date("2026-11-05T12:00:00.000Z"),
};

const entry = {
	id: "1197bff7-03e9-40b8-933d-faa88de99154",
	text: "ausgezeichnet",
	userId: user.id,
	iso: "de",
	createdAt: new Date("2026-11-05T12:00:00.000Z"),
	translations: [
		{
			id: "139ada60-7504-43f6-ac80-092d065f645e",
			text: "excellent",
			entryId: "1197bff7-03e9-40b8-933d-faa88de99154",
			createdAt: new Date("2026-11-05T12:00:00.000Z"),
		},
	],
};

function createDependencies(targetLanguage = "de") {
	const entryRepository: EntryRepository = {
		create: vi.fn(),
		findByIdForUser: vi.fn(),
		listByUserAndIso: vi.fn(),
	};
	const userService = {
		getOrCreateUser: vi.fn().mockResolvedValue(user),
	} as unknown as UserService;
	const userSettingsService = {
		getSettings: vi.fn().mockResolvedValue({
			userId: user.id,
			targetLanguage,
			userLanguage: "en",
		}),
	} as unknown as UserSettingsService;

	return { entryRepository, userService, userSettingsService };
}

function createService(dependencies: ReturnType<typeof createDependencies>) {
	return createEntryService(
		dependencies.entryRepository,
		dependencies.userService,
		dependencies.userSettingsService,
	);
}

describe("EntryService", () => {
	it("creates a selected entry and translations for the authenticated user's target language", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.entryRepository.create).mockResolvedValue(entry);
		const service = createService(dependencies);

		await expect(
			service.createEntry("provider_authenticated", {
				text: entry.text,
				translations: [{ text: "excellent" }],
			}),
		).resolves.toEqual(entry);
		expect(dependencies.userSettingsService.getSettings).toHaveBeenCalledWith(
			"provider_authenticated",
		);
		expect(dependencies.entryRepository.create).toHaveBeenCalledWith({
			text: entry.text,
			translations: [{ text: "excellent" }],
			userId: user.id,
			iso: "de",
		});
	});

	it("allows an entry to start without translations", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.entryRepository.create).mockResolvedValue({
			...entry,
			translations: [],
		});
		const service = createService(dependencies);

		await service.createEntry("provider_authenticated", { text: entry.text });

		expect(dependencies.entryRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ translations: [] }),
		);
	});

	it.each(["zz", "DE", "eng"])(
		"rejects invalid selected language %s",
		async (targetLanguage) => {
			const dependencies = createDependencies(targetLanguage);
			const service = createService(dependencies);

			await expect(
				service.createEntry("provider_authenticated", { text: entry.text }),
			).rejects.toMatchObject({ name: "InvalidEntryLanguageCodeError" });
			expect(dependencies.entryRepository.create).not.toHaveBeenCalled();
		},
	);

	it.each([
		["text", { text: "  " }],
		[
			"translation",
			{ text: "word", translations: [{ text: "valid" }, { text: "\t" }] },
		],
	] as const)("rejects blank %s", async (field, input) => {
		const dependencies = createDependencies();
		const service = createService(dependencies);

		await expect(
			service.createEntry("provider_authenticated", input),
		).rejects.toMatchObject({ name: "InvalidEntryTextError", field });
		expect(dependencies.userSettingsService.getSettings).not.toHaveBeenCalled();
	});

	it("retrieves detail through authenticated ownership", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.entryRepository.findByIdForUser).mockResolvedValue(
			entry,
		);
		const service = createService(dependencies);

		await expect(
			service.getEntry("provider_authenticated", entry.id),
		).resolves.toEqual(entry);
		expect(dependencies.entryRepository.findByIdForUser).toHaveBeenCalledWith(
			entry.id,
			user.id,
		);
	});

	it("returns not found for an entry outside the authenticated owner scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.entryRepository.findByIdForUser).mockResolvedValue(
			null,
		);
		const service = createService(dependencies);

		await expect(
			service.getEntry("provider_authenticated", entry.id),
		).rejects.toMatchObject({ name: "EntryNotFoundError" });
	});

	it("lists only the authenticated user's selected language", async () => {
		const dependencies = createDependencies("fr");
		vi.mocked(dependencies.entryRepository.listByUserAndIso).mockResolvedValue(
			[],
		);
		const service = createService(dependencies);

		await service.listEntries("provider_authenticated");

		expect(dependencies.entryRepository.listByUserAndIso).toHaveBeenCalledWith(
			user.id,
			"fr",
		);
	});
});
