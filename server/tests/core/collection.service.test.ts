import { describe, expect, it, vi } from "vitest";
import type { CollectionRepository } from "../../src/core/repositories/collection.repository.js";
import { createCollectionService } from "../../src/core/services/collection.service.js";
import type { UserService } from "../../src/core/services/user.service.js";

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
		findByIdForUserAndIso: vi.fn(),
		updateForUserAndIso: vi.fn(),
		listByUserAndIso: vi.fn(),
	};
	const userService = {
		getOrCreateUser: vi.fn().mockResolvedValue(user),
	} as unknown as UserService;
	return { collectionRepository, userService };
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
		);

		await expect(
			service.createCollection("provider_authenticated", "de", {
				name: "Der Vorleser",
				description: "A reading collection",
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
			);

			await expect(
				service.createCollection("provider_authenticated", iso, {
					name: "Book",
				}),
			).rejects.toMatchObject({ name: "InvalidCollectionLanguageCodeError" });
			expect(dependencies.userService.getOrCreateUser).not.toHaveBeenCalled();
			expect(dependencies.collectionRepository.create).not.toHaveBeenCalled();
		},
	);

	it.each([
		["name", { name: "  " }],
		["description", { name: "Book", description: "\t" }],
		["imgUrl", { name: "Book", imgUrl: " " }],
	] as const)("rejects blank %s", async (field, input) => {
		const dependencies = createDependencies();
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
		);

		await expect(
			service.createCollection("provider_authenticated", "de", input),
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
		vi.mocked(
			dependencies.collectionRepository.findByIdForUserAndIso,
		).mockResolvedValue(collection);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
		);

		await expect(
			service.getCollection("provider_authenticated", "de", collection.id),
		).resolves.toEqual(collection);
		expect(
			dependencies.collectionRepository.findByIdForUserAndIso,
		).toHaveBeenCalledWith(collection.id, user.id, "de");
	});

	it("returns not found when a collection is outside the authenticated owner scope", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.collectionRepository.findByIdForUserAndIso,
		).mockResolvedValue(null);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
		);

		await expect(
			service.getCollection(
				"provider_authenticated",
				"fr",
				"07572e8b-ad66-4e7c-bd42-cea9097fd142",
			),
		).rejects.toMatchObject({ name: "CollectionNotFoundError" });
	});

	it("updates editable fields through an owner-scoped write", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.collectionRepository.updateForUserAndIso,
		).mockImplementation(async (id, userId, iso, input) => ({
			id,
			userId,
			iso,
			...input,
		}));
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
		);

		await expect(
			service.updateCollection(
				"provider_authenticated",
				"de",
				"07572e8b-ad66-4e7c-bd42-cea9097fd142",
				{ name: "Updated title" },
			),
		).resolves.toMatchObject({
			name: "Updated title",
			description: null,
			imgUrl: null,
			iso: "de",
		});
		expect(
			dependencies.collectionRepository.updateForUserAndIso,
		).toHaveBeenCalledWith(
			"07572e8b-ad66-4e7c-bd42-cea9097fd142",
			user.id,
			"de",
			{ name: "Updated title", description: null, imgUrl: null },
		);
	});

	it("returns not found instead of updating another user's collection", async () => {
		const dependencies = createDependencies();
		vi.mocked(
			dependencies.collectionRepository.updateForUserAndIso,
		).mockResolvedValue(null);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
		);

		await expect(
			service.updateCollection(
				"provider_authenticated",
				"fr",
				"07572e8b-ad66-4e7c-bd42-cea9097fd142",
				{ name: "Updated title" },
			),
		).rejects.toMatchObject({ name: "CollectionNotFoundError" });
	});

	it("lists only the explicitly requested language for the authenticated user", async () => {
		const dependencies = createDependencies();
		vi.mocked(dependencies.collectionRepository.listByUserAndIso).mockResolvedValue(
			[],
		);
		const service = createCollectionService(
			dependencies.collectionRepository,
			dependencies.userService,
		);

		await service.listCollections("provider_authenticated", "de");

		expect(
			dependencies.collectionRepository.listByUserAndIso,
		).toHaveBeenCalledWith(user.id, "de");
	});
});
