import {
	CollectionNotFoundError,
	InvalidCollectionLanguageCodeError,
	InvalidCollectionTextError,
} from "../errors/collection.error.js";
import { isSupportedLanguageIso } from "@langstore/contracts";
import type { CollectionRepository } from "../repositories/collection.repository.js";

export type CollectionServiceDependencies = {
	collectionRepository: CollectionRepository;
};

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
	if (!isSupportedLanguageIso(iso)) {
		throw new InvalidCollectionLanguageCodeError();
	}
}

export const createCollectionService = ({
	collectionRepository,
}: CollectionServiceDependencies) => {
	const createCollection = async (
		userId: string,
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

		return collectionRepository.create({
			name: input.name,
			description: input.description ?? null,
			imgUrl: input.imgUrl ?? null,
			userId: userId,
			iso,
		});
	};

	const getCollection = async (
		userId: string,
		iso: string,
		collectionId: string,
	) => {
		requireLanguageCode(iso);
		const collection = await collectionRepository.getById(
			collectionId,
			userId,
			iso,
		);

		if (!collection) {
			throw new CollectionNotFoundError();
		}

		return collection;
	};

	const updateCollection = async (
		userId: string,
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

		const collection = await collectionRepository.update(
			collectionId,
			userId,
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

	const getAllCollections = async (userId: string, iso: string) => {
		requireLanguageCode(iso);
		return collectionRepository.getAll(userId, iso);
	};

	const deleteCollection = async (
		userId: string,
		iso: string,
		collectionId: string,
	) => {
		requireLanguageCode(iso);
		const deleted = await collectionRepository.delete(
			collectionId,
			userId,
			iso,
		);

		if (!deleted) {
			throw new CollectionNotFoundError();
		}
	};

	return {
		createCollection,
		getCollection,
		updateCollection,
		getAllCollections,
		deleteCollection,
	};
};

export type CollectionService = ReturnType<typeof createCollectionService>;
