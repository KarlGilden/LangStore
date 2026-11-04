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

	findByIdForUser(id: string, userId: string): Promise<Collection | null>;

	updateForUser(
		id: string,
		userId: string,
		input: UpdateCollectionInput,
	): Promise<Collection | null>;

	listByUserAndIso(userId: string, iso: string): Promise<Collection[]>;
}
