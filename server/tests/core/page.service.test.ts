import { describe, expect, it, vi } from "vitest";
import type { CollectionRepository } from "../../src/core/repositories/collection.repository.js";
import type { PageRepository } from "../../src/core/repositories/page.repository.js";
import { createPageService } from "../../src/core/services/page.service.js";
import type { UserService } from "../../src/core/services/user.service.js";

const user = {
	id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	providerId: "provider_authenticated",
	username: null,
	email: "reader@example.com",
	createdAt: new Date("2026-11-04T12:00:00.000Z"),
};

const collection = {
	id: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
	name: "Der Vorleser",
	description: null,
	imgUrl: null,
	userId: user.id,
	iso: "de",
};

const page = {
	id: "d6b3df44-bfd1-4ac6-9e7c-6d828a235f0c",
	userId: user.id,
	collectionId: collection.id,
	name: "Page 1",
	description: null,
	summary: null,
	createdAt: new Date("2026-11-04T12:00:00.000Z"),
};

function createDependencies() {
	const pageRepository: PageRepository = {
		create: vi.fn(),
		findByIdForUserAndIso: vi.fn(),
		listByCollectionForUserAndIso: vi.fn(),
		findLatestByUserAndIso: vi.fn(),
	};
	const collectionRepository: CollectionRepository = {
		create: vi.fn(),
		findByIdForUserAndIso: vi.fn().mockResolvedValue(collection),
		updateForUserAndIso: vi.fn(),
		listByUserAndIso: vi.fn(),
	};
	const userService = {
		getOrCreateUser: vi.fn().mockResolvedValue(user),
	} as unknown as UserService;

	return { pageRepository, collectionRepository, userService };
}

function createService(dependencies: ReturnType<typeof createDependencies>) {
	return createPageService(
		dependencies.pageRepository,
		dependencies.collectionRepository,
		dependencies.userService,
	);
}

describe("PageService", () => {
	it("creates a page only after resolving an owned collection in the requested language", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.pageRepository.create).mockResolvedValue(page);
		const service = createService(dependencies);

		await expect(
			service.createPage("provider_authenticated", "de", {
				id: page.id,
				collectionId: collection.id,
				name: page.name,
			}),
		).resolves.toEqual(page);
		expect(
			dependencies.collectionRepository.findByIdForUserAndIso,
		).toHaveBeenCalledWith(collection.id, user.id, "de");
		expect(dependencies.pageRepository.create).toHaveBeenCalledWith({
			id: page.id,
			userId: user.id,
			collectionId: collection.id,
			name: page.name,
			description: null,
		});
	});

	it("rejects a collection outside the authenticated owner or language scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.collectionRepository.findByIdForUserAndIso,
		).mockResolvedValue(null);
		const service = createService(dependencies);

		await expect(
			service.createPage("provider_authenticated", "fr", {
				id: page.id,
				collectionId: collection.id,
				name: page.name,
			}),
		).rejects.toMatchObject({ name: "CollectionNotFoundError" });
		expect(dependencies.pageRepository.create).not.toHaveBeenCalled();
	});

	it.each(["zz", "DE", "eng"])(
		"rejects invalid language %s before resolving the user",
		async (iso) => {
			const dependencies = createDependencies();
			const service = createService(dependencies);

			await expect(
				service.getPage("provider_authenticated", iso, page.id),
			).rejects.toMatchObject({ name: "InvalidPageLanguageCodeError" });
			expect(dependencies.userService.getOrCreateUser).not.toHaveBeenCalled();
		},
	);

	it("gets a page through owner and collection-language scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.pageRepository.findByIdForUserAndIso).mockResolvedValue(
			page,
		);
		const service = createService(dependencies);

		await expect(
			service.getPage("provider_authenticated", "de", page.id),
		).resolves.toEqual(page);
		expect(
			dependencies.pageRepository.findByIdForUserAndIso,
		).toHaveBeenCalledWith(page.id, user.id, "de");
	});

	it("returns not found for a page outside the caller scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.pageRepository.findByIdForUserAndIso).mockResolvedValue(
			null,
		);
		const service = createService(dependencies);

		await expect(
			service.getPage("provider_authenticated", "de", page.id),
		).rejects.toMatchObject({ name: "PageNotFoundError" });
	});

	it("lists pages only after verifying the parent collection scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.pageRepository.listByCollectionForUserAndIso,
		).mockResolvedValue([page]);
		const service = createService(dependencies);

		await expect(
			service.listCollectionPages(
				"provider_authenticated",
				"de",
				collection.id,
			),
		).resolves.toEqual([page]);
		expect(
			dependencies.pageRepository.listByCollectionForUserAndIso,
		).toHaveBeenCalledWith(collection.id, user.id, "de");
	});

	it("returns the latest page in the explicit language", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.pageRepository.findLatestByUserAndIso).mockResolvedValue(
			page,
		);
		const service = createService(dependencies);

		await expect(
			service.getLatestPage("provider_authenticated", "de"),
		).resolves.toEqual(page);
		expect(
			dependencies.pageRepository.findLatestByUserAndIso,
		).toHaveBeenCalledWith(user.id, "de");
	});
});
