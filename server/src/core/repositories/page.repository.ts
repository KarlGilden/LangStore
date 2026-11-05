import type { Page } from "../entities/page.entity.js";

export interface CreatePageInput {
	id: string;
	userId: string;
	collectionId: string;
	name: string;
	description: string | null;
	summary: string | null;
}

export interface PageRepository {
	create(input: CreatePageInput): Promise<Page>;

	findByIdForUserAndIso(
		id: string,
		userId: string,
		iso: string,
	): Promise<Page | null>;

	listByCollectionForUserAndIso(
		collectionId: string,
		userId: string,
		iso: string,
	): Promise<Page[]>;

	findLatestByUserAndIso(userId: string, iso: string): Promise<Page | null>;
}
