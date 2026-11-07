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

	getById(id: string, userId: string, iso: string): Promise<Collection | null>;

	update(
		id: string,
		userId: string,
		iso: string,
		input: UpdateCollectionInput,
	): Promise<Collection | null>;

	getAll(userId: string, iso: string): Promise<Collection[]>;
}
