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

	getById(id: string, userId: string, iso: string): Promise<Page | null>;

	getByCollection(
		collectionId: string,
		userId: string,
		iso: string,
	): Promise<Page[]>;

	getLatest(userId: string, iso: string): Promise<Page | null>;
}
