import type { Page } from "../entities/page.entity.js";

export interface CreatePageInput {
	userId: string;
	collectionId: string;
	name: string;
	description: string | null;
	summary: string | null;
}

export interface UpdatePageInput {
	name: string;
	description: string | null;
}

export interface PageRepository {
	create(input: CreatePageInput): Promise<Page>;

	getById(id: string, userId: string, iso: string): Promise<Page | null>;

	update(
		id: string,
		userId: string,
		iso: string,
		input: UpdatePageInput,
	): Promise<Page | null>;

	delete(id: string, userId: string, iso: string): Promise<boolean>;

	getByCollection(
		collectionId: string,
		userId: string,
		iso: string,
	): Promise<Page[]>;

	getLatest(userId: string, iso: string): Promise<Page | null>;
}
