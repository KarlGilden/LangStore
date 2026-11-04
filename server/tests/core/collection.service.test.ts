import { describe, expect, it, vi } from "vitest";
import type { CollectionRepository } from "../../src/core/repositories/collection.repository.js";
import { createCollectionService } from "../../src/core/services/collection.service.js";
import type { UserService } from "../../src/core/services/user.service.js";
import type { UserSettingsService } from "../../src/core/services/user-settings.service.js";

const user = {
	id: "4fd7d240-cbce-4735-bfd9-a1f62347c29e",
	providerId: "provider_authenticated",
	username: null,
	email: "reader@example.com",
	createdAt: new Date("2026-11-04T12:00:00.000Z"),
};

function createDependencies() {
	const collectionRepository: CollectionRepository = {
		create: vi.fn(),
		findByIdForUser: vi.fn(),
		updateForUser: vi.fn(),
		listByUserAndIso: vi.fn(),
	};
	const userService = {
		getOrCreateUser: vi.fn().mockResolvedValue(user),
	} as unknown as UserService;
	const userSettingsService = {
		getSettingsForUser: vi.fn().mockResolvedValue({
			userId: user.id,
			targetLanguage: "de",
			userLanguage: "en",
		}),
	} as unknown as UserSettingsService;

	return { collectionRepository, userService, userSettingsService };
}

describe("CollectionService", () => {
	it("creates a collection owned by the authenticated user", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.collectionRepository.create).mockImplementation(
			async (input) => ({
				id: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
				...input,
			}),
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await expect(
			service.createCollection("provider_authenticated", {
				name: "Der Vorleser",
				description: "A reading collection",
				iso: "de",
			}),
		).resolves.toMatchObject({
			userId: user.id,
			name: "Der Vorleser",
			imgUrl: null,
			iso: "de",
		});
		expect(dependencies.userService.getOrCreateUser).toHaveBeenCalledWith(
			"provider_authenticated",
		);
		expect(dependencies.collectionRepository.create).toHaveBeenCalledWith({
			name: "Der Vorleser",
			description: "A reading collection",
			imgUrl: null,
			userId: user.id,
			iso: "de",
		});
	});

	it.each(["zz", "DE", "eng"])(
		"rejects invalid collection language %s before resolving the user",
		async (iso) => {
			const dependencies = createDependencies();
			const service = createCollectionService(
				dependencies.collectionRepository,
				dependencies.userService,
				dependencies.userSettingsService,
			);

			await expect(
				service.createCollection("provider_authenticated", {
					name: "Book",
					iso,
				}),
			).rejects.toMatchObject({ name: "InvalidCollectionLanguageCodeError" });
			expect(dependencies.userService.getOrCreateUser).not.toHaveBeenCalled();
			expect(dependencies.collectionRepository.create).not.toHaveBeenCalled();
		},
	);

	it.each([
		["name", { name: "  ", iso: "de" }],
		["description", { name: "Book", description: "\t", iso: "de" }],
		["imgUrl", { name: "Book", imgUrl: " ", iso: "de" }],
	] as const)("rejects blank %s", async (field, input) => {
		const dependencies = createDependencies();
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await expect(
			service.createCollection("provider_authenticated", input),
		).rejects.toMatchObject({ name: "InvalidCollectionTextError", field });
	});

	it("gets a collection through an owner-scoped lookup", async () => {
		const dependencies = createDependencies();
		const collection = {
			id: "07572e8b-ad66-4e7c-bd42-cea9097fd142",
			name: "Der Vorleser",
			description: null,
			imgUrl: null,
			userId: user.id,
			iso: "de",
		};
		vi.mocked(dependencies.collectionRepository.findByIdForUser).mockResolvedValue(
			collection,
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await expect(
			service.getCollection("provider_authenticated", collection.id),
		).resolves.toEqual(collection);
		expect(
			dependencies.collectionRepository.findByIdForUser,
		).toHaveBeenCalledWith(collection.id, user.id);
	});

	it("returns not found when a collection is outside the authenticated owner scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.collectionRepository.findByIdForUser).mockResolvedValue(
			null,
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await expect(
			service.getCollection(
				"provider_authenticated",
				"07572e8b-ad66-4e7c-bd42-cea9097fd142",
			),
		).rejects.toMatchObject({ name: "CollectionNotFoundError" });
	});

	it("updates editable fields through an owner-scoped write", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.collectionRepository.updateForUser).mockImplementation(
			async (id, userId, input) => ({ id, userId, iso: "de", ...input }),
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await expect(
			service.updateCollection(
				"provider_authenticated",
				"07572e8b-ad66-4e7c-bd42-cea9097fd142",
				{ name: "Updated title" },
			),
		).resolves.toMatchObject({
			name: "Updated title",
			description: null,
			imgUrl: null,
			iso: "de",
		});
		expect(dependencies.collectionRepository.updateForUser).toHaveBeenCalledWith(
			"07572e8b-ad66-4e7c-bd42-cea9097fd142",
			user.id,
			{ name: "Updated title", description: null, imgUrl: null },
		);
	});

	it("returns not found instead of updating another user's collection", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.collectionRepository.updateForUser).mockResolvedValue(
			null,
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await expect(
			service.updateCollection(
				"provider_authenticated",
				"07572e8b-ad66-4e7c-bd42-cea9097fd142",
				{ name: "Updated title" },
			),
		).rejects.toMatchObject({ name: "CollectionNotFoundError" });
	});

	it("lists only the authenticated user's selected language", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.collectionRepository.listByUserAndIso).mockResolvedValue(
			[],
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
			dependencies.userSettingsService,
		);

		await service.listCollections("provider_authenticated");

		expect(dependencies.userSettingsService.getSettingsForUser).toHaveBeenCalledWith(
			user.id,
		);
		expect(
			dependencies.collectionRepository.listByUserAndIso,
		).toHaveBeenCalledWith(user.id, "de");
	});
});
