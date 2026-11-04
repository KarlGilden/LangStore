import {
	CollectionNotFoundError,
	InvalidCollectionLanguageCodeError,
	InvalidCollectionTextError,
} from "../errors/collection.error.js";
import { isAssignedIso6391Code } from "../language/iso-639-1.js";
import type { CollectionRepository } from "../repositories/collection.repository.js";
import type { UserService } from "./user.service.js";

export interface CreateCollectionInput {
	name: string;
	description?: string | null;
	imgUrl?: string | null;
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

function requireLanguageCode(iso: string): void {
	if (!isAssignedIso6391Code(iso)) {
		throw new InvalidCollectionLanguageCodeError();
	}
}

export const createCollectionService = (
	collectionRepository: CollectionRepository,
	userService: UserService,
) => {
	const createCollection = async (
		providerId: string,
		iso: string,
		input: CreateCollectionInput,
	) => {
		requireNonBlank("name", input.name);
		if (input.description !== undefined && input.description !== null) {
			requireNonBlank("description", input.description);
		}
		if (input.imgUrl !== undefined && input.imgUrl !== null) {
			requireNonBlank("imgUrl", input.imgUrl);
		}
		requireLanguageCode(iso);

		const user = await userService.getOrCreateUser(providerId);
		return collectionRepository.create({
			name: input.name,
			description: input.description ?? null,
			imgUrl: input.imgUrl ?? null,
			userId: user.id,
			iso,
		});
	};

	const getCollection = async (
		providerId: string,
		iso: string,
		collectionId: string,
	) => {
		requireLanguageCode(iso);
		const user = await userService.getOrCreateUser(providerId);
		const collection = await collectionRepository.findByIdForUserAndIso(
			collectionId,
			user.id,
			iso,
		);

		if (!collection) {
			throw new CollectionNotFoundError();
		}

		return collection;
	};

	const updateCollection = async (
		providerId: string,
		iso: string,
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
		requireLanguageCode(iso);

		const user = await userService.getOrCreateUser(providerId);
		const collection = await collectionRepository.updateForUserAndIso(
			collectionId,
			user.id,
			iso,
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

	const listCollections = async (providerId: string, iso: string) => {
		requireLanguageCode(iso);
		const user = await userService.getOrCreateUser(providerId);
		return collectionRepository.listByUserAndIso(user.id, iso);
	};

	return {
		createCollection,
		getCollection,
		updateCollection,
		listCollections,
	};
};

export type CollectionService = ReturnType<typeof createCollectionService>;
