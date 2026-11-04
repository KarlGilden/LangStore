import type { Collection } from "../entities/collection.entity.js";

export interface CreateCollectionInput {
	name: string;
	description: string | null;
	imgUrl: string | null;
	userId: string;
	iso: string;
}

export interface UpdateCollectionInput {
	name: string;
	description: string | null;
	imgUrl: string | null;
}

export interface CollectionRepository {
	create(input: CreateCollectionInput): Promise<Collection>;

	findByIdForUserAndIso(
		id: string,
		userId: string,
		iso: string,
	): Promise<Collection | null>;

	updateForUserAndIso(
		id: string,
		userId: string,
		iso: string,
		input: UpdateCollectionInput,
	): Promise<Collection | null>;

	listByUserAndIso(userId: string, iso: string): Promise<Collection[]>;
}
