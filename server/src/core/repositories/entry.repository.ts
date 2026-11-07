import type { Entry } from "../entities/entry.entity.js";

export interface CreateEntryInput {
	text: string;
	userId: string;
	iso: string;
	translations: { text: string }[];
}

export interface EntryRepository {
	create(input: CreateEntryInput): Promise<Entry>;

	getById(id: string, userId: string): Promise<Entry | null>;

	getByPages(
		texts: readonly string[],
		userId: string,
		iso: string,
	): Promise<Entry[]>;

	getAll(userId: string, iso: string): Promise<Entry[]>;
}
