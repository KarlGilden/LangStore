import {
	CollectionNotFoundError,
	InvalidCollectionLanguageCodeError,
	InvalidCollectionTextError,
} from "../errors/collection.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { CollectionRepository } from "../repositories/collection.repository.js";
import type { UserService } from "./user.service.js";
import type { UserSettingsService } from "./user-settings.service.js";

export interface CreateCollectionInput {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
	iso: string;
}

export interface UpdateCollectionInput {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
}

function requireNonBlank(
	field: "name" | "description" | "imgUrl",
	value: string,
): void {
	if (!/\S/u.test(value)) {
		throw new InvalidCollectionTextError(field);
	}
}

export const createCollectionService = (
	collectionRepository: CollectionRepository,
	userService: UserService,
	userSettingsService: UserSettingsService,
) => {
	const createCollection = async (
		providerId: string,
		input: CreateCollectionInput,
	) => {
		requireNonBlank("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requireNonBlank("description", input.description);
		}
		if (input.imgUrl !== undefined && input.imgUrl !== null) {
			requireNonBlank("imgUrl", input.imgUrl);
		}
		if (!isAssignedIso6391Code(input.iso)) {
			throw new InvalidCollectionLanguageCodeError();
		}

		const user = await userService.getOrCreateUser(providerId);
		return collectionRepository.create({
			name: input.name,
			description: input.description ?? null,
			imgUrl: input.imgUrl ?? null,
			userId: user.id,
			iso: input.iso,
		});
	};

	const getCollection = async (providerId: string, collectionId: string) => {
		const user = await userService.getOrCreateUser(providerId);
		const collection = await collectionRepository.findByIdForUser(
			collectionId,
			user.id,
		);

		if (!collection) {
			throw new CollectionNotFoundError();
		}

		return collection;
	};

	const updateCollection = async (
		providerId: string,
		collectionId: string,
		input: UpdateCollectionInput,
	) => {
		requireNonBlank("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requireNonBlank("description", input.description);
		}
		if (input.imgUrl !== undefined && input.imgUrl !== null) {
			requireNonBlank("imgUrl", input.imgUrl);
		}

		const user = await userService.getOrCreateUser(providerId);
		const collection = await collectionRepository.updateForUser(
			collectionId,
			user.id,
			{
				name: input.name,
				description: input.description ?? null,
				imgUrl: input.imgUrl ?? null,
			},
		);

		if (!collection) {
			throw new CollectionNotFoundError();
		}

		return collection;
	};

	const listCollections = async (providerId: string) => {
		const user = await userService.getOrCreateUser(providerId);
		const settings = await userSettingsService.getSettingsForUser(user.id);
		return collectionRepository.listByUserAndIso(
			user.id,
			settings.targetLanguage,
		);
	};

	return {
		createCollection,
		getCollection,
		updateCollection,
		listCollections,
	};
};

export type CollectionService = ReturnType<typeof createCollectionService>;
