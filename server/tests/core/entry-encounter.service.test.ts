import { describe, expect, it, vi } from "vitest";
import type { EntryEncounterRepository } from "../../src/core/repositories/entry-encounter.repository.js";
import type { EntryRepository } from "../../src/core/repositories/entry.repository.js";
import type { PageRepository } from "../../src/core/repositories/page.repository.js";
import { createEntryEncounterService } from "../../src/core/services/entry-encounter.service.js";
import type { UserService } from "../../src/core/services/user.service.js";

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
	translations: [],
};
const page = {
	id: "d6b3df44-bfd1-4ac6-9e7c-6d828a235f0c",
	userId: user.id,
	collectionId: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
	name: "Page 1",
	description: null,
	summary: null,
	createdAt: new Date("2026-11-05T12:00:00.000Z"),
};
const encounter = {
	id: "f93f0f16-ff92-47f0-b4de-e9d454a34102",
	entryId: entry.id,
	pageId: page.id,
	count: 3,
	createdAt: new Date("2026-11-05T12:00:00.000Z"),
};

function createDependencies() {
	const entryEncounterRepository: EntryEncounterRepository = {
		record: vi.fn(),
		listPageVocabulary: vi.fn(),
	};
	const entryRepository: EntryRepository = {
		create: vi.fn(),
		findByIdForUser: vi.fn().mockResolvedValue(entry),
		listByUserAndIso: vi.fn(),
	};
	const pageRepository: PageRepository = {
		create: vi.fn(),
		findByIdForUserAndIso: vi.fn().mockResolvedValue(page),
		listByCollectionForUserAndIso: vi.fn(),
		findLatestByUserAndIso: vi.fn(),
	};
	const userService = {
		getOrCreateUser: vi.fn().mockResolvedValue(user),
	} as unknown as UserService;
	return {
		entryEncounterRepository,
		entryRepository,
		pageRepository,
		userService,
	};
}

function createService(dependencies: ReturnType<typeof createDependencies>) {
	return createEntryEncounterService(
		dependencies.entryEncounterRepository,
		dependencies.entryRepository,
		dependencies.pageRepository,
		dependencies.userService,
	);
}

describe("EntryEncounterService", () => {
	it("records an absolute count for an owned entry and same-language page", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.entryEncounterRepository.record).mockResolvedValue(
			encounter,
		);
		const service = createService(dependencies);

		await expect(
			service.recordEncounter(user.providerId, {
				entryId: entry.id,
				pageId: page.id,
				count: 3,
			}),
		).resolves.toEqual(encounter);
		expect(
			dependencies.pageRepository.findByIdForUserAndIso,
		).toHaveBeenCalledWith(page.id, user.id, entry.iso);
		expect(dependencies.entryEncounterRepository.record).toHaveBeenCalledWith({
			entryId: entry.id,
			pageId: page.id,
			count: 3,
			userId: user.id,
		});
	});

	it("rejects a cross-user entry before writing", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.entryRepository.findByIdForUser).mockResolvedValue(null);
		const service = createService(dependencies);

		await expect(
			service.recordEncounter(user.providerId, {
				entryId: entry.id,
				pageId: page.id,
				count: 1,
			}),
		).rejects.toMatchObject({ name: "EntryNotFoundError" });
		expect(dependencies.entryEncounterRepository.record).not.toHaveBeenCalled();
	});

	it("rejects a cross-language page before writing", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.pageRepository.findByIdForUserAndIso,
		).mockResolvedValue(null);
		const service = createService(dependencies);

		await expect(
			service.recordEncounter(user.providerId, {
				entryId: entry.id,
				pageId: page.id,
				count: 1,
			}),
		).rejects.toMatchObject({ name: "PageNotFoundError" });
		expect(dependencies.entryEncounterRepository.record).not.toHaveBeenCalled();
	});

	it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
		"rejects invalid count %s",
		async (count) => {
			const dependencies = createDependencies();
			const service = createService(dependencies);
			await expect(
				service.recordEncounter(user.providerId, {
					entryId: entry.id,
					pageId: page.id,
					count,
				}),
			).rejects.toMatchObject({ name: "InvalidEntryEncounterCountError" });
			expect(dependencies.userService.getOrCreateUser).not.toHaveBeenCalled();
		},
	);

	it("retrieves vocabulary through owner and language scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.entryEncounterRepository.listPageVocabulary,
		).mockResolvedValue([{ entry, encounter }]);
		const service = createService(dependencies);

		await expect(
			service.getPageVocabulary(user.providerId, "de", page.id),
		).resolves.toEqual([{ entry, encounter }]);
		expect(
			dependencies.entryEncounterRepository.listPageVocabulary,
		).toHaveBeenCalledWith(page.id, user.id, "de");
	});

	it("returns not found for page vocabulary outside the caller scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.entryEncounterRepository.listPageVocabulary,
		).mockResolvedValue(null);
		const service = createService(dependencies);

		await expect(
			service.getPageVocabulary(user.providerId, "de", page.id),
		).rejects.toMatchObject({ name: "PageNotFoundError" });
	});
});
